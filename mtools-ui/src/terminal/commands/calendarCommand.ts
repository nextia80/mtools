import type {
  CalendarConnectionStatus,
  CalendarEvent,
  CalendarListItem,
  TerminalLineDraft,
} from '../../types'
import { fetchJson, requestJson } from '../apiClient'
import {
  buildDateRange,
  buildDayRange,
  buildMonthRange,
  buildMonthRangeBackward,
  buildMonthRangeForward,
  buildWeekRangeBackward,
  buildWeekRangeForward,
  buildYearRange,
  getTodayYmd,
  parseDottedYm,
  parseDottedYmd,
  parseDottedYear,
  parseYmd,
  toHmFromColon,
  toYmFromDotted,
  toYmdFromDotted,
} from '../dateUtils'
import { matchLike } from '../textUtils'
import type { TerminalCommandResult } from '../types'

const CALENDAR_LIST_KEY_WIDTH = 8
const EVENT_REF_WIDTH = 12

const GC_USAGE =
  '사용법: gc [-s 일자] [-c n[,n]] [-k "키워드"] | gc -l c | gc a -t "<제목>" [-s 일자] [-c n] [-d "<메모>"] | gc m <캘린더-MMDD-순번> [옵션] | gc r <캘린더-MMDD-순번>'

const EVENT_REF_PATTERN = /^(\d+)-(\d{4})-(\d+)$/

type CachedListedEvent = {
  ref: string
  id: string
  calendarKey: number
}

type EventWithRef = CalendarEvent & {
  ref: string
}

type ParsedDateArg = {
  timeMin?: string
  timeMax?: string
  error?: string
}

type ParsedTimeArg = {
  time?: string
  endTime?: string
  durationMinutes?: number
  error?: string
}

type GcQueryFlags = {
  listType?: 'c'
  schedule?: string
  calendarKeys?: number[]
  keyword?: string
  error?: string
}

type GcAddFlags = {
  title?: string
  schedule?: string
  calendarKey?: number
  description?: string
  error?: string
}

type ModifyOptions = {
  title?: string
  description?: string
  calendarKey?: number
}

let lastListedEvents: CachedListedEvent[] = []

const errorLines = (text: string): TerminalCommandResult => ({
  lines: [{ type: 'error', text }],
})

const consumeQuotedString = (
  input: string,
): { value: string; rest: string } | { error: string } => {
  const trimmed = input.trimStart()

  if (!trimmed.startsWith('"')) {
    return { error: '내용을 따옴표("")로 감싸세요.' }
  }

  let value = ''

  for (let index = 1; index < trimmed.length; index += 1) {
    const char = trimmed[index]

    if (char === '"') {
      return { value, rest: trimmed.slice(index + 1).trim() }
    }

    if (char === '\\' && index + 1 < trimmed.length) {
      value += trimmed[index + 1]
      index += 1
      continue
    }

    value += char
  }

  return { error: '닫는 따옴표가 없습니다.' }
}

const computeEndHm = (startHm: string, durationMinutes: number) => {
  const hour = Number(startHm.slice(0, 2))
  const minute = Number(startHm.slice(2, 4))
  const totalMinutes = hour * 60 + minute + durationMinutes
  const endHour = Math.floor(totalMinutes / 60) % 24
  const endMinute = totalMinutes % 60

  return `${String(endHour).padStart(2, '0')}${String(endMinute).padStart(2, '0')}`
}

const parseTodayDateArg = (): ParsedDateArg => {
  const range = buildDayRange(getTodayYmd())

  if (!range) {
    return { error: '오늘 날짜를 계산하지 못했습니다.' }
  }

  return { timeMin: range.timeMin, timeMax: range.timeMax }
}

const parseGcScheduleRange = (token: string): ParsedDateArg => {
  const trimmed = token.trim()

  if (trimmed === 'today') {
    return parseTodayDateArg()
  }

  if (trimmed === 'week') {
    const range = buildWeekRangeForward()

    if (!range) {
      return { error: '1주일 날짜 범위를 계산하지 못했습니다.' }
    }

    if ('invalidOrder' in range) {
      return { error: '날짜 범위를 계산하지 못했습니다.' }
    }

    return { timeMin: range.timeMin, timeMax: range.timeMax }
  }

  if (trimmed === '-week') {
    const range = buildWeekRangeBackward()

    if (!range) {
      return { error: '1주일 전 날짜 범위를 계산하지 못했습니다.' }
    }

    if ('invalidOrder' in range) {
      return { error: '날짜 범위를 계산하지 못했습니다.' }
    }

    return { timeMin: range.timeMin, timeMax: range.timeMax }
  }

  if (trimmed === 'month') {
    const range = buildMonthRangeForward()

    if (!range) {
      return { error: '한 달 날짜 범위를 계산하지 못했습니다.' }
    }

    if ('invalidOrder' in range) {
      return { error: '날짜 범위를 계산하지 못했습니다.' }
    }

    return { timeMin: range.timeMin, timeMax: range.timeMax }
  }

  if (trimmed === '-month') {
    const range = buildMonthRangeBackward()

    if (!range) {
      return { error: '한 달 전 날짜 범위를 계산하지 못했습니다.' }
    }

    if ('invalidOrder' in range) {
      return { error: '날짜 범위를 계산하지 못했습니다.' }
    }

    return { timeMin: range.timeMin, timeMax: range.timeMax }
  }

  if (trimmed.includes('~')) {
    const [fromRaw = '', toRaw = ''] = trimmed.split('~')

    if (parseDottedYmd(fromRaw) && parseDottedYmd(toRaw)) {
      const fromYmd = toYmdFromDotted(fromRaw)
      const toYmd = toYmdFromDotted(toRaw)

      if (!fromYmd || !toYmd) {
        return { error: '날짜 형식이 올바르지 않습니다. 예: gc -s 2026.01.01~2026.01.30' }
      }

      const range = buildDateRange(fromYmd, toYmd)

      if (!range) {
        return { error: '날짜 형식이 올바르지 않습니다. 예: gc -s 2026.01.01~2026.01.30' }
      }

      if ('invalidOrder' in range) {
        return { error: '날짜 범위는 시작 ≤ 끝 이어야 합니다.' }
      }

      return { timeMin: range.timeMin, timeMax: range.timeMax }
    }

    if (parseDottedYm(fromRaw) && parseDottedYm(toRaw)) {
      const fromYm = toYmFromDotted(fromRaw)
      const toYm = toYmFromDotted(toRaw)

      if (!fromYm || !toYm) {
        return { error: '년월 형식이 올바르지 않습니다. 예: gc -s 2026.01~2026.06' }
      }

      const range = buildMonthRange(fromYm, toYm)

      if (!range) {
        return { error: '년월 형식이 올바르지 않습니다. 예: gc -s 2026.01~2026.06' }
      }

      if ('invalidOrder' in range) {
        return { error: '년월 범위는 시작 ≤ 끝 이어야 합니다.' }
      }

      return { timeMin: range.timeMin, timeMax: range.timeMax }
    }

    if (parseDottedYear(fromRaw) && parseDottedYear(toRaw)) {
      const range = buildYearRange(fromRaw, toRaw)

      if (!range) {
        return { error: '년도 형식이 올바르지 않습니다. 예: gc -s 2025~2026' }
      }

      if ('invalidOrder' in range) {
        return { error: '년도 범위는 시작 ≤ 끝 이어야 합니다.' }
      }

      return { timeMin: range.timeMin, timeMax: range.timeMax }
    }

    return { error: '기간 형식을 확인하세요. 예: 2026.01.01~2026.01.30, 2026.01~2026.06, 2025~2026' }
  }

  if (parseDottedYmd(trimmed)) {
    const ymd = toYmdFromDotted(trimmed)

    if (!ymd) {
      return { error: '날짜 형식이 올바르지 않습니다. 예: gc -s 2026.01.01' }
    }

    const range = buildDayRange(ymd)

    if (!range) {
      return { error: '날짜 형식이 올바르지 않습니다. 예: gc -s 2026.01.01' }
    }

    return { timeMin: range.timeMin, timeMax: range.timeMax }
  }

  if (parseDottedYm(trimmed)) {
    const ym = toYmFromDotted(trimmed)

    if (!ym) {
      return { error: '년월 형식이 올바르지 않습니다. 예: gc -s 2026.06' }
    }

    const range = buildMonthRange(ym, ym)

    if (!range) {
      return { error: '년월 형식이 올바르지 않습니다. 예: gc -s 2026.06' }
    }

    if ('invalidOrder' in range) {
      return { error: '년월 범위를 계산하지 못했습니다.' }
    }

    return { timeMin: range.timeMin, timeMax: range.timeMax }
  }

  if (parseDottedYear(trimmed)) {
    const range = buildYearRange(trimmed, trimmed)

    if (!range) {
      return { error: '년도 형식이 올바르지 않습니다. 예: gc -s 2026' }
    }

    if ('invalidOrder' in range) {
      return { error: '년도 범위를 계산하지 못했습니다.' }
    }

    return { timeMin: range.timeMin, timeMax: range.timeMax }
  }

  return {
    error:
      '일자 형식: today, week, -week, month, -month, yyyy, yyyy~yyyy, yyyy.mm, yyyy.mm~yyyy.mm, yyyy.mm.dd, yyyy.mm.dd~yyyy.mm.dd',
  }
}

const parseGcAddSchedule = (token: string): {
  date?: string
  dateEnd?: string
  time?: string
  endTime?: string
  durationMinutes?: number
  error?: string
} => {
  const trimmed = token.trim()

  if (trimmed === 'today') {
    return { date: getTodayYmd() }
  }

  const rangeMatch = trimmed.match(/^(\d{4}\.\d{2}\.\d{2})~(\d{4}\.\d{2}\.\d{2})(?::.+)?$/)

  if (rangeMatch?.[1] && rangeMatch[2]) {
    const date = toYmdFromDotted(rangeMatch[1])
    const dateEnd = toYmdFromDotted(rangeMatch[2])

    if (!date || !dateEnd) {
      return { error: '날짜 형식이 올바르지 않습니다. 예: gc a -t "회의" -s 2026.01.01~2026.01.30' }
    }

    const range = buildDateRange(date, dateEnd)

    if (!range || 'invalidOrder' in range) {
      return { error: '날짜 범위는 시작 ≤ 끝 이어야 합니다.' }
    }

    return { date, dateEnd }
  }

  const timedDurationMatch = trimmed.match(/^(\d{4}\.\d{2}\.\d{2}):(\d{1,2}:\d{2})\+(\d+(?:\.\d+)?)h$/i)

  if (timedDurationMatch?.[1] && timedDurationMatch[2] && timedDurationMatch[3]) {
    const date = toYmdFromDotted(timedDurationMatch[1])
    const time = toHmFromColon(timedDurationMatch[2])
    const hours = Number(timedDurationMatch[3])

    if (!date || !time) {
      return { error: '날짜·시간 형식이 올바르지 않습니다. 예: gc a -t "회의" -s 2026.01.01:09:00+1h' }
    }

    if (!Number.isFinite(hours) || hours <= 0) {
      return { error: '시간 길이는 0보다 커야 합니다. 예: 2026.01.01:09:00+1h' }
    }

    return { date, time, durationMinutes: Math.round(hours * 60) }
  }

  const timedRangeMatch = trimmed.match(/^(\d{4}\.\d{2}\.\d{2}):(\d{1,2}:\d{2})~:(\d{1,2}:\d{2})$/)

  if (timedRangeMatch?.[1] && timedRangeMatch[2] && timedRangeMatch[3]) {
    const date = toYmdFromDotted(timedRangeMatch[1])
    const time = toHmFromColon(timedRangeMatch[2])
    const endTime = toHmFromColon(timedRangeMatch[3])

    if (!date || !time || !endTime) {
      return { error: '날짜·시간 형식이 올바르지 않습니다. 예: gc a -t "회의" -s 2026.01.01:09:00~:10:00' }
    }

    return { date, time, endTime }
  }

  const timedMatch = trimmed.match(/^(\d{4}\.\d{2}\.\d{2}):(\d{1,2}:\d{2})$/)

  if (timedMatch?.[1] && timedMatch[2]) {
    const date = toYmdFromDotted(timedMatch[1])
    const time = toHmFromColon(timedMatch[2])

    if (!date || !time) {
      return { error: '날짜·시간 형식이 올바르지 않습니다. 예: gc a -t "회의" -s 2026.01.01:09:00' }
    }

    return { date, time, durationMinutes: 60 }
  }

  if (parseDottedYmd(trimmed)) {
    const date = toYmdFromDotted(trimmed)

    if (!date) {
      return { error: '날짜 형식이 올바르지 않습니다. 예: gc a -t "회의" -s 2026.01.01' }
    }

    return { date }
  }

  return { error: '일정 일자 형식: today, yyyy.mm.dd, yyyy.mm.dd~yyyy.mm.dd, yyyy.mm.dd:hh:mm, yyyy.mm.dd:hh:mm~:hh:mm, yyyy.mm.dd:hh:mm+nh' }
}

const extractGcQueryFlags = (input: string): GcQueryFlags => {
  let rest = input.trim()
  const flags: GcQueryFlags = {}

  while (rest.length > 0) {
    const listMatch = rest.match(/^-l\s+(\S+)/i)

    if (listMatch?.[1]) {
      if (listMatch[1].toLowerCase() !== 'c') {
        return { error: '-l 옵션은 c(카테고리 리스트)만 지원합니다. 예: gc -l c' }
      }

      flags.listType = 'c'
      rest = rest.slice(listMatch[0].length).trim()
      continue
    }

    const scheduleMatch = rest.match(/^-s\s+(\S+)/i)

    if (scheduleMatch?.[1]) {
      flags.schedule = scheduleMatch[1]
      rest = rest.slice(scheduleMatch[0].length).trim()
      continue
    }

    const calendarMatch = rest.match(/^-c\s+(\d+(?:\s*,\s*\d+)*)/i)

    if (calendarMatch?.[1]) {
      flags.calendarKeys = calendarMatch[1].split(',').map((key) => Number(key.trim()))
      rest = rest.slice(calendarMatch[0].length).trim()
      continue
    }

    const keywordMatch = rest.match(/^-k\s+/i)

    if (keywordMatch) {
      const quoted = consumeQuotedString(rest.slice(keywordMatch[0].length))

      if ('error' in quoted) {
        return { error: '검색 키워드를 따옴표("")로 감싸세요.' }
      }

      flags.keyword = quoted.value
      rest = quoted.rest
      continue
    }

    if (rest.length > 0) {
      return { error: `알 수 없는 옵션: ${rest.split(/\s+/)[0]}` }
    }
  }

  return flags
}

const extractGcAddFlags = (input: string): GcAddFlags => {
  let rest = input.trim()
  const flags: GcAddFlags = {}

  while (rest.length > 0) {
    const titleMatch = rest.match(/^-t\s+/i)

    if (titleMatch) {
      const quoted = consumeQuotedString(rest.slice(titleMatch[0].length))

      if ('error' in quoted) {
        return { error: quoted.error }
      }

      flags.title = quoted.value
      rest = quoted.rest
      continue
    }

    const scheduleMatch = rest.match(/^-s\s+(\S+)/i)

    if (scheduleMatch?.[1]) {
      flags.schedule = scheduleMatch[1]
      rest = rest.slice(scheduleMatch[0].length).trim()
      continue
    }

    const calendarMatch = rest.match(/^-c\s+(\d+)/i)

    if (calendarMatch?.[1]) {
      flags.calendarKey = Number(calendarMatch[1])
      rest = rest.slice(calendarMatch[0].length).trim()
      continue
    }

    const descriptionMatch = rest.match(/^-d\s+/i)

    if (descriptionMatch) {
      const quoted = consumeQuotedString(rest.slice(descriptionMatch[0].length))

      if ('error' in quoted) {
        return { error: quoted.error }
      }

      flags.description = quoted.value
      rest = quoted.rest
      continue
    }

    return { error: `알 수 없는 옵션: ${rest.split(/\s+/)[0]}` }
  }

  return flags
}

const parseModifyOptions = (input: string): { options: ModifyOptions; error?: string } => {
  const parsed = extractGcAddFlags(input)
  const options: ModifyOptions = {}

  if (parsed.error) {
    return { options, error: parsed.error }
  }

  if (parsed.title !== undefined) {
    options.title = parsed.title
  }

  if (parsed.description !== undefined) {
    options.description = parsed.description
  }

  if (parsed.calendarKey !== undefined) {
    options.calendarKey = parsed.calendarKey
  }

  if (parsed.schedule !== undefined) {
    return { options, error: '일정 수정은 -s 일자 변경을 지원하지 않습니다. -t, -d, -c 만 사용하세요.' }
  }

  return { options }
}

const eventMatchesKeyword = (event: CalendarEvent, keyword: string) => {
  const pattern = keyword.trim().toLowerCase()

  if (!pattern) {
    return true
  }

  const fields = [
    event.summary,
    event.description ?? '',
    event.calendarName,
    event.location ?? '',
  ]

  return fields.some((field) => matchLike(field.toLowerCase(), pattern))
}

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

const parseCalendarKeyFromName = (calendarName: string): number | null => {
  const match = calendarName.trim().match(/^(\d+)\./)

  if (!match?.[1]) {
    return null
  }

  return Number(match[1])
}

const resolveEventCalendarKey = (event: CalendarEvent): number | null =>
  event.calendarKey ?? parseCalendarKeyFromName(event.calendarName)

const formatCalendarListHeader = (): TerminalLineDraft[] => [
  { type: 'output', text: '카테고리 번호 · 이름. 일정 키: 캘린더-MMDD-순번 (예: 1-0623-2)' },
]

const getEventDateYmd = (event: CalendarEvent) => event.start.slice(0, 10)

const getEventMmdd = (event: CalendarEvent) => {
  const ymd = getEventDateYmd(event)

  return `${ymd.slice(5, 7)}${ymd.slice(8, 10)}`
}

const compareEventsWithinGroup = (eventA: CalendarEvent, eventB: CalendarEvent) => {
  if (eventA.allDay !== eventB.allDay) {
    return eventA.allDay ? -1 : 1
  }

  const startCompare = eventA.start.localeCompare(eventB.start)

  if (startCompare !== 0) {
    return startCompare
  }

  return eventA.summary.localeCompare(eventB.summary)
}

const compareEventsForRef = (eventA: CalendarEvent, eventB: CalendarEvent) => {
  const calendarKeyA = resolveEventCalendarKey(eventA) ?? 0
  const calendarKeyB = resolveEventCalendarKey(eventB) ?? 0

  if (calendarKeyA !== calendarKeyB) {
    return calendarKeyA - calendarKeyB
  }

  const dateCompare = getEventDateYmd(eventA).localeCompare(getEventDateYmd(eventB))

  if (dateCompare !== 0) {
    return dateCompare
  }

  return compareEventsWithinGroup(eventA, eventB)
}

const compareEventsForDisplay = (eventA: CalendarEvent, eventB: CalendarEvent) => {
  const dateCompare = getEventDateYmd(eventA).localeCompare(getEventDateYmd(eventB))

  if (dateCompare !== 0) {
    return dateCompare
  }

  const calendarKeyA = resolveEventCalendarKey(eventA) ?? 0
  const calendarKeyB = resolveEventCalendarKey(eventB) ?? 0

  if (calendarKeyA !== calendarKeyB) {
    return calendarKeyA - calendarKeyB
  }

  return compareEventsWithinGroup(eventA, eventB)
}

const resolveCalendarTextColor = (event: CalendarEvent) =>
  event.calendarBackgroundColor ?? event.calendarForegroundColor ?? undefined

const assignEventRefs = (events: CalendarEvent[]): EventWithRef[] => {
  const sorted = [...events].sort(compareEventsForRef)
  const seqCounters = new Map<string, number>()

  return sorted.map((event) => {
    const calendarKey = resolveEventCalendarKey(event) ?? 0
    const mmdd = getEventMmdd(event)
    const groupKey = `${calendarKey}-${mmdd}`
    const seq = (seqCounters.get(groupKey) ?? 0) + 1

    seqCounters.set(groupKey, seq)

    return {
      ...event,
      ref: `${calendarKey}-${mmdd}-${seq}`,
    }
  })
}

const parseEventRef = (reference: string) => {
  const match = reference.match(EVENT_REF_PATTERN)

  if (!match?.[1] || !match[2] || !match[3]) {
    return null
  }

  return {
    calendarKey: Number(match[1]),
    mmdd: match[2],
    seq: Number(match[3]),
  }
}

const buildYmdFromMmdd = (mmdd: string) => {
  const year = getTodayYmd().slice(0, 4)

  return `${year}${mmdd}`
}

const formatCalendarEvents = (events: CalendarEvent[], keyword?: string): TerminalLineDraft[] => {
  const eventsWithRef = assignEventRefs(events)
  const filteredEvents = keyword
    ? eventsWithRef.filter((event) => eventMatchesKeyword(event, keyword))
    : eventsWithRef

  if (filteredEvents.length === 0) {
    lastListedEvents = []

    if (keyword?.trim()) {
      return [{ type: 'output', text: `'${keyword.trim()}' 키워드와 일치하는 일정이 없습니다.` }]
    }

    return [{ type: 'output', text: '일정이 없습니다.' }]
  }

  lastListedEvents = filteredEvents.map((event) => ({
    ref: event.ref,
    id: event.id,
    calendarKey: resolveEventCalendarKey(event) ?? 0,
  }))

  const displayEvents = [...filteredEvents].sort(compareEventsForDisplay)
  const lines: TerminalLineDraft[] = []
  let previousDate = ''

  for (const event of displayEvents) {
    const date = getEventDateYmd(event)
    const groupBreak = previousDate !== '' && date !== previousDate
    const timeLabel = event.allDay ? '종일' : event.start.slice(11, 16)
    const refLabel = `[${event.ref}]`.padEnd(EVENT_REF_WIDTH)
    const prefix = `${refLabel}${date} ${timeLabel} | `
    const calendarColor = resolveCalendarTextColor(event)

    previousDate = date

    lines.push({
      type: 'output',
      text: `${prefix}${event.calendarName} | ${event.summary}`,
      textParts: [
        { text: prefix },
        { text: event.calendarName, color: calendarColor },
        { text: ` | ${event.summary}` },
      ],
      clickValue: event.ref,
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
  const timeLabel = event.allDay ? '종일' : `${event.start.slice(11, 16)}~${event.end.slice(11, 16)}`
  const calendarKey = resolveEventCalendarKey(event)
  const calendarLabel = calendarKey != null
    ? `[${calendarKey}] ${event.calendarName}`
    : event.calendarName

  return `일정 추가: ${event.summary} (${date} ${timeLabel}) → ${calendarLabel}`
}

const formatUpdatedEventMessage = (event: CalendarEvent, ref?: string) => {
  const label = ref ?? lastListedEvents.find((item) => item.id === event.id)?.ref ?? event.id

  return `일정 수정: ${label} ${event.summary}`
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

  return [...formatCalendarListHeader(), ...formatCalendarList(calendars)]
}

const buildEventsQuery = (timeMin?: string, timeMax?: string, calendarKey?: number) => {
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

  return params.toString()
}

const fetchGcEvents = async (
  apiBaseUrl: string,
  timeMin?: string,
  timeMax?: string,
  calendarKeys?: number[],
  keyword?: string,
): Promise<TerminalLineDraft[]> => {
  const connectionError = await ensureCalendarConnected(apiBaseUrl)

  if (connectionError) {
    return connectionError
  }

  if (calendarKeys && calendarKeys.length > 1) {
    const eventGroups = await Promise.all(
      calendarKeys.map(async (calendarKey) => {
        const query = buildEventsQuery(timeMin, timeMax, calendarKey)
        const url = `${apiBaseUrl}/api/calendar/events${query ? `?${query}` : ''}`

        return fetchJson<CalendarEvent[]>(url)
      }),
    )

    const events = eventGroups.flat()

    return formatCalendarEvents(events, keyword)
  }

  const query = buildEventsQuery(timeMin, timeMax, calendarKeys?.[0])
  const url = `${apiBaseUrl}/api/calendar/events${query ? `?${query}` : ''}`
  const events = await fetchJson<CalendarEvent[]>(url)

  return formatCalendarEvents(events, keyword)
}

const resolveDefaultCalendarKey = async (apiBaseUrl: string): Promise<number> => {
  const calendars = await fetchJson<CalendarListItem[]>(`${apiBaseUrl}/api/calendar/calendars`)

  if (calendars.length === 0) {
    throw new Error('사용 가능한 캘린더가 없습니다. gc -l c 로 카테고리를 확인하세요.')
  }

  const sorted = [...calendars].sort((calendarA, calendarB) => calendarA.key - calendarB.key)
  const first = sorted[0]

  if (!first) {
    throw new Error('사용 가능한 캘린더가 없습니다. gc -l c 로 카테고리를 확인하세요.')
  }

  return first.key
}

const createGcEvent = async (
  apiBaseUrl: string,
  summary: string,
  options: {
    calendarKey?: number
    date?: string
    dateEnd?: string
    time?: string
    endTime?: string
    durationMinutes?: number
    description?: string
  },
): Promise<TerminalLineDraft[]> => {
  const connectionError = await ensureCalendarConnected(apiBaseUrl)

  if (connectionError) {
    return connectionError
  }

  const calendarKey = options.calendarKey !== undefined
    ? options.calendarKey
    : await resolveDefaultCalendarKey(apiBaseUrl)

  if (options.dateEnd && options.date) {
    const body = {
      summary,
      calendarKey,
      date: options.date,
      endDate: options.dateEnd,
      description: options.description,
    }

    const event = await requestJson<CalendarEvent>(`${apiBaseUrl}/api/calendar/events`, 'POST', body)

    return [{ type: 'output', text: formatCreatedEventMessage(event) }]
  }

  const body: Record<string, unknown> = {
    summary,
    calendarKey,
  }

  if (options.date) {
    body.date = options.date
  }

  if (options.time) {
    body.time = options.time
  }

  if (options.endTime) {
    body.endTime = options.endTime
  } else if (options.time && options.durationMinutes !== undefined) {
    body.endTime = computeEndHm(options.time, options.durationMinutes)
  }

  if (options.durationMinutes !== undefined) {
    body.durationMinutes = options.durationMinutes
  }

  if (options.description) {
    body.description = options.description
  }

  const event = await requestJson<CalendarEvent>(`${apiBaseUrl}/api/calendar/events`, 'POST', body)

  return [{ type: 'output', text: formatCreatedEventMessage(event) }]
}

const fetchEventsForRefLookup = async (
  apiBaseUrl: string,
  calendarKey: number,
  ymd: string,
): Promise<CalendarEvent[]> => {
  const range = buildDayRange(ymd)

  if (!range) {
    return []
  }

  const query = buildEventsQuery(range.timeMin, range.timeMax, calendarKey)
  const url = `${apiBaseUrl}/api/calendar/events?${query}`

  return fetchJson<CalendarEvent[]>(url)
}

const resolveEventReference = async (
  apiBaseUrl: string,
  reference: string,
  calendarKey?: number,
): Promise<CachedListedEvent | { error: string }> => {
  const cached = lastListedEvents.find((event) => event.ref === reference)

  if (cached) {
    if (calendarKey !== undefined && cached.calendarKey !== calendarKey) {
      return { error: `${reference} 일정은 ${cached.calendarKey}번 카테고리에 있습니다.` }
    }

    return cached
  }

  const parsed = parseEventRef(reference)

  if (parsed) {
    if (calendarKey !== undefined && parsed.calendarKey !== calendarKey) {
      return { error: `${reference} 일정은 ${parsed.calendarKey}번 카테고리에 있습니다.` }
    }

    const ymd = buildYmdFromMmdd(parsed.mmdd)
    const events = await fetchEventsForRefLookup(apiBaseUrl, parsed.calendarKey, ymd)
    const found = assignEventRefs(events).find((event) => event.ref === reference)

    if (!found) {
      return { error: `일정을 찾을 수 없습니다: ${reference}. gc 로 일정을 확인하세요.` }
    }

    return {
      ref: found.ref,
      id: found.id,
      calendarKey: parsed.calendarKey,
    }
  }

  const cachedById = lastListedEvents.find((event) => event.id === reference)

  if (cachedById) {
    if (calendarKey !== undefined && cachedById.calendarKey !== calendarKey) {
      return { error: `해당 일정은 ${cachedById.calendarKey}번 카테고리에 있습니다.` }
    }

    return cachedById
  }

  if (calendarKey === undefined) {
    return { error: '일정 키 형식: 캘린더-MMDD-순번 (예: 1-0623-2). gc 로 목록을 확인하세요.' }
  }

  return {
    ref: reference,
    id: reference,
    calendarKey,
  }
}

const deleteGcEvent = async (
  apiBaseUrl: string,
  reference: string,
): Promise<TerminalLineDraft[]> => {
  const connectionError = await ensureCalendarConnected(apiBaseUrl)

  if (connectionError) {
    return connectionError
  }

  const resolved = await resolveEventReference(apiBaseUrl, reference)

  if ('error' in resolved) {
    return [{ type: 'error', text: resolved.error }]
  }

  const params = new URLSearchParams({ calendarKey: String(resolved.calendarKey) })
  await requestJson<{ status: string }>(
    `${apiBaseUrl}/api/calendar/events/${encodeURIComponent(resolved.id)}?${params.toString()}`,
    'DELETE',
  )

  lastListedEvents = lastListedEvents.filter((event) => event.id !== resolved.id)

  return [{ type: 'output', text: `일정 삭제: ${resolved.ref}` }]
}

const modifyGcEvent = async (
  apiBaseUrl: string,
  reference: string,
  options: ModifyOptions,
): Promise<TerminalLineDraft[]> => {
  const connectionError = await ensureCalendarConnected(apiBaseUrl)

  if (connectionError) {
    return connectionError
  }

  const resolved = await resolveEventReference(apiBaseUrl, reference)

  if ('error' in resolved) {
    return [{ type: 'error', text: resolved.error }]
  }

  const body: Record<string, unknown> = {
    calendarKey: resolved.calendarKey,
  }

  if (options.title !== undefined) {
    body.summary = options.title
  }

  if (options.description !== undefined) {
    body.description = options.description
  }

  if (options.calendarKey !== undefined) {
    body.newCalendarKey = options.calendarKey
  }

  const event = await requestJson<CalendarEvent>(
    `${apiBaseUrl}/api/calendar/events/${encodeURIComponent(resolved.id)}`,
    'PATCH',
    body,
  )

  return [{ type: 'output', text: formatUpdatedEventMessage(event, resolved.ref) }]
}

const handleQueryCommand = async (
  apiBaseUrl: string,
  flags: GcQueryFlags,
): Promise<TerminalCommandResult> => {
  if (flags.error) {
    return errorLines(flags.error)
  }

  if (flags.listType === 'c') {
    return { lines: await fetchGcCalendars(apiBaseUrl) }
  }

  let parsedDate: ParsedDateArg = {}

  if (flags.schedule) {
    parsedDate = parseGcScheduleRange(flags.schedule)
  } else {
    parsedDate = parseTodayDateArg()
  }

  if (parsedDate.error) {
    return errorLines(parsedDate.error)
  }

  return {
    lines: await fetchGcEvents(
      apiBaseUrl,
      parsedDate.timeMin,
      parsedDate.timeMax,
      flags.calendarKeys,
      flags.keyword,
    ),
  }
}

const handleAddCommand = async (apiBaseUrl: string, rest: string): Promise<TerminalCommandResult> => {
  const flags = extractGcAddFlags(rest.replace(/^a\s+/i, '').trim())

  if (flags.error) {
    return errorLines(flags.error)
  }

  if (!flags.title?.trim()) {
    return errorLines('제목이 필요합니다. 예: gc a -t "팀 미팅"')
  }

  const schedule = flags.schedule ? parseGcAddSchedule(flags.schedule) : { date: getTodayYmd() }

  if (schedule.error) {
    return errorLines(schedule.error)
  }

  return {
    lines: await createGcEvent(apiBaseUrl, flags.title.trim(), {
      calendarKey: flags.calendarKey,
      date: schedule.date,
      dateEnd: schedule.dateEnd,
      time: schedule.time,
      endTime: schedule.endTime,
      durationMinutes: schedule.durationMinutes,
      description: flags.description,
    }),
  }
}

const handleRemoveCommand = async (apiBaseUrl: string, rest: string): Promise<TerminalCommandResult> => {
  const reference = rest.replace(/^r\s+/i, '').trim().split(/\s+/)[0] ?? ''

  if (!reference) {
    return errorLines('삭제할 일정 키를 입력하세요. 예: gc r 1-0623-2')
  }

  return {
    lines: await deleteGcEvent(apiBaseUrl, reference),
  }
}

const handleModifyCommand = async (apiBaseUrl: string, rest: string): Promise<TerminalCommandResult> => {
  const withoutCommand = rest.replace(/^m\s+/i, '').trim()
  const spaceIndex = withoutCommand.search(/\s/)

  if (spaceIndex < 0) {
    return errorLines('수정할 일정 키를 입력하세요. 예: gc m 1-0623-2 -t "새 제목"')
  }

  const reference = withoutCommand.slice(0, spaceIndex).trim()
  const optionPart = withoutCommand.slice(spaceIndex).trim()
  const parsedOptions = parseModifyOptions(optionPart)

  if (parsedOptions.error) {
    return errorLines(parsedOptions.error)
  }

  if (
    parsedOptions.options.title === undefined
    && parsedOptions.options.description === undefined
    && parsedOptions.options.calendarKey === undefined
  ) {
    return errorLines('수정 옵션(-t, -d, -c)을 하나 이상 지정하세요.')
  }

  return {
    lines: await modifyGcEvent(apiBaseUrl, reference, parsedOptions.options),
  }
}

const isLegacyListCommand = (rest: string) =>
  /^l(?:\s|$)/i.test(rest) || /^c$/i.test(rest) || /^l$/i.test(rest)

const convertLegacyListToFlags = (rest: string): string => {
  if (/^c$/i.test(rest)) {
    return '-l c'
  }

  const body = rest.replace(/^l\s*/i, '').trim()
  const parts: string[] = []

  if (body) {
    if (/^-/.test(body)) {
      return body
    }

    parts.push(`-s ${body}`)
  }

  return parts.join(' ')
}

export const executeGcCommand = async (
  trimmed: string,
  apiBaseUrl: string,
): Promise<TerminalCommandResult> => {
  if (trimmed.trim().toLowerCase() === 'gc') {
    return handleQueryCommand(apiBaseUrl, {})
  }

  const rest = trimmed.replace(/^gc\s+/i, '').trim()

  if (!rest) {
    return errorLines(GC_USAGE)
  }

  if (isLegacyListCommand(rest)) {
    const flags = extractGcQueryFlags(convertLegacyListToFlags(rest))

    return handleQueryCommand(apiBaseUrl, flags)
  }

  if (/^a(?:\s|$)/i.test(rest)) {
    if (/^a$/i.test(rest)) {
      return errorLines('제목이 필요합니다. 예: gc a -t "종일 마일스톤 회의"')
    }

    return handleAddCommand(apiBaseUrl, rest)
  }

  if (/^r(?:\s|$)/i.test(rest)) {
    return handleRemoveCommand(apiBaseUrl, rest)
  }

  if (/^m(?:\s|$)/i.test(rest)) {
    return handleModifyCommand(apiBaseUrl, rest)
  }

  if (/-[lsck]/i.test(rest)) {
    const flags = extractGcQueryFlags(rest)

    return handleQueryCommand(apiBaseUrl, flags)
  }

  return errorLines(GC_USAGE)
}
