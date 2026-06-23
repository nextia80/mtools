package com.mtools.api.mail.controller;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.mtools.api.calendar.config.GoogleOAuthProperties;
import com.mtools.api.mail.service.GoogleGmailService;
import com.mtools.api.mail.service.MailConnectionStatus;
import com.mtools.api.mail.service.MailMessageDetail;
import com.mtools.api.mail.service.MailMessagesPage;

import jakarta.servlet.http.HttpServletResponse;

@RestController
public class MailController {

	private final GoogleGmailService googleGmailService;
	private final GoogleOAuthProperties properties;

	public MailController(GoogleGmailService googleGmailService, GoogleOAuthProperties properties) {
		this.googleGmailService = googleGmailService;
		this.properties = properties;
	}

	@GetMapping("/api/mail/auth-url")
	public Map<String, String> authUrl() {
		try {
			return Map.of("authUrl", googleGmailService.createAuthorizationUrl());
		} catch (IllegalStateException exception) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, exception.getMessage());
		}
	}

	@GetMapping("/api/mail/oauth/callback")
	public void oauthCallback(
			@RequestParam String code,
			@RequestParam String state,
			HttpServletResponse response
	) throws IOException {
		String redirectBase = properties.frontendRedirectUrl();

		try {
			googleGmailService.handleOAuthCallback(code, state);
			response.sendRedirect(redirectBase + "?view=mail&mail=connected");
		} catch (Exception exception) {
			String message = URLEncoder.encode(exception.getMessage(), StandardCharsets.UTF_8);
			response.sendRedirect(redirectBase + "?view=mail&mail=error&message=" + message);
		}
	}

	@GetMapping("/api/mail/status")
	public MailConnectionStatus status() {
		return googleGmailService.getConnectionStatus();
	}

	@GetMapping("/api/mail/messages")
	public MailMessagesPage messages(
			@RequestParam(required = false) Integer maxResults,
			@RequestParam(required = false, defaultValue = "false") boolean unreadOnly,
			@RequestParam(required = false) String readFilter,
			@RequestParam(required = false) String q,
			@RequestParam(required = false) String pageToken
	) {
		try {
			String resolvedFilter = readFilter;

			if (resolvedFilter == null || resolvedFilter.isBlank()) {
				resolvedFilter = unreadOnly ? "unread" : "all";
			}

			return googleGmailService.fetchMessages(maxResults, resolvedFilter, q, pageToken);
		} catch (IllegalStateException exception) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, exception.getMessage());
		} catch (IOException exception) {
			throw new ResponseStatusException(
					HttpStatus.BAD_GATEWAY,
					"Gmail 메일을 불러오지 못했습니다: " + exception.getMessage()
			);
		}
	}

	@GetMapping("/api/mail/messages/{messageId}")
	public MailMessageDetail message(
			@PathVariable String messageId,
			@RequestParam(required = false, defaultValue = "true") boolean markRead
	) {
		try {
			return googleGmailService.fetchMessageDetail(messageId, markRead);
		} catch (IllegalArgumentException exception) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, exception.getMessage());
		} catch (IllegalStateException exception) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, exception.getMessage());
		} catch (IOException exception) {
			throw new ResponseStatusException(
					HttpStatus.BAD_GATEWAY,
					"Gmail 메일 상세를 불러오지 못했습니다: " + exception.getMessage()
			);
		}
	}

	@PostMapping("/api/mail/messages/{messageId}/read")
	public Map<String, String> markMessageRead(@PathVariable String messageId) {
		try {
			googleGmailService.markMessageAsRead(messageId);
			return Map.of("status", "ok");
		} catch (IllegalArgumentException exception) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, exception.getMessage());
		} catch (IllegalStateException exception) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, exception.getMessage());
		} catch (IOException exception) {
			throw new ResponseStatusException(
					HttpStatus.BAD_GATEWAY,
					"Gmail 메일을 읽음 처리하지 못했습니다: " + exception.getMessage()
			);
		}
	}

	@PostMapping("/api/mail/messages/{messageId}/archive")
	public Map<String, String> archiveMessage(@PathVariable String messageId) {
		try {
			googleGmailService.archiveMessage(messageId);
			return Map.of("status", "ok");
		} catch (IllegalArgumentException exception) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, exception.getMessage());
		} catch (IllegalStateException exception) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, exception.getMessage());
		} catch (IOException exception) {
			throw new ResponseStatusException(
					HttpStatus.BAD_GATEWAY,
					"Gmail 메일을 보관 처리하지 못했습니다: " + exception.getMessage()
			);
		}
	}

	@DeleteMapping("/api/mail/messages/{messageId}")
	public Map<String, String> deleteMessage(@PathVariable String messageId) {
		try {
			googleGmailService.deleteMessage(messageId);
			return Map.of("status", "ok");
		} catch (IllegalArgumentException exception) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, exception.getMessage());
		} catch (IllegalStateException exception) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, exception.getMessage());
		} catch (IOException exception) {
			throw new ResponseStatusException(
					HttpStatus.BAD_GATEWAY,
					"Gmail 메일을 삭제하지 못했습니다: " + exception.getMessage()
			);
		}
	}

	@DeleteMapping("/api/mail/disconnect")
	public Map<String, String> disconnect() {
		googleGmailService.disconnect();
		return Map.of("status", "ok");
	}
}
