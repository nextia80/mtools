import type {
  MailConnectionStatus,
  MailMessage,
  MailMessageDetail,
  MailMessagesPage,
  TerminalLineDraft,
} from '../../types'
import { fetchJson, requestJson } from '../apiClient'
import {
  buildDateRange,
  buildDayRange,
  buildMonthRange,
  buildMonthRangeBackward,
  buildWeekRangeBackward,
  buildYearRange,
  getTodayYmd,
  parseDottedYm,
  parseDottedYmd,
  parseDottedYear,
  toYmFromDotted,
  toYmdFromDotted,
} from '../dateUtils'
import type { TerminalCommandResult } from '../types'

const MAIL_REF_WIDTH = 10
const MAIL_LIST_SIZE = 10
const MAIL_REF_PATTERN = /^(\d{4})-(\d+)$/

const GM_USAGE =
  '사용법: gm [-l n|r|a] [-s 일자] [-k "키워드"] | gm r <MMDD-순번> [/r|/n|/b|/d|/k|/list|/0]'

type CachedListedMail = {
  ref: string
  id: string
}

type MailWithRef = MailMessage & {
  ref: string
  sortDate: string
}

type ParsedDateArg = {
  timeMin?: string
  timeMax?: string
  error?: string
}

type GmQueryFlags = {
  listType?: 'n' | 'r' | 'a'
  schedule?: string
  keyword?: string
  error?: string
}

type GmReadAction = '/r' | '/n' | '/b' | '/d' | '/k' | '/list' | '/0'

let lastListedMails: CachedListedMail[] = []
let lastReadRef: string | null = null
let lastGmQueryFlags: GmQueryFlags = { listType: 'a' }

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

const parseMailDateYmd = (dateHeader: string) => {
  const parsed = Date.parse(dateHeader)

  if (Number.isNaN(parsed)) {
    return null
  }

  const date = new Date(parsed)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}${month}${day}`
}

const toGmailSlashDate = (ymd: string) =>
  `${ymd.slice(0, 4)}/${ymd.slice(4, 6)}/${ymd.slice(6, 8)}`

const isoToYmd = (iso: string) => {
  const date = new Date(iso)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}${month}${day}`
}

const buildGmailDateQuery = (timeMin?: string, timeMax?: string) => {
  if (!timeMin || !timeMax) {
    return ''
  }

  const after = toGmailSlashDate(isoToYmd(timeMin))
  const before = toGmailSlashDate(isoToYmd(timeMax))

  return `after:${after} before:${before}`
}

const parseTodayDateArg = (): ParsedDateArg => {
  const range = buildDayRange(getTodayYmd())

  if (!range) {
    return { error: '오늘 날짜를 계산하지 못했습니다.' }
  }

  return { timeMin: range.timeMin, timeMax: range.timeMax }
}

const parseGmScheduleRange = (token: string): ParsedDateArg => {
  const trimmed = token.trim()

  if (trimmed === 'today') {
    return parseTodayDateArg()
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
        return { error: '날짜 형식이 올바르지 않습니다. 예: gm -s 2026.01.01~2026.01.30' }
      }

      const range = buildDateRange(fromYmd, toYmd)

      if (!range) {
        return { error: '날짜 형식이 올바르지 않습니다.' }
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
        return { error: '년월 형식이 올바르지 않습니다. 예: gm -s 2026.01~2026.06' }
      }

      const range = buildMonthRange(fromYm, toYm)

      if (!range) {
        return { error: '년월 형식이 올바르지 않습니다.' }
      }

      if ('invalidOrder' in range) {
        return { error: '년월 범위는 시작 ≤ 끝 이어야 합니다.' }
      }

      return { timeMin: range.timeMin, timeMax: range.timeMax }
    }

    if (parseDottedYear(fromRaw) && parseDottedYear(toRaw)) {
      const range = buildYearRange(fromRaw, toRaw)

      if (!range) {
        return { error: '년도 형식이 올바르지 않습니다. 예: gm -s 2025~2026' }
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
      return { error: '날짜 형식이 올바르지 않습니다. 예: gm -s 2026.06.22' }
    }

    const range = buildDayRange(ymd)

    if (!range) {
      return { error: '날짜 형식이 올바르지 않습니다.' }
    }

    return { timeMin: range.timeMin, timeMax: range.timeMax }
  }

  if (parseDottedYm(trimmed)) {
    const ym = toYmFromDotted(trimmed)

    if (!ym) {
      return { error: '년월 형식이 올바르지 않습니다. 예: gm -s 2026.06' }
    }

    const range = buildMonthRange(ym, ym)

    if (!range) {
      return { error: '년월 형식이 올바르지 않습니다.' }
    }

    if ('invalidOrder' in range) {
      return { error: '년월 범위를 계산하지 못했습니다.' }
    }

    return { timeMin: range.timeMin, timeMax: range.timeMax }
  }

  if (parseDottedYear(trimmed)) {
    const range = buildYearRange(trimmed, trimmed)

    if (!range) {
      return { error: '년도 형식이 올바르지 않습니다. 예: gm -s 2026' }
    }

    if ('invalidOrder' in range) {
      return { error: '년도 범위를 계산하지 못했습니다.' }
    }

    return { timeMin: range.timeMin, timeMax: range.timeMax }
  }

  return {
    error:
      '일자 형식: today, -week, -month, yyyy, yyyy~yyyy, yyyy.mm, yyyy.mm~yyyy.mm, yyyy.mm.dd, yyyy.mm.dd~yyyy.mm.dd',
  }
}

const extractGmQueryFlags = (input: string): GmQueryFlags => {
  let rest = input.trim()
  const flags: GmQueryFlags = {}

  while (rest.length > 0) {
    const listMatch = rest.match(/^-l\s+(\S+)/i)

    if (listMatch?.[1]) {
      const listType = listMatch[1].toLowerCase()

      if (listType !== 'n' && listType !== 'r' && listType !== 'a') {
        return { error: '-l 옵션은 n(읽지않음), r(읽음), a(전체)만 지원합니다.' }
      }

      flags.listType = listType
      rest = rest.slice(listMatch[0].length).trim()
      continue
    }

    const scheduleMatch = rest.match(/^-s\s+(\S+)/i)

    if (scheduleMatch?.[1]) {
      flags.schedule = scheduleMatch[1]
      rest = rest.slice(scheduleMatch[0].length).trim()
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

const compareMailsForRef = (mailA: MailMessage, mailB: MailMessage) => {
  const dateA = parseMailDateYmd(mailA.date) ?? ''
  const dateB = parseMailDateYmd(mailB.date) ?? ''

  if (dateA !== dateB) {
    return dateB.localeCompare(dateA)
  }

  return mailA.subject.localeCompare(mailB.subject)
}

const compareMailsForDisplay = (mailA: MailWithRef, mailB: MailWithRef) => {
  if (mailA.sortDate !== mailB.sortDate) {
    return mailB.sortDate.localeCompare(mailA.sortDate)
  }

  return mailA.subject.localeCompare(mailB.subject)
}

const assignMailRefs = (messages: MailMessage[]): MailWithRef[] => {
  const sorted = [...messages].sort(compareMailsForRef)
  const seqCounters = new Map<string, number>()

  return sorted.map((message) => {
    const sortDate = parseMailDateYmd(message.date) ?? '00000000'
    const mmdd = sortDate.slice(4, 8)
    const seq = (seqCounters.get(mmdd) ?? 0) + 1

    seqCounters.set(mmdd, seq)

    return {
      ...message,
      sortDate,
      ref: `${mmdd}-${seq}`,
    }
  })
}

const parseMailRef = (reference: string) => {
  const match = reference.match(MAIL_REF_PATTERN)

  if (!match?.[1] || !match[2]) {
    return null
  }

  return {
    mmdd: match[1],
    seq: Number(match[2]),
  }
}

const resolveMailReference = (reference: string): { id: string } | { error: string } => {
  const cached = lastListedMails.find((item) => item.ref === reference)

  if (cached) {
    return { id: cached.id }
  }

  const parsed = parseMailRef(reference)

  if (!parsed || !Number.isFinite(parsed.seq) || parsed.seq <= 0) {
    return { error: `메일 키 형식이 올바르지 않습니다. 예: gm r 0622-1 (입력: ${reference})` }
  }

  const matched = lastListedMails.filter((item) => item.ref.startsWith(`${parsed.mmdd}-`))
    .sort((itemA, itemB) => {
      const seqA = Number(itemA.ref.split('-')[1] ?? 0)
      const seqB = Number(itemB.ref.split('-')[1] ?? 0)

      return seqA - seqB
    })

  const target = matched[parsed.seq - 1]

  if (!target) {
    return { error: `메일을 찾을 수 없습니다: ${reference}. gm 으로 목록을 다시 조회하세요.` }
  }

  return { id: target.id }
}

const formatMailList = (messages: MailMessage[]): TerminalLineDraft[] => {
  const messagesWithRef = assignMailRefs(messages)
  const displayMails = [...messagesWithRef].sort(compareMailsForDisplay)

  if (displayMails.length === 0) {
    lastListedMails = []

    return [{ type: 'output', text: '메일이 없습니다.' }]
  }

  lastListedMails = displayMails.map((mail) => ({
    ref: mail.ref,
    id: mail.id,
  }))

  const lines: TerminalLineDraft[] = []
  let previousDate = ''

  for (const mail of displayMails) {
    const dateLabel = mail.sortDate.length === 8
      ? `${mail.sortDate.slice(0, 4)}-${mail.sortDate.slice(4, 6)}-${mail.sortDate.slice(6, 8)}`
      : mail.date
    const groupBreak = previousDate !== '' && mail.sortDate !== previousDate
    const unreadMark = mail.unread ? ' *' : ''
    const refLabel = mail.ref.padEnd(MAIL_REF_WIDTH)

    previousDate = mail.sortDate

    lines.push({
      type: 'output',
      text: `${refLabel}${mail.subject}${unreadMark}`,
      clickValue: mail.ref,
      groupBreak,
    })
  }

  return lines
}

const formatMailDetail = (detail: MailMessageDetail, ref: string): TerminalLineDraft[] => {
  const unreadLabel = detail.unread ? ' [읽지 않음]' : ''
  const lines: TerminalLineDraft[] = [
    { type: 'output', text: `── ${ref} | ${detail.subject}${unreadLabel}`, mailScrollAnchor: 'start', mailRef: ref },
    { type: 'output', text: `From: ${detail.from}` },
    { type: 'output', text: `Date: ${detail.date}` },
  ]

  const html = detail.bodyHtml?.trim() ?? ''
  const text = detail.bodyText.trim() || detail.snippet.trim()

  if (html) {
    lines.push({ type: 'output', text: '---' })
    lines.push({ type: 'output', text: '', htmlContent: html })
  } else if (text) {
    lines.push({ type: 'output', text: '---' })

    for (const line of text.split('\n')) {
      lines.push({ type: 'output', text: line })
    }
  } else {
    lines.push({ type: 'output', text: '(본문 없음)' })
  }

  lines.push({
    type: 'output',
    text: '--- /r 읽음  /n 다음  /b 이전  /d 삭제  /k 보관  /0 맨위  /list 목록',
    mailScrollAnchor: 'end',
    mailRef: ref,
  })

  return lines
}

const ensureMailConnected = async (apiBaseUrl: string): Promise<TerminalLineDraft[] | null> => {
  const status = await fetchJson<MailConnectionStatus>(`${apiBaseUrl}/api/mail/status`)

  if (!status.connected) {
    return [{
      type: 'error',
      text: 'Gmail이 연결되어 있지 않습니다. 메일관리 메뉴에서 Gmail을 연결하세요.',
    }]
  }

  return null
}

const buildMailMessagesUrl = (
  apiBaseUrl: string,
  flags: GmQueryFlags,
  parsedDate: ParsedDateArg,
) => {
  const params = new URLSearchParams()
  const listType = flags.listType ?? 'a'

  params.set('maxResults', String(MAIL_LIST_SIZE))
  params.set('readFilter', listType)

  const queryParts: string[] = []
  const dateQuery = buildGmailDateQuery(parsedDate.timeMin, parsedDate.timeMax)

  if (dateQuery) {
    queryParts.push(dateQuery)
  }

  if (flags.keyword?.trim()) {
    queryParts.push(flags.keyword.trim())
  }

  if (queryParts.length > 0) {
    params.set('q', queryParts.join(' '))
  }

  return `${apiBaseUrl}/api/mail/messages?${params.toString()}`
}

const fetchGmMessages = async (
  apiBaseUrl: string,
  flags: GmQueryFlags,
): Promise<TerminalCommandResult> => {
  const connectionError = await ensureMailConnected(apiBaseUrl)

  if (connectionError) {
    return { lines: connectionError }
  }

  let parsedDate: ParsedDateArg = {}

  if (flags.schedule) {
    parsedDate = parseGmScheduleRange(flags.schedule)

    if (parsedDate.error) {
      return errorLines(parsedDate.error)
    }
  }

  const page = await fetchJson<MailMessagesPage>(buildMailMessagesUrl(apiBaseUrl, flags, parsedDate))
  lastGmQueryFlags = { ...flags }

  const header: TerminalLineDraft = {
    type: 'output',
    text: `메일 ${page.messages.length}건 (전체 ${page.totalCount}건) — gm r <키> 로 열람`,
  }

  return {
    lines: [header, ...formatMailList(page.messages)],
    context: 'gm',
  }
}

const readResult = (
  lines: TerminalLineDraft[],
  ref: string,
): TerminalCommandResult => ({
  lines,
  context: `gm r ${ref}`,
})

const fetchMailDetail = async (
  apiBaseUrl: string,
  ref: string,
  markRead: boolean,
): Promise<TerminalCommandResult> => {
  const resolved = resolveMailReference(ref)

  if ('error' in resolved) {
    return errorLines(resolved.error)
  }

  const detail = await fetchJson<MailMessageDetail>(
    `${apiBaseUrl}/api/mail/messages/${encodeURIComponent(resolved.id)}?markRead=${markRead}`,
  )

  lastReadRef = ref

  return readResult(formatMailDetail(detail, ref), ref)
}

const findNeighborRef = (ref: string, direction: 'next' | 'prev') => {
  const index = lastListedMails.findIndex((item) => item.ref === ref)

  if (index < 0) {
    return null
  }

  const neighborIndex = direction === 'next' ? index + 1 : index - 1
  const neighbor = lastListedMails[neighborIndex]

  return neighbor?.ref ?? null
}

const removeMailFromCache = (ref: string) => {
  lastListedMails = lastListedMails.filter((item) => item.ref !== ref)
}

const handleReadAction = async (
  apiBaseUrl: string,
  ref: string,
  action: GmReadAction,
): Promise<TerminalCommandResult> => {
  if (action === '/0') {
    return {
      lines: [],
      context: `gm r ${ref}`,
      action: { type: 'scroll-mail', anchor: 'start', ref },
    }
  }

  const connectionError = await ensureMailConnected(apiBaseUrl)

  if (connectionError) {
    return { lines: connectionError }
  }

  if (action === '/list') {
    return fetchGmMessages(apiBaseUrl, lastGmQueryFlags)
  }

  const resolved = resolveMailReference(ref)

  if ('error' in resolved) {
    return errorLines(resolved.error)
  }

  if (action === '/r') {
    await requestJson(
      `${apiBaseUrl}/api/mail/messages/${encodeURIComponent(resolved.id)}/read`,
      'POST',
    )

    return readResult(
      [{ type: 'output', text: `${ref} 메일을 읽음 처리했습니다.` }],
      ref,
    )
  }

  if (action === '/n') {
    const nextRef = findNeighborRef(ref, 'next')

    if (!nextRef) {
      const listResult = await fetchGmMessages(apiBaseUrl, lastGmQueryFlags)

      return {
        lines: [
          { type: 'output', text: '다음 메일이 없습니다.' },
          ...listResult.lines,
        ],
        context: listResult.context,
      }
    }

    return fetchMailDetail(apiBaseUrl, nextRef, false)
  }

  if (action === '/b') {
    const prevRef = findNeighborRef(ref, 'prev')

    if (!prevRef) {
      const listResult = await fetchGmMessages(apiBaseUrl, lastGmQueryFlags)

      return {
        lines: [
          { type: 'output', text: '이전 메일이 없습니다.' },
          ...listResult.lines,
        ],
        context: listResult.context,
      }
    }

    return fetchMailDetail(apiBaseUrl, prevRef, false)
  }

  if (action === '/d') {
    const index = lastListedMails.findIndex((item) => item.ref === ref)
    const nextRef = index >= 0 ? lastListedMails[index + 1]?.ref : undefined

    await requestJson(
      `${apiBaseUrl}/api/mail/messages/${encodeURIComponent(resolved.id)}`,
      'DELETE',
    )
    removeMailFromCache(ref)

    if (nextRef) {
      return fetchMailDetail(apiBaseUrl, nextRef, false)
    }

    const listResult = await fetchGmMessages(apiBaseUrl, lastGmQueryFlags)

    return {
      lines: [
        { type: 'output', text: `${ref} 메일을 삭제했습니다. 다음 메일이 없어 목록을 표시합니다.` },
        ...listResult.lines,
      ],
      context: listResult.context,
    }
  }

  if (action === '/k') {
    const index = lastListedMails.findIndex((item) => item.ref === ref)
    const nextRef = index >= 0 ? lastListedMails[index + 1]?.ref : undefined

    await requestJson(
      `${apiBaseUrl}/api/mail/messages/${encodeURIComponent(resolved.id)}/archive`,
      'POST',
    )
    removeMailFromCache(ref)

    if (nextRef) {
      return fetchMailDetail(apiBaseUrl, nextRef, false)
    }

    const listResult = await fetchGmMessages(apiBaseUrl, lastGmQueryFlags)

    return {
      lines: [
        { type: 'output', text: `${ref} 메일을 보관했습니다. 다음 메일이 없어 목록을 표시합니다.` },
        ...listResult.lines,
      ],
      context: listResult.context,
    }
  }

  return errorLines(GM_USAGE)
}

const parseReadCommand = (rest: string): { ref: string; action?: GmReadAction; error?: string } => {
  const normalized = rest.trim()

  if (/^r$/i.test(normalized)) {
    const firstRef = lastListedMails[0]?.ref

    if (!firstRef) {
      return { ref: '', error: '조회된 메일 목록이 없습니다. gm 으로 목록을 먼저 조회하세요.' }
    }

    return { ref: firstRef }
  }

  const trimmed = normalized.replace(/^r\s+/i, '').trim()
  const parts = trimmed.split(/\s+/)
  const ref = parts[0] ?? ''
  const actionToken = parts[1] as GmReadAction | undefined

  if (!ref) {
    return { ref: '', error: '메일 키가 필요합니다. 예: gm r 0622-1' }
  }

  if (!parseMailRef(ref)) {
    return { ref: '', error: `메일 키 형식이 올바르지 않습니다. 예: gm r 0622-1 (입력: ${ref})` }
  }

  if (!actionToken) {
    return { ref }
  }

  const allowed: GmReadAction[] = ['/r', '/n', '/b', '/d', '/k', '/list', '/0']

  if (!allowed.includes(actionToken)) {
    return { ref: '', error: `알 수 없는 옵션: ${actionToken}` }
  }

  return { ref, action: actionToken }
}

const handleReadCommand = async (apiBaseUrl: string, rest: string): Promise<TerminalCommandResult> => {
  const parsed = parseReadCommand(rest)

  if (parsed.error) {
    return errorLines(parsed.error)
  }

  if (parsed.action) {
    return handleReadAction(apiBaseUrl, parsed.ref, parsed.action)
  }

  return fetchMailDetail(apiBaseUrl, parsed.ref, false)
}

const handleQueryCommand = async (
  apiBaseUrl: string,
  flags: GmQueryFlags,
): Promise<TerminalCommandResult> => {
  if (flags.error) {
    return errorLines(flags.error)
  }

  if (!flags.listType) {
    flags.listType = 'a'
  }

  return fetchGmMessages(apiBaseUrl, flags)
}

export const getGmReadInputDraft = () =>
  lastReadRef ? `gm r ${lastReadRef}` : null

export const executeGmCommand = async (
  trimmed: string,
  apiBaseUrl: string,
): Promise<TerminalCommandResult> => {
  if (trimmed.trim().toLowerCase() === 'gm') {
    return handleQueryCommand(apiBaseUrl, { listType: 'a' })
  }

  const rest = trimmed.replace(/^gm\s+/i, '').trim()

  if (!rest) {
    return errorLines(GM_USAGE)
  }

  if (/^r(?:\s|$)/i.test(rest)) {
    return handleReadCommand(apiBaseUrl, rest)
  }

  if (/-[lsk]/i.test(rest)) {
    const flags = extractGmQueryFlags(rest)

    return handleQueryCommand(apiBaseUrl, flags)
  }

  return errorLines(GM_USAGE)
}
