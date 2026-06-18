package com.mtools.api.calendar.request;

public record UpdateCalendarEventRequest(
		int calendarKey,
		String summary,
		String description,
		Integer newCalendarKey
) {
}
