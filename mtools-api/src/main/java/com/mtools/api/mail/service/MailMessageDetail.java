package com.mtools.api.mail.service;

public record MailMessageDetail(
		String id,
		String threadId,
		String subject,
		String from,
		String date,
		String snippet,
		boolean unread,
		String bodyText,
		String bodyHtml
) {
}
