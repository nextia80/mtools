package com.mtools.api.calendar.service;

public record CalendarEvent(
		String id,
		String calendarId,
		String calendarName,
		String calendarBackgroundColor,
		String calendarForegroundColor,
		String summary,
		String description,
		String start,
		String end,
		boolean allDay,
		String htmlLink,
		String location
) {
}
