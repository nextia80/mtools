package com.mtools.api.mail.service;

public record MailMessage(
		String id,
		String threadId,
		String subject,
		String from,
		String date,
		String snippet,
		boolean unread
) {
}
