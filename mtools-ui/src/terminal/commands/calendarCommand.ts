import type {
  CalendarConnectionStatus,
  CalendarEvent,
  CalendarListItem,
  TerminalLineDraft,
} from '../../types'
import { fetchJson, requestJson } from '../apiClient'
import { buildDateRange, buildDayRange, getTodayYmd, parseYmd } from '../dateUtils'
import type { TerminalCommandResult } from '../types'

const CALENDAR_LIST_KEY_WIDTH = 8

const GC_USAGE =
  '사용법: gc | gc l | gc l <YYYYMMDD> | gc c | gc lc <키> | gc lc <키> <YYYYMMDD> | gc lcb <키> <YYYYMMDD> <YYYYMMDD> | gc a <키> <일정> | gc ad <키> <YYYYMMDD> <일정> | gc at <키> <YYYYMMDD> <HHmm> <일정>'

const formatCalendarList = (calendars: CalendarListItem[]): TerminalLineDraft[] => {
  if (calendars.length === 0) {
    return [{ type: 'output', text: '캘린더가 없습니다.' }]
  }

  return [...calendars]
    .sort((calendarA, calendarB) => calendarA.key - calendarB.key)
    .map((calendar) => ({
      type: 'output' as const,
      text: `${String(calendar.key).padEnd(CALENDAR_LIST_KEY_WIDTH)}${calendar.calendarName}`,
      clickValue: String(calendar.key),
    }))
}

const formatCalendarEvents = (events: CalendarEvent[]): TerminalLineDraft[] => {
  if (events.length === 0) {
    return [{ type: 'output', text: '일정이 없습니다.' }]
  }

  const lines: TerminalLineDraft[] = []
  let previousDate = ''

  for (const event of events) {
    const date = event.start.slice(0, 10)
    const groupBreak = previousDate !== '' && date !== previousDate

    previousDate = date

    lines.push({
      type: 'output',
      text: `${date} ${event.allDay ? '종일' : event.start.slice(11, 16)} | ${event.calendarName} | ${event.summary}`,
      groupBreak,
    })

    if (event.description) {
      lines.push({
        type: 'output',
        text: `    ${event.description.replace(/\n/g, '\n    ')}`,
      })
    }
  }

  return lines
}

const formatCreatedEventMessage = (event: CalendarEvent) => {
  const date = event.start.slice(0, 10)
  const timeLabel = event.allDay ? '종일' : event.start.slice(11, 16)

  return `일정 추가: ${event.summary} (${date} ${timeLabel})`
}

const ensureCalendarConnected = async (apiBaseUrl: string): Promise<TerminalLineDraft[] | null> => {
  const status = await fetchJson<CalendarConnectionStatus>(`${apiBaseUrl}/api/calendar/status`)

  if (!status.connected) {
    return [{ type: 'error', text: 'Google Calendar가 연결되지 않았습니다. 일정관리 메뉴에서 연결하세요.' }]
  }

  return null
}

const fetchGcCalendars = async (apiBaseUrl: string): Promise<TerminalLineDraft[]> => {
  const connectionError = await ensureCalendarConnected(apiBaseUrl)

  if (connectionError) {
    return connectionError
  }

  const calendars = await fetchJson<CalendarListItem[]>(`${apiBaseUrl}/api/calendar/calendars`)

  return formatCalendarList(calendars)
}

const fetchGcEvents = async (
  apiBaseUrl: string,
  timeMin?: string,
  timeMax?: string,
  calendarKey?: number,
): Promise<TerminalLineDraft[]> => {
  const connectionError = await ensureCalendarConnected(apiBaseUrl)

  if (connectionError) {
    return connectionError
  }

  const params = new URLSearchParams()

  if (timeMin) {
    params.set('timeMin', timeMin)
  }

  if (timeMax) {
    params.set('timeMax', timeMax)
  }

  if (calendarKey !== undefined) {
    params.set('calendarKey', String(calendarKey))
  }

  const query = params.toString()
  const url = `${apiBaseUrl}/api/calendar/events${query ? `?${query}` : ''}`
  const events = await fetchJson<CalendarEvent[]>(url)

  return formatCalendarEvents(events)
}

const fetchTodayGcEvents = async (apiBaseUrl: string) => {
  const range = buildDayRange(getTodayYmd())

  if (!range) {
    return [{ type: 'error' as const, text: '오늘 날짜를 계산하지 못했습니다.' }]
  }

  return fetchGcEvents(apiBaseUrl, range.timeMin, range.timeMax)
}

const createGcEvent = async (
  apiBaseUrl: string,
  calendarKey: number,
  summary: string,
  date?: string,
  time?: string,
): Promise<TerminalLineDraft[]> => {
  const connectionError = await ensureCalendarConnected(apiBaseUrl)

  if (connectionError) {
    return connectionError
  }

  const event = await requestJson<CalendarEvent>(`${apiBaseUrl}/api/calendar/events`, 'POST', {
    calendarKey,
    summary,
    date,
    time,
  })

  return [{ type: 'output', text: formatCreatedEventMessage(event) }]
}

export const executeGcCommand = async (
  trimmed: string,
  apiBaseUrl: string,
): Promise<TerminalCommandResult> => {
  if (trimmed.trim().toLowerCase() === 'gc') {
    return { lines: await fetchTodayGcEvents(apiBaseUrl) }
  }

  const rest = trimmed.replace(/^gc\s+/i, '').trim()

  if (!rest) {
    return { lines: [{ type: 'error', text: GC_USAGE }] }
  }

  if (/^c$/i.test(rest)) {
    return { lines: await fetchGcCalendars(apiBaseUrl) }
  }

  const atMatch = rest.match(/^at\s+(\d+)\s+(\d{8})\s+(\d{4})\s+(.+)$/i)

  if (atMatch?.[1] && atMatch[2] && atMatch[3] && atMatch[4]) {
    const summary = atMatch[4].trim()

    if (!summary) {
      return { lines: [{ type: 'error', text: '일정 제목을 입력하세요. 예: gc at 6 20260616 0930 회의' }] }
    }

    if (!parseYmd(atMatch[2])) {
      return { lines: [{ type: 'error', text: '날짜는 YYYYMMDD 형식이어야 합니다. 예: gc at 6 20260616 0930 회의' }] }
    }

    return {
      lines: await createGcEvent(
        apiBaseUrl,
        Number(atMatch[1]),
        summary,
        atMatch[2],
        atMatch[3],
      ),
    }
  }

  const adMatch = rest.match(/^ad\s+(\d+)\s+(\d{8})\s+(.+)$/i)

  if (adMatch?.[1] && adMatch[2] && adMatch[3]) {
    const summary = adMatch[3].trim()

    if (!summary) {
      return { lines: [{ type: 'error', text: '일정 제목을 입력하세요. 예: gc ad 6 20260616 휴가' }] }
    }

    if (!parseYmd(adMatch[2])) {
      return { lines: [{ type: 'error', text: '날짜는 YYYYMMDD 형식이어야 합니다. 예: gc ad 6 20260616 휴가' }] }
    }

    return {
      lines: await createGcEvent(apiBaseUrl, Number(adMatch[1]), summary, adMatch[2]),
    }
  }

  const aMatch = rest.match(/^a\s+(\d+)\s+(.+)$/i)

  if (aMatch?.[1] && aMatch[2]) {
    const summary = aMatch[2].trim()

    if (!summary) {
      return { lines: [{ type: 'error', text: '일정 제목을 입력하세요. 예: gc a 6 회의' }] }
    }

    return {
      lines: await createGcEvent(apiBaseUrl, Number(aMatch[1]), summary),
    }
  }

  const lcbMatch = rest.match(/^lcb\s+(\d+)\s+(\d{8})\s+(\d{8})$/i)

  if (lcbMatch?.[1] && lcbMatch[2] && lcbMatch[3]) {
    const calendarKey = Number(lcbMatch[1])
    const range = buildDateRange(lcbMatch[2], lcbMatch[3])

    if (!range) {
      return { lines: [{ type: 'error', text: '날짜는 YYYYMMDD 형식이어야 합니다. 예: gc lcb 6 20260601 20260607' }] }
    }

    if ('invalidOrder' in range) {
      return { lines: [{ type: 'error', text: '날짜 범위는 시작 날짜 ≤ 끝 날짜여야 합니다.' }] }
    }

    return { lines: await fetchGcEvents(apiBaseUrl, range.timeMin, range.timeMax, calendarKey) }
  }

  const lcMatch = rest.match(/^lc\s+(\d+)(?:\s+(\d{8}))?$/i)

  if (lcMatch?.[1]) {
    const calendarKey = Number(lcMatch[1])

    if (lcMatch[2]) {
      const range = buildDayRange(lcMatch[2])

      if (!range) {
        return {
          lines: [{ type: 'error', text: '날짜는 YYYYMMDD 형식이어야 합니다. 예: gc lc 0 20260615' }],
        }
      }

      return { lines: await fetchGcEvents(apiBaseUrl, range.timeMin, range.timeMax, calendarKey) }
    }

    return { lines: await fetchGcEvents(apiBaseUrl, undefined, undefined, calendarKey) }
  }

  const listMatch = rest.match(/^l(?:\s+(\d{8}))?$/i)

  if (!listMatch) {
    return { lines: [{ type: 'error', text: GC_USAGE }] }
  }

  if (listMatch[1]) {
    const range = buildDayRange(listMatch[1])

    if (!range) {
      return { lines: [{ type: 'error', text: '날짜는 YYYYMMDD 형식이어야 합니다. 예: gc l 20260615' }] }
    }

    return { lines: await fetchGcEvents(apiBaseUrl, range.timeMin, range.timeMax) }
  }

  return { lines: await fetchGcEvents(apiBaseUrl) }
}
