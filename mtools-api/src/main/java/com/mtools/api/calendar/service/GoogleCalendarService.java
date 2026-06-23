package com.mtools.api.calendar.service;

import java.io.IOException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;

import com.google.api.client.auth.oauth2.BearerToken;
import com.google.api.client.auth.oauth2.ClientParametersAuthentication;
import com.google.api.client.auth.oauth2.Credential;
import com.google.api.client.auth.oauth2.TokenResponse;
import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeFlow;
import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeRequestUrl;
import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeTokenRequest;
import com.google.api.client.googleapis.auth.oauth2.GoogleClientSecrets;
import com.google.api.client.googleapis.json.GoogleJsonResponseException;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.GenericUrl;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.client.util.DateTime;
import com.google.api.services.calendar.CalendarScopes;
import com.google.api.services.calendar.model.CalendarList;
import com.google.api.services.calendar.model.CalendarListEntry;
import com.google.api.services.calendar.model.Event;
import com.google.api.services.calendar.model.EventDateTime;
import com.google.api.services.calendar.model.Events;
import com.google.api.services.oauth2.Oauth2;
import com.google.api.services.oauth2.model.Userinfo;
import com.mtools.api.calendar.config.GoogleOAuthProperties;
import com.mtools.api.calendar.dao.GoogleOAuthDao;

@Service
public class GoogleCalendarService {

	private static final List<String> SCOPES = List.of(
			CalendarScopes.CALENDAR,
			"https://www.googleapis.com/auth/userinfo.email"
	);
	private static final GsonFactory JSON_FACTORY = GsonFactory.getDefaultInstance();
	private static final Pattern CALENDAR_KEY_PATTERN = Pattern.compile("^(\\d+)\\.");
	private static final DateTimeFormatter YMD_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd");
	private static final String CALENDAR_WRITE_SCOPE_MESSAGE =
			"일정 추가 권한이 없습니다. 일정관리 메뉴에서 Google Calendar 연결을 해제한 뒤 다시 연결하세요.";
	private static final ZoneId CALENDAR_ZONE = ZoneId.systemDefault();

	private final GoogleOAuthProperties properties;
	private final GoogleOAuthDao googleOAuthDao;
	private final Map<String, Instant> pendingStates = new ConcurrentHashMap<>();
	private final NetHttpTransport httpTransport;

	public GoogleCalendarService(GoogleOAuthProperties properties, GoogleOAuthDao googleOAuthDao)
			throws Exception {
		this.properties = properties;
		this.googleOAuthDao = googleOAuthDao;
		this.httpTransport = GoogleNetHttpTransport.newTrustedTransport();
	}

	public String createAuthorizationUrl() {
		ensureConfigured();

		String state = UUID.randomUUID().toString();
		pendingStates.put(state, Instant.now().plusSeconds(600));

		return new GoogleAuthorizationCodeRequestUrl(
				properties.clientId(),
				properties.redirectUri(),
				SCOPES
		)
				.setState(state)
				.setAccessType("offline")
				.set("prompt", "consent")
				.build();
	}

	public String handleOAuthCallback(String code, String state) throws IOException {
		ensureConfigured();
		validateState(state);

		GoogleClientSecrets.Details details = new GoogleClientSecrets.Details()
				.setClientId(properties.clientId())
				.setClientSecret(properties.clientSecret());
		GoogleClientSecrets clientSecrets = new GoogleClientSecrets().setInstalled(details);
		new GoogleAuthorizationCodeFlow.Builder(
				httpTransport,
				JSON_FACTORY,
				clientSecrets,
				SCOPES
		).build();

		TokenResponse tokenResponse = new GoogleAuthorizationCodeTokenRequest(
				httpTransport,
				JSON_FACTORY,
				properties.clientId(),
				properties.clientSecret(),
				code,
				properties.redirectUri()
		).execute();

		Credential credential = buildCredential(
				tokenResponse.getAccessToken(),
				tokenResponse.getRefreshToken(),
				tokenResponse.getExpiresInSeconds()
		);
		String email = fetchEmail(credential);
		saveToken(tokenResponse, email);

		return email;
	}

	public CalendarConnectionStatus getConnectionStatus() {
		GoogleOAuthToken token = googleOAuthDao.find();

		if (token == null || token.accessToken() == null || token.accessToken().isBlank()) {
			return new CalendarConnectionStatus(false, null);
		}

		return new CalendarConnectionStatus(true, token.email());
	}

	public List<CalendarEvent> fetchEvents(Instant timeMin, Instant timeMax) throws IOException {
		return fetchEvents(timeMin, timeMax, (List<Integer>) null);
	}

	public List<CalendarEvent> fetchEvents(Instant timeMin, Instant timeMax, Integer calendarKey)
			throws IOException {
		if (calendarKey == null) {
			return fetchEvents(timeMin, timeMax, (List<Integer>) null);
		}

		return fetchEvents(timeMin, timeMax, List.of(calendarKey));
	}

	public List<CalendarEvent> fetchEvents(Instant timeMin, Instant timeMax, List<Integer> calendarKeys)
			throws IOException {
		Credential credential = getValidCredential();
		com.google.api.services.calendar.Calendar googleCalendar = buildGoogleCalendar(credential);
		List<CalendarListEntry> calendars = listVisibleCalendars(googleCalendar);
		Map<String, Integer> calendarKeyMap = buildCalendarKeyMap(calendars);
		List<CalendarEvent> result = new ArrayList<>();

		if (calendarKeys != null && !calendarKeys.isEmpty()) {
			for (Integer calendarKey : calendarKeys) {
				CalendarListEntry calendarEntry = findCalendarByKey(calendars, calendarKey);

				if (calendarEntry == null) {
					throw new IllegalArgumentException(
							"캘린더를 찾을 수 없습니다: " + calendarKey + ". (이름이 \""
									+ calendarKey + ".\" 로 시작하는지 gc c 로 확인하세요)"
					);
				}

				result.addAll(fetchEventsFromCalendar(
						googleCalendar,
						calendarEntry,
						timeMin,
						timeMax,
						calendarKeyMap
				));
			}
		} else {
			for (CalendarListEntry calendarEntry : calendars) {
				result.addAll(fetchEventsFromCalendar(
						googleCalendar,
						calendarEntry,
						timeMin,
						timeMax,
						calendarKeyMap
				));
			}
		}

		result.sort(Comparator.comparing(CalendarEvent::start));

		return result;
	}

	public CalendarEvent createEvent(
			Integer calendarKey,
			String summary,
			String dateYmd,
			String endDateYmd,
			String timeHm,
			String endTimeHm,
			Integer durationMinutes,
			String description
	) throws IOException {
		if (summary == null || summary.isBlank()) {
			throw new IllegalArgumentException("일정 제목을 입력하세요.");
		}

		Credential credential = getValidCredential();
		com.google.api.services.calendar.Calendar googleCalendar = buildGoogleCalendar(credential);
		List<CalendarListEntry> calendars = listVisibleCalendars(googleCalendar);
		CalendarListEntry calendarEntry = resolveCalendarEntry(calendars, calendarKey);

		if (calendarEntry == null) {
			if (calendarKey == null) {
				throw new IllegalArgumentException(
						"기본 캘린더를 찾을 수 없습니다. gc c 로 캘린더 목록을 확인하거나 -c 로 지정하세요."
				);
			}

			throw new IllegalArgumentException(
					"캘린더를 찾을 수 없습니다: " + calendarKey + ". (이름이 \""
							+ calendarKey + ".\" 로 시작하는지 gc c 로 확인하세요)"
			);
		}

		LocalDate date = dateYmd == null || dateYmd.isBlank()
				? LocalDate.now(CALENDAR_ZONE)
				: parseLocalDate(dateYmd);
		Event event = new Event().setSummary(summary.trim());

		if (description != null && !description.isBlank()) {
			event.setDescription(description.trim());
		}

		if (timeHm == null || timeHm.isBlank()) {
			String startDate = date.toString();
			LocalDate exclusiveEnd = endDateYmd == null || endDateYmd.isBlank()
					? date.plusDays(1)
					: parseLocalDate(endDateYmd).plusDays(1);
			event.setStart(new EventDateTime().setDate(new DateTime(startDate)));
			event.setEnd(new EventDateTime().setDate(new DateTime(exclusiveEnd.toString())));
		} else {
			LocalTime startTime = parseLocalTime(timeHm);
			ZonedDateTime start = ZonedDateTime.of(date, startTime, CALENDAR_ZONE);
			ZonedDateTime end = resolveEventEnd(start, endTimeHm, durationMinutes);
			event.setStart(new EventDateTime()
					.setDateTime(new DateTime(start.toInstant().toEpochMilli()))
					.setTimeZone(CALENDAR_ZONE.getId()));
			event.setEnd(new EventDateTime()
					.setDateTime(new DateTime(end.toInstant().toEpochMilli()))
					.setTimeZone(CALENDAR_ZONE.getId()));
		}

		try {
			Event created = googleCalendar.events()
					.insert(calendarEntry.getId(), event)
					.execute();

			return toCalendarEvent(created, calendarEntry, buildCalendarKeyMap(calendars));
		} catch (GoogleJsonResponseException exception) {
			if (exception.getStatusCode() == 403) {
				throw new IllegalStateException(CALENDAR_WRITE_SCOPE_MESSAGE);
			}

			throw exception;
		}
	}

	public CalendarEvent updateEvent(
			String eventId,
			int calendarKey,
			String summary,
			String description,
			Integer newCalendarKey
	) throws IOException {
		if (eventId == null || eventId.isBlank()) {
			throw new IllegalArgumentException("일정 ID를 입력하세요.");
		}

		boolean hasSummary = summary != null && !summary.isBlank();
		boolean hasDescription = description != null;
		boolean hasMove = newCalendarKey != null;

		if (!hasSummary && !hasDescription && !hasMove) {
			throw new IllegalArgumentException("수정할 항목(-t, -d, -c)을 하나 이상 지정하세요.");
		}

		Credential credential = getValidCredential();
		com.google.api.services.calendar.Calendar googleCalendar = buildGoogleCalendar(credential);
		List<CalendarListEntry> calendars = listVisibleCalendars(googleCalendar);
		Map<String, Integer> calendarKeyMap = buildCalendarKeyMap(calendars);
		CalendarListEntry sourceCalendar = findCalendarByKey(calendars, calendarKey);

		if (sourceCalendar == null) {
			throw new IllegalArgumentException(
					"캘린더를 찾을 수 없습니다: " + calendarKey + ". (이름이 \""
							+ calendarKey + ".\" 로 시작하는지 gc c 로 확인하세요)"
			);
		}

		try {
			if (hasMove) {
				CalendarListEntry destinationCalendar = findCalendarByKey(calendars, newCalendarKey);

				if (destinationCalendar == null) {
					throw new IllegalArgumentException(
							"캘린더를 찾을 수 없습니다: " + newCalendarKey + ". (이름이 \""
									+ newCalendarKey + ".\" 로 시작하는지 gc c 로 확인하세요)"
					);
				}

				Event moved = googleCalendar.events()
						.move(sourceCalendar.getId(), eventId, destinationCalendar.getId())
						.execute();
				sourceCalendar = destinationCalendar;
				eventId = moved.getId();
			}

			if (hasSummary || hasDescription) {
				Event patch = new Event();

				if (hasSummary) {
					patch.setSummary(summary.trim());
				}

				if (hasDescription) {
					patch.setDescription(description);
				}

				Event updated = googleCalendar.events()
						.patch(sourceCalendar.getId(), eventId, patch)
						.execute();

				return toCalendarEvent(updated, sourceCalendar, calendarKeyMap);
			}

			Event current = googleCalendar.events()
					.get(sourceCalendar.getId(), eventId)
					.execute();

			return toCalendarEvent(current, sourceCalendar, calendarKeyMap);
		} catch (GoogleJsonResponseException exception) {
			if (exception.getStatusCode() == 403) {
				throw new IllegalStateException(CALENDAR_WRITE_SCOPE_MESSAGE);
			}

			if (exception.getStatusCode() == 404) {
				throw new IllegalArgumentException("일정을 찾을 수 없습니다: " + eventId);
			}

			throw exception;
		}
	}

	public void deleteEvent(String eventId, int calendarKey) throws IOException {
		if (eventId == null || eventId.isBlank()) {
			throw new IllegalArgumentException("일정 ID를 입력하세요.");
		}

		Credential credential = getValidCredential();
		com.google.api.services.calendar.Calendar googleCalendar = buildGoogleCalendar(credential);
		List<CalendarListEntry> calendars = listVisibleCalendars(googleCalendar);
		CalendarListEntry calendarEntry = findCalendarByKey(calendars, calendarKey);

		if (calendarEntry == null) {
			throw new IllegalArgumentException(
					"캘린더를 찾을 수 없습니다: " + calendarKey + ". (이름이 \""
							+ calendarKey + ".\" 로 시작하는지 gc c 로 확인하세요)"
			);
		}

		try {
			googleCalendar.events()
					.delete(calendarEntry.getId(), eventId)
					.execute();
		} catch (GoogleJsonResponseException exception) {
			if (exception.getStatusCode() == 403) {
				throw new IllegalStateException(CALENDAR_WRITE_SCOPE_MESSAGE);
			}

			if (exception.getStatusCode() == 404) {
				throw new IllegalArgumentException("일정을 찾을 수 없습니다: " + eventId);
			}

			throw exception;
		}
	}

	private CalendarListEntry resolveCalendarEntry(List<CalendarListEntry> calendars, Integer calendarKey) {
		if (calendarKey != null) {
			return findCalendarByKey(calendars, calendarKey);
		}

		return calendars.stream()
				.filter(entry -> parseCalendarKey(entry.getSummary()) != null)
				.min(Comparator.comparing(entry -> parseCalendarKey(entry.getSummary())))
				.orElse(calendars.isEmpty() ? null : calendars.get(0));
	}

	private ZonedDateTime resolveEventEnd(
			ZonedDateTime start,
			String endTimeHm,
			Integer durationMinutes
	) {
		if (endTimeHm != null && !endTimeHm.isBlank()) {
			LocalTime endTime = parseLocalTime(endTimeHm);
			ZonedDateTime end = ZonedDateTime.of(start.toLocalDate(), endTime, CALENDAR_ZONE);

			if (!end.isAfter(start)) {
				throw new IllegalArgumentException("종료 시간은 시작 시간보다 뒤여야 합니다.");
			}

			return end;
		}

		if (durationMinutes != null && durationMinutes > 0) {
			return start.plusMinutes(durationMinutes);
		}

		return start.plusHours(1);
	}

	private Map<String, Integer> buildCalendarKeyMap(List<CalendarListEntry> calendars) {
		Map<String, Integer> keyMap = new HashMap<>();

		for (CalendarListEntry entry : calendars) {
			Integer key = parseCalendarKey(entry.getSummary());

			if (key != null) {
				keyMap.put(entry.getId(), key);
			}
		}

		return keyMap;
	}

	private Integer parseCalendarKey(String calendarName) {
		if (calendarName == null || calendarName.isBlank()) {
			return null;
		}

		Matcher matcher = CALENDAR_KEY_PATTERN.matcher(calendarName.trim());

		if (!matcher.find()) {
			return null;
		}

		return Integer.parseInt(matcher.group(1));
	}

	private CalendarListEntry findCalendarByKey(List<CalendarListEntry> calendars, int calendarKey) {
		for (CalendarListEntry entry : calendars) {
			String calendarName = entry.getSummary();

			if (calendarName == null || calendarName.isBlank()) {
				continue;
			}

			Integer key = parseCalendarKey(calendarName);

			if (key != null && key == calendarKey) {
				return entry;
			}
		}

		return null;
	}

	private LocalDate parseLocalDate(String dateYmd) {
		try {
			return LocalDate.parse(dateYmd, YMD_FORMATTER);
		} catch (DateTimeParseException exception) {
			throw new IllegalArgumentException("날짜는 YYYYMMDD 형식이어야 합니다.");
		}
	}

	private LocalTime parseLocalTime(String timeHm) {
		if (timeHm == null || !timeHm.matches("\\d{4}")) {
			throw new IllegalArgumentException("시간은 HHmm 형식이어야 합니다.");
		}

		int hour = Integer.parseInt(timeHm.substring(0, 2));
		int minute = Integer.parseInt(timeHm.substring(2, 4));

		if (hour > 23 || minute > 59) {
			throw new IllegalArgumentException("시간은 HHmm 형식이어야 합니다.");
		}

		return LocalTime.of(hour, minute);
	}

	public List<CalendarListItem> fetchCalendarList() throws IOException {
		Credential credential = getValidCredential();
		com.google.api.services.calendar.Calendar googleCalendar = buildGoogleCalendar(credential);
		List<CalendarListEntry> entries = listVisibleCalendars(googleCalendar);
		List<CalendarListItem> result = new ArrayList<>();

		for (CalendarListEntry entry : entries) {
			String calendarId = entry.getId();
			String calendarName = entry.getSummary();

			if (calendarName == null || calendarName.isBlank()) {
				calendarName = calendarId;
			}

			Integer key = parseCalendarKey(calendarName);

			if (key == null) {
				continue;
			}

			result.add(new CalendarListItem(key, calendarId, calendarName));
		}

		result.sort(Comparator.comparing(CalendarListItem::key));

		return result;
	}

	private com.google.api.services.calendar.Calendar buildGoogleCalendar(Credential credential) {
		return new com.google.api.services.calendar.Calendar.Builder(httpTransport, JSON_FACTORY, credential)
				.setApplicationName("mtools")
				.build();
	}

	private List<CalendarListEntry> listVisibleCalendars(
			com.google.api.services.calendar.Calendar googleCalendar
	) throws IOException {
		CalendarList calendarList = googleCalendar.calendarList().list().execute();

		if (calendarList.getItems() == null) {
			return List.of();
		}

		return calendarList.getItems().stream()
				.filter(entry -> !Boolean.TRUE.equals(entry.getHidden()))
				.filter(entry -> !isExcludedCalendar(entry))
				.toList();
	}

	private boolean isExcludedCalendar(CalendarListEntry entry) {
		String name = entry.getSummary();
		String calendarId = entry.getId();

		if (calendarId != null && calendarId.contains("holiday@group.v.calendar.google.com")) {
			return true;
		}

		if (name == null || name.isBlank()) {
			return false;
		}

		String normalized = name.toLowerCase(Locale.ROOT);

		return normalized.contains("달의 위상")
				|| normalized.contains("phases of the moon")
				|| normalized.contains("moon phases")
				|| normalized.contains("운동시설정보")
				|| normalized.contains("대한민국의 휴일")
				|| normalized.contains("holidays in south korea");
	}

	private List<CalendarEvent> fetchEventsFromCalendar(
			com.google.api.services.calendar.Calendar googleCalendar,
			CalendarListEntry calendarEntry,
			Instant timeMin,
			Instant timeMax,
			Map<String, Integer> calendarKeyMap
	) throws IOException {
		String calendarId = calendarEntry.getId();
		List<CalendarEvent> result = new ArrayList<>();
		String pageToken = null;

		do {
			Events events = googleCalendar.events().list(calendarId)
					.setTimeMin(new DateTime(timeMin.toEpochMilli()))
					.setTimeMax(new DateTime(timeMax.toEpochMilli()))
					.setOrderBy("startTime")
					.setSingleEvents(true)
					.setMaxResults(250)
					.setPageToken(pageToken)
					.execute();

			if (events.getItems() != null) {
				for (Event event : events.getItems()) {
					result.add(toCalendarEvent(event, calendarEntry, calendarKeyMap));
				}
			}

			pageToken = events.getNextPageToken();
		} while (pageToken != null && !pageToken.isBlank());

		return result;
	}

	public void disconnect() {
		googleOAuthDao.deleteAll();
	}

	private void saveToken(TokenResponse tokenResponse, String email) {
		LocalDateTime expiresAt = tokenResponse.getExpiresInSeconds() == null
				? LocalDateTime.now().plusHours(1)
				: LocalDateTime.now().plusSeconds(tokenResponse.getExpiresInSeconds());

		googleOAuthDao.upsert(
				tokenResponse.getAccessToken(),
				tokenResponse.getRefreshToken(),
				expiresAt,
				email
		);
	}

	private Credential getValidCredential() throws IOException {
		GoogleOAuthToken storedToken = googleOAuthDao.find();

		if (storedToken == null || storedToken.accessToken() == null || storedToken.accessToken().isBlank()) {
			throw new IllegalStateException("Google Calendar가 연결되어 있지 않습니다.");
		}

		Credential credential = buildCredential(
				storedToken.accessToken(),
				storedToken.refreshToken(),
				null
		);

		if (storedToken.expiresAt() != null) {
			credential.setExpirationTimeMilliseconds(
					storedToken.expiresAt().atZone(ZoneId.systemDefault()).toInstant().toEpochMilli()
			);
		}

		Long expiresInSeconds = credential.getExpiresInSeconds();

		if (expiresInSeconds != null && expiresInSeconds <= 60) {
			if (storedToken.refreshToken() == null || storedToken.refreshToken().isBlank()) {
				throw new IllegalStateException("Google Calendar 토큰이 만료되었습니다. 다시 연결해 주세요.");
			}

			credential.refreshToken();
			saveRefreshedToken(credential, storedToken.email());
		}

		return credential;
	}

	private Credential buildCredential(String accessToken, String refreshToken, Long expiresInSeconds) {
		Credential credential = new Credential.Builder(BearerToken.authorizationHeaderAccessMethod())
				.setTransport(httpTransport)
				.setJsonFactory(JSON_FACTORY)
				.setTokenServerUrl(new GenericUrl("https://oauth2.googleapis.com/token"))
				.setClientAuthentication(new ClientParametersAuthentication(
						properties.clientId(),
						properties.clientSecret()
				))
				.build()
				.setAccessToken(accessToken)
				.setRefreshToken(refreshToken);

		if (expiresInSeconds != null) {
			credential.setExpiresInSeconds(expiresInSeconds);
		}

		return credential;
	}

	private void saveRefreshedToken(Credential credential, String email) {
		LocalDateTime expiresAt = credential.getExpirationTimeMilliseconds() == null
				? LocalDateTime.now().plusHours(1)
				: LocalDateTime.ofInstant(
						Instant.ofEpochMilli(credential.getExpirationTimeMilliseconds()),
						ZoneId.systemDefault()
				);

		googleOAuthDao.upsert(
				credential.getAccessToken(),
				credential.getRefreshToken(),
				expiresAt,
				email
		);
	}

	private String fetchEmail(Credential credential) {
		try {
			Oauth2 oauth2 = new Oauth2.Builder(httpTransport, JSON_FACTORY, credential)
					.setApplicationName("mtools")
					.build();
			Userinfo userinfo = oauth2.userinfo().get().execute();

			return userinfo.getEmail();
		} catch (IOException exception) {
			return null;
		}
	}

	private CalendarEvent toCalendarEvent(
			Event event,
			CalendarListEntry calendarEntry,
			Map<String, Integer> calendarKeyMap
	) {
		EventDateTime start = event.getStart();
		EventDateTime end = event.getEnd();
		boolean allDay = start != null && start.getDate() != null;
		String startValue = formatEventDateTime(start, allDay);
		String endValue = formatEventDateTime(end, allDay);
		String calendarId = calendarEntry.getId();
		String calendarName = calendarEntry.getSummary();

		return new CalendarEvent(
				event.getId(),
				calendarKeyMap.get(calendarId),
				calendarId,
				calendarName == null || calendarName.isBlank() ? calendarId : calendarName,
				calendarEntry.getBackgroundColor(),
				calendarEntry.getForegroundColor(),
				event.getSummary() == null ? "(제목 없음)" : event.getSummary(),
				event.getDescription(),
				startValue,
				endValue == null ? startValue : endValue,
				allDay,
				event.getHtmlLink(),
				event.getLocation()
		);
	}

	private String formatEventDateTime(EventDateTime value, boolean allDay) {
		if (value == null) {
			return null;
		}

		if (allDay) {
			return value.getDate() == null ? null : value.getDate().toStringRfc3339();
		}

		return value.getDateTime() == null ? null : value.getDateTime().toStringRfc3339();
	}

	private void validateState(String state) {
		Instant expiresAt = pendingStates.remove(state);

		if (expiresAt == null || Instant.now().isAfter(expiresAt)) {
			throw new IllegalArgumentException("OAuth state가 유효하지 않습니다.");
		}
	}

	private void ensureConfigured() {
		if (!properties.isConfigured()) {
			throw new IllegalStateException(
					"Google OAuth 설정이 필요합니다. GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET 환경 변수를 설정하세요."
			);
		}
	}

	public Instant defaultTimeMin() {
		return Instant.now().truncatedTo(ChronoUnit.DAYS);
	}

	public Instant defaultTimeMax() {
		return Instant.now().plus(7, ChronoUnit.DAYS);
	}
}
