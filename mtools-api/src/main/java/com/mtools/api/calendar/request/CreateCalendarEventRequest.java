package com.mtools.api.calendar.request;

public record CreateCalendarEventRequest(
		int calendarKey,
		String summary,
		String date,
		String time
) {
}
