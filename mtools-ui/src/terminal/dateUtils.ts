export const parseYmd = (raw: string) => {
  const match = raw.match(/^(\d{4})(\d{2})(\d{2})$/)

  if (!match?.[1] || !match[2] || !match[3]) {
    return null
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }

  return { year, month, day }
}

export const buildDayRange = (ymd: string) => {
  const parsed = parseYmd(ymd)

  if (!parsed) {
    return null
  }

  const start = new Date(parsed.year, parsed.month - 1, parsed.day)
  const end = new Date(parsed.year, parsed.month - 1, parsed.day + 1)

  return {
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
  }
}

export const buildDateRange = (fromYmd: string, toYmd: string) => {
  const fromParsed = parseYmd(fromYmd)
  const toParsed = parseYmd(toYmd)

  if (!fromParsed || !toParsed) {
    return null
  }

  const start = new Date(fromParsed.year, fromParsed.month - 1, fromParsed.day)
  const endDay = new Date(toParsed.year, toParsed.month - 1, toParsed.day)

  if (start.getTime() > endDay.getTime()) {
    return { invalidOrder: true as const }
  }

  const end = new Date(toParsed.year, toParsed.month - 1, toParsed.day + 1)

  return {
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
  }
}

export const getTodayYmd = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}${month}${day}`
}

export const addDaysToYmd = (ymd: string, days: number) => {
  const parsed = parseYmd(ymd)

  if (!parsed) {
    return null
  }

  const date = new Date(parsed.year, parsed.month - 1, parsed.day + days)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}${month}${day}`
}

export const buildWeekRangeFromToday = () => {
  const today = getTodayYmd()
  const endYmd = addDaysToYmd(today, 6)

  if (!endYmd) {
    return null
  }

  return buildDateRange(today, endYmd)
}

export const parseYear = (raw: string) => {
  if (!/^\d{4}$/.test(raw)) {
    return null
  }

  const year = Number(raw)

  if (!Number.isInteger(year) || year < 1 || year > 9999) {
    return null
  }

  return { year }
}

export const parseYm = (raw: string) => {
  const match = raw.match(/^(\d{4})(\d{2})$/)

  if (!match?.[1] || !match[2]) {
    return null
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const date = new Date(year, month - 1, 1)

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12 ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1
  ) {
    return null
  }

  return { year, month }
}

export const buildYearRange = (fromYear: string, toYear: string) => {
  const fromParsed = parseYear(fromYear)
  const toParsed = parseYear(toYear)

  if (!fromParsed || !toParsed) {
    return null
  }

  if (fromParsed.year > toParsed.year) {
    return { invalidOrder: true as const }
  }

  const start = new Date(fromParsed.year, 0, 1)
  const end = new Date(toParsed.year + 1, 0, 1)

  return {
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
  }
}

export const buildMonthRange = (fromYm: string, toYm: string) => {
  const fromParsed = parseYm(fromYm)
  const toParsed = parseYm(toYm)

  if (!fromParsed || !toParsed) {
    return null
  }

  const start = new Date(fromParsed.year, fromParsed.month - 1, 1)
  const end = new Date(toParsed.year, toParsed.month, 1)

  if (start.getTime() >= end.getTime()) {
    return { invalidOrder: true as const }
  }

  return {
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
  }
}

export const parseDottedYmd = (raw: string) => {
  const match = raw.match(/^(\d{4})\.(\d{2})\.(\d{2})$/)

  if (!match?.[1] || !match[2] || !match[3]) {
    return null
  }

  return parseYmd(`${match[1]}${match[2]}${match[3]}`)
}

export const parseDottedYm = (raw: string) => {
  const match = raw.match(/^(\d{4})\.(\d{2})$/)

  if (!match?.[1] || !match[2]) {
    return null
  }

  return parseYm(`${match[1]}${match[2]}`)
}

export const parseDottedYear = (raw: string) => parseYear(raw.replace(/\./g, ''))

export const addMonthsToYmd = (ymd: string, months: number) => {
  const parsed = parseYmd(ymd)

  if (!parsed) {
    return null
  }

  const date = new Date(parsed.year, parsed.month - 1 + months, parsed.day)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}${month}${day}`
}

export const buildRelativeDateRange = (startOffsetDays: number, endOffsetDays: number) => {
  const today = getTodayYmd()
  const startYmd = addDaysToYmd(today, startOffsetDays)
  const endYmd = addDaysToYmd(today, endOffsetDays)

  if (!startYmd || !endYmd) {
    return null
  }

  return buildDateRange(startYmd, endYmd)
}

export const buildWeekRangeForward = () => buildRelativeDateRange(0, 6)

export const buildWeekRangeBackward = () => buildRelativeDateRange(-6, 0)

export const buildMonthRangeForward = () => {
  const today = getTodayYmd()
  const endYmd = addMonthsToYmd(today, 1)

  if (!endYmd) {
    return null
  }

  return buildDateRange(today, endYmd)
}

export const buildMonthRangeBackward = () => {
  const today = getTodayYmd()
  const startYmd = addMonthsToYmd(today, -1)

  if (!startYmd) {
    return null
  }

  return buildDateRange(startYmd, today)
}

export const toYmdFromDotted = (dotted: string) => {
  const parsed = parseDottedYmd(dotted)

  if (!parsed) {
    return null
  }

  const month = String(parsed.month).padStart(2, '0')
  const day = String(parsed.day).padStart(2, '0')

  return `${parsed.year}${month}${day}`
}

export const toYmFromDotted = (dotted: string) => {
  const parsed = parseDottedYm(dotted)

  if (!parsed) {
    return null
  }

  return `${parsed.year}${String(parsed.month).padStart(2, '0')}`
}

export const toHmFromColon = (raw: string) => {
  const match = raw.match(/^(\d{1,2}):(\d{2})$/)

  if (!match?.[1] || !match[2]) {
    return null
  }

  const hour = Number(match[1])
  const minute = Number(match[2])

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null
  }

  return `${String(hour).padStart(2, '0')}${String(minute).padStart(2, '0')}`
}
