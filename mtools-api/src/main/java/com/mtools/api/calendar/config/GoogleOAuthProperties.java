package com.mtools.api.calendar.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.google")
public record GoogleOAuthProperties(
		String clientId,
		String clientSecret,
		String redirectUri,
		String frontendRedirectUrl,
		String mailRedirectUri
) {
	public boolean isConfigured() {
		return clientId != null && !clientId.isBlank()
				&& clientSecret != null && !clientSecret.isBlank();
	}

	public String resolvedMailRedirectUri() {
		if (mailRedirectUri != null && !mailRedirectUri.isBlank()) {
			return mailRedirectUri;
		}

		return "http://localhost:8080/api/mail/oauth/callback";
	}
}
