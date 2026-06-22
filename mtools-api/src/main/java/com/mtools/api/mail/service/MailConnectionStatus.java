package com.mtools.api.mail.service;

public record MailConnectionStatus(
		boolean connected,
		String email
) {
}
