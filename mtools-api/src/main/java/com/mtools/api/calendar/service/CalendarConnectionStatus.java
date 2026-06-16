package com.mtools.api.calendar.service;

public record CalendarConnectionStatus(
		boolean connected,
		String email
) {
}
