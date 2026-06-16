package com.mtools.api.calendar.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.google")
public record GoogleOAuthProperties(
		String clientId,
		String clientSecret,
		String redirectUri,
		String frontendRedirectUrl
) {
	public boolean isConfigured() {
		return clientId != null && !clientId.isBlank()
				&& clientSecret != null && !clientSecret.isBlank();
	}
}
