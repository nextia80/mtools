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
