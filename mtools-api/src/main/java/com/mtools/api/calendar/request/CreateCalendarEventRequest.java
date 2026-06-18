package com.mtools.api.calendar.request;

public record CreateCalendarEventRequest(
		Integer calendarKey,
		String summary,
		String date,
		String time,
		String endTime,
		Integer durationMinutes
) {
}
