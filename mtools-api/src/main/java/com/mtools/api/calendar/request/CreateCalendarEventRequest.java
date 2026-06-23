package com.mtools.api.calendar.request;

public record CreateCalendarEventRequest(
		Integer calendarKey,
		String summary,
		String date,
		String endDate,
		String time,
		String endTime,
		Integer durationMinutes,
		String description
) {
}
