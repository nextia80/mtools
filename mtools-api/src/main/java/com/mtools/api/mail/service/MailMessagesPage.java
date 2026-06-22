package com.mtools.api.mail.service;

import java.util.List;

public record MailMessagesPage(
		List<MailMessage> messages,
		int pageSize,
		long totalCount,
		long unreadCount,
		long inboxTotalCount,
		String nextPageToken,
		boolean hasNext
) {
}
