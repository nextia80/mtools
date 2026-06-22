package com.mtools.api.mail.service;

import java.io.IOException;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;

import com.google.api.client.auth.oauth2.BearerToken;
import com.google.api.client.auth.oauth2.ClientParametersAuthentication;
import com.google.api.client.auth.oauth2.Credential;
import com.google.api.client.auth.oauth2.TokenResponse;
import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeFlow;
import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeRequestUrl;
import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeTokenRequest;
import com.google.api.client.googleapis.auth.oauth2.GoogleClientSecrets;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.GenericUrl;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.gmail.Gmail;
import com.google.api.services.gmail.GmailScopes;
import com.google.api.services.gmail.model.Label;
import com.google.api.services.gmail.model.ListMessagesResponse;
import com.google.api.services.gmail.model.Message;
import com.google.api.services.gmail.model.ModifyMessageRequest;
import com.google.api.services.gmail.model.MessagePart;
import com.google.api.services.gmail.model.MessagePartHeader;
import com.google.api.services.oauth2.Oauth2;
import com.google.api.services.oauth2.model.Userinfo;
import com.mtools.api.calendar.config.GoogleOAuthProperties;
import com.mtools.api.calendar.service.GoogleOAuthToken;
import com.mtools.api.mail.dao.GmailOAuthDao;

@Service
public class GoogleGmailService {

	private static final List<String> SCOPES = List.of(
			GmailScopes.GMAIL_MODIFY,
			"https://www.googleapis.com/auth/userinfo.email"
	);
	private static final GsonFactory JSON_FACTORY = GsonFactory.getDefaultInstance();
	private static final int DEFAULT_MAX_RESULTS = 10;
	private static final int MAX_RESULTS_LIMIT = 100;
	private static final String MAIL_MODIFY_SCOPE_MESSAGE =
			"메일 삭제 권한이 없습니다. 메일관리 메뉴에서 Gmail 연결을 해제한 뒤 다시 연결하세요.";

	private final GoogleOAuthProperties properties;
	private final GmailOAuthDao gmailOAuthDao;
	private final Map<String, Instant> pendingStates = new ConcurrentHashMap<>();
	private final NetHttpTransport httpTransport;

	public GoogleGmailService(GoogleOAuthProperties properties, GmailOAuthDao gmailOAuthDao)
			throws Exception {
		this.properties = properties;
		this.gmailOAuthDao = gmailOAuthDao;
		this.httpTransport = GoogleNetHttpTransport.newTrustedTransport();
	}

	public String createAuthorizationUrl() {
		ensureConfigured();

		String state = UUID.randomUUID().toString();
		pendingStates.put(state, Instant.now().plusSeconds(600));

		return new GoogleAuthorizationCodeRequestUrl(
				properties.clientId(),
				properties.resolvedMailRedirectUri(),
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
				properties.resolvedMailRedirectUri()
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

	public MailConnectionStatus getConnectionStatus() {
		GoogleOAuthToken token = gmailOAuthDao.find();

		if (token == null || token.accessToken() == null || token.accessToken().isBlank()) {
			return new MailConnectionStatus(false, null);
		}

		return new MailConnectionStatus(true, token.email());
	}

	public MailMessagesPage fetchMessages(
			Integer maxResults,
			boolean unreadOnly,
			String pageToken
	) throws IOException {
		int limit = normalizeMaxResults(maxResults);
		Credential credential = getValidCredential();
		Gmail gmail = new Gmail.Builder(httpTransport, JSON_FACTORY, credential)
				.setApplicationName("mtools")
				.build();

		var listRequest = gmail.users().messages().list("me")
				.setMaxResults((long) limit);

		if (unreadOnly) {
			listRequest.setQ("is:unread in:inbox");
		} else {
			listRequest.setLabelIds(List.of("INBOX"));
		}

		if (pageToken != null && !pageToken.isBlank()) {
			listRequest.setPageToken(pageToken);
		}

		ListMessagesResponse listResponse = listRequest.execute();
		MailLabelCounts labelCounts = fetchLabelCounts(gmail);
		List<MailMessage> result = new ArrayList<>();

		if (listResponse.getMessages() != null) {
			for (Message messageRef : listResponse.getMessages()) {
				Message message = gmail.users().messages().get("me", messageRef.getId())
						.setFormat("metadata")
						.setMetadataHeaders(List.of("Subject", "From", "Date"))
						.execute();
				result.add(toMailMessage(message));
			}
		}

		String nextPageToken = listResponse.getNextPageToken();
		long totalCount = unreadOnly ? labelCounts.unreadCount() : labelCounts.inboxTotalCount();

		return new MailMessagesPage(
				result,
				limit,
				totalCount,
				labelCounts.unreadCount(),
				labelCounts.inboxTotalCount(),
				nextPageToken,
				nextPageToken != null && !nextPageToken.isBlank()
		);
	}

	private MailLabelCounts fetchLabelCounts(Gmail gmail) throws IOException {
		Label inbox = gmail.users().labels().get("me", "INBOX").execute();
		Label unread = gmail.users().labels().get("me", "UNREAD").execute();

		long inboxTotal = inbox.getMessagesTotal() == null ? 0L : inbox.getMessagesTotal();
		long unreadTotal = unread.getMessagesUnread() == null
				? (unread.getMessagesTotal() == null ? 0L : unread.getMessagesTotal())
				: unread.getMessagesUnread();

		return new MailLabelCounts(inboxTotal, unreadTotal);
	}

	private record MailLabelCounts(long inboxTotalCount, long unreadCount) {
	}

	public MailMessageDetail fetchMessageDetail(String messageId) throws IOException {
		if (messageId == null || messageId.isBlank()) {
			throw new IllegalArgumentException("메일 ID가 필요합니다.");
		}

		Credential credential = getValidCredential();
		Gmail gmail = new Gmail.Builder(httpTransport, JSON_FACTORY, credential)
				.setApplicationName("mtools")
				.build();
		Message message = gmail.users().messages().get("me", messageId)
				.setFormat("full")
				.execute();

		boolean unread = message.getLabelIds() != null && message.getLabelIds().contains("UNREAD");

		if (unread) {
			markMessageAsRead(gmail, messageId);
			unread = false;
		}

		MailHeaderValues headers = extractHeaders(message);
		MailBodyValues body = extractBody(message.getPayload());

		return new MailMessageDetail(
				message.getId(),
				message.getThreadId(),
				headers.subject(),
				headers.from(),
				headers.date(),
				message.getSnippet() == null ? "" : message.getSnippet(),
				unread,
				body.text(),
				body.html()
		);
	}

	private void markMessageAsRead(Gmail gmail, String messageId) throws IOException {
		ModifyMessageRequest request = new ModifyMessageRequest()
				.setRemoveLabelIds(List.of("UNREAD"));

		try {
			gmail.users().messages().modify("me", messageId, request).execute();
		} catch (com.google.api.client.googleapis.json.GoogleJsonResponseException exception) {
			if (exception.getStatusCode() == 403) {
				throw new IllegalStateException(MAIL_MODIFY_SCOPE_MESSAGE);
			}

			throw exception;
		}
	}

	public void deleteMessage(String messageId) throws IOException {
		if (messageId == null || messageId.isBlank()) {
			throw new IllegalArgumentException("메일 ID가 필요합니다.");
		}

		try {
			Gmail gmail = buildGmailClient();
			gmail.users().messages().trash("me", messageId).execute();
		} catch (com.google.api.client.googleapis.json.GoogleJsonResponseException exception) {
			if (exception.getStatusCode() == 403) {
				throw new IllegalStateException(MAIL_MODIFY_SCOPE_MESSAGE);
			}

			throw exception;
		}
	}

	private Gmail buildGmailClient() throws IOException {
		Credential credential = getValidCredential();

		return new Gmail.Builder(httpTransport, JSON_FACTORY, credential)
				.setApplicationName("mtools")
				.build();
	}

	private MailHeaderValues extractHeaders(Message message) {
		String subject = "(제목 없음)";
		String from = "(발신자 없음)";
		String date = "";

		if (message.getPayload() != null && message.getPayload().getHeaders() != null) {
			for (MessagePartHeader header : message.getPayload().getHeaders()) {
				String name = header.getName();
				String value = header.getValue();

				if (value == null || value.isBlank()) {
					continue;
				}

				if ("Subject".equalsIgnoreCase(name)) {
					subject = value;
				} else if ("From".equalsIgnoreCase(name)) {
					from = value;
				} else if ("Date".equalsIgnoreCase(name)) {
					date = value;
				}
			}
		}

		return new MailHeaderValues(subject, from, date);
	}

	private MailBodyValues extractBody(MessagePart payload) {
		if (payload == null) {
			return new MailBodyValues("", null);
		}

		String mimeType = payload.getMimeType() == null ? "" : payload.getMimeType();

		if (mimeType.equalsIgnoreCase("text/plain")) {
			return new MailBodyValues(decodeBodyData(payload), null);
		}

		if (mimeType.equalsIgnoreCase("text/html")) {
			String html = decodeBodyData(payload);

			return new MailBodyValues("", html.isBlank() ? null : html);
		}

		if (payload.getParts() == null || payload.getParts().isEmpty()) {
			String fallback = decodeBodyData(payload);

			return new MailBodyValues(fallback, null);
		}

		String plainText = "";
		String htmlText = null;

		for (MessagePart part : payload.getParts()) {
			MailBodyValues partBody = extractBody(part);

			if (plainText.isBlank() && !partBody.text().isBlank()) {
				plainText = partBody.text();
			}

			if (htmlText == null && partBody.html() != null && !partBody.html().isBlank()) {
				htmlText = partBody.html();
			}
		}

		return new MailBodyValues(plainText, htmlText);
	}

	private String decodeBodyData(MessagePart part) {
		if (part.getBody() == null || part.getBody().getData() == null || part.getBody().getData().isBlank()) {
			return "";
		}

		byte[] decoded = Base64.getUrlDecoder().decode(part.getBody().getData());

		return new String(decoded, java.nio.charset.StandardCharsets.UTF_8);
	}

	private record MailHeaderValues(String subject, String from, String date) {
	}

	private record MailBodyValues(String text, String html) {
	}

	public void disconnect() {
		gmailOAuthDao.deleteAll();
	}

	private MailMessage toMailMessage(Message message) {
		String subject = "(제목 없음)";
		String from = "(발신자 없음)";
		String date = "";

		if (message.getPayload() != null && message.getPayload().getHeaders() != null) {
			for (MessagePartHeader header : message.getPayload().getHeaders()) {
				String name = header.getName();
				String value = header.getValue();

				if (value == null || value.isBlank()) {
					continue;
				}

				if ("Subject".equalsIgnoreCase(name)) {
					subject = value;
				} else if ("From".equalsIgnoreCase(name)) {
					from = value;
				} else if ("Date".equalsIgnoreCase(name)) {
					date = value;
				}
			}
		}

		boolean unread = message.getLabelIds() != null && message.getLabelIds().contains("UNREAD");

		return new MailMessage(
				message.getId(),
				message.getThreadId(),
				subject,
				from,
				date,
				message.getSnippet() == null ? "" : message.getSnippet(),
				unread
		);
	}

	private int normalizeMaxResults(Integer maxResults) {
		if (maxResults == null || maxResults <= 0) {
			return DEFAULT_MAX_RESULTS;
		}

		return Math.min(maxResults, MAX_RESULTS_LIMIT);
	}

	private void saveToken(TokenResponse tokenResponse, String email) {
		LocalDateTime expiresAt = tokenResponse.getExpiresInSeconds() == null
				? LocalDateTime.now().plusHours(1)
				: LocalDateTime.now().plusSeconds(tokenResponse.getExpiresInSeconds());

		gmailOAuthDao.upsert(
				tokenResponse.getAccessToken(),
				tokenResponse.getRefreshToken(),
				expiresAt,
				email
		);
	}

	private Credential getValidCredential() throws IOException {
		GoogleOAuthToken storedToken = gmailOAuthDao.find();

		if (storedToken == null || storedToken.accessToken() == null || storedToken.accessToken().isBlank()) {
			throw new IllegalStateException("Gmail이 연결되어 있지 않습니다.");
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
				throw new IllegalStateException("Gmail 토큰이 만료되었습니다. 다시 연결해 주세요.");
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

		gmailOAuthDao.upsert(
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
}
