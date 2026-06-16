package com.mtools.api.calendar.controller;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.mtools.api.calendar.config.GoogleOAuthProperties;
import com.mtools.api.calendar.request.CreateCalendarEventRequest;
import com.mtools.api.calendar.service.CalendarConnectionStatus;
import com.mtools.api.calendar.service.CalendarEvent;
import com.mtools.api.calendar.service.CalendarListItem;
import com.mtools.api.calendar.service.GoogleCalendarService;

import jakarta.servlet.http.HttpServletResponse;

@RestController
public class CalendarController {

	private final GoogleCalendarService googleCalendarService;
	private final GoogleOAuthProperties properties;

	public CalendarController(
			GoogleCalendarService googleCalendarService,
			GoogleOAuthProperties properties
	) {
		this.googleCalendarService = googleCalendarService;
		this.properties = properties;
	}

	@GetMapping("/api/calendar/auth-url")
	public Map<String, String> authUrl() {
		try {
			return Map.of("authUrl", googleCalendarService.createAuthorizationUrl());
		} catch (IllegalStateException exception) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, exception.getMessage());
		}
	}

	@GetMapping("/api/calendar/oauth/callback")
	public void oauthCallback(
			@RequestParam String code,
			@RequestParam String state,
			HttpServletResponse response
	) throws IOException {
		String redirectBase = properties.frontendRedirectUrl();

		try {
			googleCalendarService.handleOAuthCallback(code, state);
			response.sendRedirect(redirectBase + "?view=schedule&calendar=connected");
		} catch (Exception exception) {
			String message = URLEncoder.encode(exception.getMessage(), StandardCharsets.UTF_8);
			response.sendRedirect(redirectBase + "?view=schedule&calendar=error&message=" + message);
		}
	}

	@GetMapping("/api/calendar/status")
	public CalendarConnectionStatus status() {
		return googleCalendarService.getConnectionStatus();
	}

	@GetMapping("/api/calendar/calendars")
	public List<CalendarListItem> calendars() {
		try {
			return googleCalendarService.fetchCalendarList();
		} catch (IllegalStateException exception) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, exception.getMessage());
		} catch (IOException exception) {
			throw new ResponseStatusException(
					HttpStatus.BAD_GATEWAY,
					"Google Calendar 목록을 불러오지 못했습니다: " + exception.getMessage()
			);
		}
	}

	@PostMapping("/api/calendar/events")
	public CalendarEvent createEvent(@RequestBody CreateCalendarEventRequest request) {
		try {
			return googleCalendarService.createEvent(
					request.calendarKey(),
					request.summary(),
					request.date(),
					request.time()
			);
		} catch (IllegalArgumentException exception) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, exception.getMessage());
		} catch (IllegalStateException exception) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, exception.getMessage());
		} catch (IOException exception) {
			throw new ResponseStatusException(
					HttpStatus.BAD_GATEWAY,
					"Google Calendar 일정을 추가하지 못했습니다: " + exception.getMessage()
			);
		}
	}

	@GetMapping("/api/calendar/events")
	public List<CalendarEvent> events(
			@RequestParam(required = false) String timeMin,
			@RequestParam(required = false) String timeMax,
			@RequestParam(required = false) Integer calendarKey
	) {
		try {
			Instant min = timeMin == null || timeMin.isBlank()
					? googleCalendarService.defaultTimeMin()
					: Instant.parse(timeMin);
			Instant max = timeMax == null || timeMax.isBlank()
					? googleCalendarService.defaultTimeMax()
					: Instant.parse(timeMax);

			return googleCalendarService.fetchEvents(min, max, calendarKey);
		} catch (IllegalArgumentException exception) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, exception.getMessage());
		} catch (IllegalStateException exception) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, exception.getMessage());
		} catch (IOException exception) {
			throw new ResponseStatusException(
					HttpStatus.BAD_GATEWAY,
					"Google Calendar 일정을 불러오지 못했습니다: " + exception.getMessage()
			);
		}
	}

	@DeleteMapping("/api/calendar/disconnect")
	public Map<String, String> disconnect() {
		googleCalendarService.disconnect();
		return Map.of("status", "ok");
	}
}
