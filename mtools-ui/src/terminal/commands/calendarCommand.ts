import type {
  CalendarConnectionStatus,
  CalendarEvent,
  CalendarListItem,
  TerminalLineDraft,
} from '../../types'
import { fetchJson, requestJson } from '../apiClient'
import { buildDateRange, buildDayRange, buildWeekRangeFromToday, getTodayYmd, parseYmd } from '../dateUtils'
import type { TerminalCommandResult } from '../types'

const CALENDAR_LIST_KEY_WIDTH = 8
const EVENT_REF_WIDTH = 12

const GC_USAGE =
  '사용법: gc l [YYYYMMDD|YYYYMMDD~YYYYMMDD] [-c n[,n]] | gc a "<내용>" [날짜] [시간] [-c n] | gc m <캘린더-MMDD-순번> [-t "<제목>"] [-d "<메모>"] [-c n] | gc r <캘린더-MMDD-순번> | gc c'

const EVENT_REF_PATTERN = /^(\d+)-(\d{4})-(\d+)$/

type CachedListedEvent = {
  ref: string
  id: string
  calendarKey: number
}

type EventWithRef = CalendarEvent & {
  ref: string
}

type ParsedCalendarFlag = {
  keys?: number[]
  rest: string
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

const extractCalendarFlag = (input: string): ParsedCalendarFlag => {
  const match = input.match(/(?:^|\s)-c\s+(\d+(?:\s*,\s*\d+)*)/i)

  if (!match?.[1]) {
    return { rest: input.trim() }
  }

  const keys = match[1].split(',').map((key) => Number(key.trim()))
  const rest = input.replace(match[0], ' ').replace(/\s+/g, ' ').trim()

  return { keys, rest }
}

const parseTodayDateArg = (): ParsedDateArg => {
  const range = buildDayRange(getTodayYmd())

  if (!range) {
    return { error: '오늘 날짜를 계산하지 못했습니다.' }
  }

  return { timeMin: range.timeMin, timeMax: range.timeMax }
}

const parseListDateArg = (token?: string): ParsedDateArg => {
  if (!token) {
    const range = buildWeekRangeFromToday()

    if (!range) {
      return { error: '1주일 날짜 범위를 계산하지 못했습니다.' }
    }

    if ('invalidOrder' in range) {
      return { error: '날짜 범위를 계산하지 못했습니다.' }
    }

    return { timeMin: range.timeMin, timeMax: range.timeMax }
  }

  const rangeMatch = token.match(/^(\d{8})~(\d{8})$/)

  if (rangeMatch?.[1] && rangeMatch[2]) {
    const range = buildDateRange(rangeMatch[1], rangeMatch[2])

    if (!range) {
      return { error: '날짜는 YYYYMMDD 형식이어야 합니다. 예: gc l 20260618~20260625' }
    }

    if ('invalidOrder' in range) {
      return { error: '날짜 범위는 시작 날짜 ≤ 끝 날짜여야 합니다.' }
    }

    return { timeMin: range.timeMin, timeMax: range.timeMax }
  }

  if (!parseYmd(token)) {
    return { error: '날짜는 YYYYMMDD 형식이어야 합니다. 예: gc l 20260618' }
  }

  const range = buildDayRange(token)

  if (!range) {
    return { error: '날짜는 YYYYMMDD 형식이어야 합니다. 예: gc l 20260618' }
  }

  return { timeMin: range.timeMin, timeMax: range.timeMax }
}

const parseTimeArg = (token?: string): ParsedTimeArg => {
  if (!token) {
    return {}
  }

  const rangeMatch = token.match(/^(\d{4})~(\d{4})$/)

  if (rangeMatch?.[1] && rangeMatch[2]) {
    return { time: rangeMatch[1], endTime: rangeMatch[2] }
  }

  const durationMatch = token.match(/^(\d{4})\+(\d+(?:\.\d+)?)h$/i)

  if (durationMatch?.[1] && durationMatch[2]) {
    const hours = Number(durationMatch[2])

    if (!Number.isFinite(hours) || hours <= 0) {
      return { error: '시간 길이는 0보다 커야 합니다. 예: 1900+1.5h' }
    }

    return {
      time: durationMatch[1],
      durationMinutes: Math.round(hours * 60),
    }
  }

  if (!/^\d{4}$/.test(token)) {
    return { error: '시간은 HHmm, HHmm~HHmm, HHmm+nh 형식이어야 합니다.' }
  }

  return { time: token }
}

const parseModifyOptions = (input: string): { options: ModifyOptions; error?: string } => {
  const options: ModifyOptions = {}
  let rest = input.trim()

  while (rest.length > 0) {
    const titleMatch = rest.match(/^-t\s+/i)

    if (titleMatch) {
      const quoted = consumeQuotedString(rest.slice(titleMatch[0].length))

      if ('error' in quoted) {
        return { options, error: quoted.error }
      }

      options.title = quoted.value
      rest = quoted.rest
      continue
    }

    const descriptionMatch = rest.match(/^-d\s+/i)

    if (descriptionMatch) {
      const quoted = consumeQuotedString(rest.slice(descriptionMatch[0].length))

      if ('error' in quoted) {
        return { options, error: quoted.error }
      }

      options.description = quoted.value
      rest = quoted.rest
      continue
    }

    const calendarMatch = rest.match(/^-c\s+(\d+)/i)

    if (calendarMatch?.[1]) {
      options.calendarKey = Number(calendarMatch[1])
      rest = rest.slice(calendarMatch[0].length).trim()
      continue
    }

    return { options, error: `알 수 없는 수정 옵션: ${rest.split(/\s+/)[0]}` }
  }

  return { options }
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
  { type: 'output', text: '캘린더 번호: 이름 앞 숫자(1., 2., ...). 일정 키: 캘린더-MMDD-순번 (예: 1-0618-2)' },
]

const getEventDateYmd = (event: CalendarEvent) => event.start.slice(0, 10)

const getEventMmdd = (event: CalendarEvent) => {
  const ymd = getEventDateYmd(event)

  return `${ymd.slice(5, 7)}${ymd.slice(8, 10)}`
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

  if (eventA.allDay !== eventB.allDay) {
    return eventA.allDay ? -1 : 1
  }

  const startCompare = eventA.start.localeCompare(eventB.start)

  if (startCompare !== 0) {
    return startCompare
  }

  return eventA.summary.localeCompare(eventB.summary)
}

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

const formatCalendarEvents = (events: CalendarEvent[]): TerminalLineDraft[] => {
  if (events.length === 0) {
    lastListedEvents = []
    return [{ type: 'output', text: '일정이 없습니다.' }]
  }

  const eventsWithRef = assignEventRefs(events)

  lastListedEvents = eventsWithRef.map((event) => ({
    ref: event.ref,
    id: event.id,
    calendarKey: resolveEventCalendarKey(event) ?? 0,
  }))

  const lines: TerminalLineDraft[] = []
  let previousDate = ''

  for (const event of eventsWithRef) {
    const date = getEventDateYmd(event)
    const groupBreak = previousDate !== '' && date !== previousDate
    const timeLabel = event.allDay ? '종일' : event.start.slice(11, 16)
    const refLabel = `[${event.ref}]`.padEnd(EVENT_REF_WIDTH)

    previousDate = date

    lines.push({
      type: 'output',
      text: `${refLabel}${date} ${timeLabel} | ${event.calendarName} | ${event.summary}`,
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

    return formatCalendarEvents(events)
  }

  const query = buildEventsQuery(timeMin, timeMax, calendarKeys?.[0])
  const url = `${apiBaseUrl}/api/calendar/events${query ? `?${query}` : ''}`
  const events = await fetchJson<CalendarEvent[]>(url)

  return formatCalendarEvents(events)
}

const resolveDefaultCalendarKey = async (apiBaseUrl: string): Promise<number> => {
  const calendars = await fetchJson<CalendarListItem[]>(`${apiBaseUrl}/api/calendar/calendars`)

  if (calendars.length === 0) {
    throw new Error('사용 가능한 캘린더가 없습니다. 캘린더 이름이 "1.", "2." 형식인지 gc c 로 확인하세요.')
  }

  const sorted = [...calendars].sort((calendarA, calendarB) => calendarA.key - calendarB.key)
  const first = sorted[0]

  if (!first) {
    throw new Error('사용 가능한 캘린더가 없습니다. 캘린더 이름이 "1.", "2." 형식인지 gc c 로 확인하세요.')
  }

  return first.key
}

const createGcEvent = async (
  apiBaseUrl: string,
  summary: string,
  options: {
    calendarKey?: number
    date?: string
    time?: string
    endTime?: string
    durationMinutes?: number
  },
): Promise<TerminalLineDraft[]> => {
  const connectionError = await ensureCalendarConnected(apiBaseUrl)

  if (connectionError) {
    return connectionError
  }

  const calendarKey = options.calendarKey !== undefined
    ? options.calendarKey
    : await resolveDefaultCalendarKey(apiBaseUrl)

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
      return { error: `${reference} 일정은 ${cached.calendarKey}번 캘린더에 있습니다.` }
    }

    return cached
  }

  const parsed = parseEventRef(reference)

  if (parsed) {
    if (calendarKey !== undefined && parsed.calendarKey !== calendarKey) {
      return { error: `${reference} 일정은 ${parsed.calendarKey}번 캘린더에 있습니다.` }
    }

    const ymd = buildYmdFromMmdd(parsed.mmdd)
    const events = await fetchEventsForRefLookup(apiBaseUrl, parsed.calendarKey, ymd)
    const found = assignEventRefs(events).find((event) => event.ref === reference)

    if (!found) {
      return { error: `일정을 찾을 수 없습니다: ${reference}. gc l 로 일정을 확인하세요.` }
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
      return { error: `해당 일정은 ${cachedById.calendarKey}번 캘린더에 있습니다.` }
    }

    return cachedById
  }

  if (calendarKey === undefined) {
    return { error: '일정 키 형식: 캘린더-MMDD-순번 (예: 1-0618-2). gc l 로 목록을 확인하세요.' }
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

const handleListCommand = async (apiBaseUrl: string, rest: string): Promise<TerminalCommandResult> => {
  const { keys, rest: datePart } = extractCalendarFlag(rest)
  const dateToken = datePart.trim()
  const parsedDate = parseListDateArg(dateToken || undefined)

  if (parsedDate.error) {
    return errorLines(parsedDate.error)
  }

  return {
    lines: await fetchGcEvents(apiBaseUrl, parsedDate.timeMin, parsedDate.timeMax, keys),
  }
}

const handleAddCommand = async (apiBaseUrl: string, rest: string): Promise<TerminalCommandResult> => {
  const body = rest.replace(/^a\s+/i, '').trim()
  const hadCalendarFlag = /(?:^|\s)-c\s+\d+/i.test(body)
  const { keys, rest: bodyWithoutCalendar } = extractCalendarFlag(body)

  if (hadCalendarFlag && !keys?.length) {
    return errorLines('-c 캘린더 번호를 읽지 못했습니다. 예: gc a "회의" 20260618 -c 1')
  }

  const quoted = consumeQuotedString(bodyWithoutCalendar.trim())

  if ('error' in quoted) {
    return errorLines(quoted.error)
  }

  if (!quoted.value.trim()) {
    return errorLines('일정 제목을 입력하세요. 예: gc a "팀 미팅"')
  }

  const tokens = quoted.rest.split(/\s+/).filter(Boolean)
  const dateToken = tokens[0]
  const timeToken = tokens[1]

  let date: string | undefined
  let timeArg: ParsedTimeArg = {}

  if (dateToken) {
    if (!parseYmd(dateToken) && !/^\d{4}(?:~|\+|$)/.test(dateToken)) {
      return errorLines('날짜는 YYYYMMDD 형식이어야 합니다. 예: gc a "회의" 20260618')
    }

    if (parseYmd(dateToken)) {
      date = dateToken
      timeArg = parseTimeArg(timeToken)
    } else {
      timeArg = parseTimeArg(dateToken)
    }
  }

  if (timeArg.error) {
    return errorLines(timeArg.error)
  }

  const calendarKey = keys?.[0]

  if (hadCalendarFlag && calendarKey === undefined) {
    return errorLines('-c 캘린더 번호를 읽지 못했습니다. 예: gc a "회의" 20260618 -c 1')
  }

  return {
    lines: await createGcEvent(apiBaseUrl, quoted.value.trim(), {
      calendarKey,
      date,
      time: timeArg.time,
      endTime: timeArg.endTime,
      durationMinutes: timeArg.durationMinutes,
    }),
  }
}

const handleRemoveCommand = async (apiBaseUrl: string, rest: string): Promise<TerminalCommandResult> => {
  const reference = rest.replace(/^r\s+/i, '').trim().split(/\s+/)[0] ?? ''

  if (!reference) {
    return errorLines('삭제할 일정 키를 입력하세요. 예: gc r 1-0618-2')
  }

  return {
    lines: await deleteGcEvent(apiBaseUrl, reference),
  }
}

const handleModifyCommand = async (apiBaseUrl: string, rest: string): Promise<TerminalCommandResult> => {
  const withoutCommand = rest.replace(/^m\s+/i, '').trim()
  const spaceIndex = withoutCommand.search(/\s/)

  if (spaceIndex < 0) {
    return errorLines('수정할 일정 키를 입력하세요. 예: gc m 1-0618-2 -t "새 제목"')
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

export const executeGcCommand = async (
  trimmed: string,
  apiBaseUrl: string,
): Promise<TerminalCommandResult> => {
  if (trimmed.trim().toLowerCase() === 'gc') {
    const today = parseTodayDateArg()

    if (today.error) {
      return errorLines(today.error)
    }

    return { lines: await fetchGcEvents(apiBaseUrl, today.timeMin, today.timeMax) }
  }

  const rest = trimmed.replace(/^gc\s+/i, '').trim()

  if (!rest) {
    return errorLines(GC_USAGE)
  }

  if (/^c$/i.test(rest)) {
    return { lines: await fetchGcCalendars(apiBaseUrl) }
  }

  if (/^l(?:\s|$)/i.test(rest) || /^l$/i.test(rest)) {
    return handleListCommand(apiBaseUrl, rest.replace(/^l\s*/i, '').trim())
  }

  if (/^a\s+/i.test(rest) || /^a$/i.test(rest)) {
    if (/^a$/i.test(rest)) {
      return errorLines('일정 제목을 따옴표로 입력하세요. 예: gc a "종일 마일스톤 회의"')
    }

    return handleAddCommand(apiBaseUrl, rest)
  }

  if (/^r(?:\s|$)/i.test(rest)) {
    return handleRemoveCommand(apiBaseUrl, rest)
  }

  if (/^m(?:\s|$)/i.test(rest)) {
    return handleModifyCommand(apiBaseUrl, rest)
  }

  return errorLines(GC_USAGE)
}
