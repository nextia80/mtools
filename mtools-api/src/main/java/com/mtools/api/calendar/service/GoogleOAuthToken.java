package com.mtools.api.calendar.service;

import java.time.LocalDateTime;

public record GoogleOAuthToken(
		String accessToken,
		String refreshToken,
		LocalDateTime expiresAt,
		String email
) {
}
