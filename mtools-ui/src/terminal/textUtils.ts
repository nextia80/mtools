export const formatDateTime = (value: string | null) =>
  value ? new Date(value).toLocaleString('ko-KR') : '-'

const buildDurationLabel = (days: number, hours: number, minutes: number): string | null => {
  const parts: string[] = []

  if (days > 0) {
    parts.push(`${days}일`)
  }

  if (hours > 0) {
    parts.push(`${hours}시간`)
  }

  if (minutes > 0) {
    parts.push(`${minutes}분`)
  }

  return parts.length > 0 ? parts.join(' ') : null
}

export const formatSessionDurationLabel = (
  startedAt: string,
  endedAt: Date = new Date(),
): string | null => {
  const durationMs = Math.max(0, endedAt.getTime() - new Date(startedAt).getTime())
  const totalMinutes = Math.floor(durationMs / 60_000)
  const days = Math.floor(totalMinutes / (60 * 24))
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60)
  const minutes = totalMinutes % 60

  return buildDurationLabel(days, hours, minutes)
}

export const normalizeLastSessionLabel = (label: string | null): string | null => {
  if (!label?.trim()) {
    return null
  }

  const dayMatch = label.match(/(\d+)일/)
  const hourMatch = label.match(/(\d+)시간/)
  const minuteMatch = label.match(/(\d+)분/)

  const days = dayMatch ? Number(dayMatch[1]) : 0
  const hours = hourMatch ? Number(hourMatch[1]) : 0
  const minutes = minuteMatch ? Number(minuteMatch[1]) : 0

  return buildDurationLabel(days, hours, minutes)
}

export const LOGIN_COMMAND = '@login'
export const LOGOUT_COMMAND = '@exit'
export const LOGIN_PW_CONTEXT = `${LOGIN_COMMAND} pw`

export const isLoginPromptContext = (context: string | null) =>
  context === LOGIN_COMMAND || context === LOGIN_PW_CONTEXT

export const formatPromptContextLabel = (context: string | null): string | null => {
  if (!context) {
    return null
  }

  if (context === LOGIN_COMMAND) {
    return 'id'
  }

  if (context === LOGIN_PW_CONTEXT) {
    return 'password'
  }

  return context
}

export type InlineLoginCredentials = {
  memberId: string
  password: string
}

/** @login -connect 아이디@비밀번호 */
export const parseInlineLogin = (input: string): InlineLoginCredentials | null => {
  const match = input.trim().match(/^@login\s+-connect\s+([^@]+)@(.+)$/i)

  if (!match) {
    return null
  }

  const memberId = match[1]?.trim() ?? ''
  const password = match[2]?.trim() ?? ''

  if (!memberId || !password) {
    return null
  }

  return { memberId, password }
}

export const isLoginPasswordContext = (context: string | null) => context === LOGIN_PW_CONTEXT

export const isLoginEntryAllowed = (input: string) => {
  const trimmed = input.trim()

  return trimmed === LOGIN_COMMAND || parseInlineLogin(trimmed) !== null
}

export const maskLoginCommandForDisplay = (command: string, context: string | null) => {
  const inline = parseInlineLogin(command)

  if (inline) {
    return `@login -connect ${inline.memberId}@**`
  }

  if (isLoginPasswordContext(context)) {
    return '**'
  }

  return command
}

export const matchLike = (text: string, pattern: string) => {
  const trimmed = pattern.trim()

  if (!trimmed || trimmed === '*') {
    return true
  }

  const parts = trimmed.split('*').filter(Boolean)

  if (parts.length === 0) {
    return true
  }

  let position = 0

  for (const part of parts) {
    const index = text.indexOf(part, position)

    if (index === -1) {
      return false
    }

    position = index + part.length
  }

  return true
}

export const extractKeyword = (rest: string) => {
  const trimmed = rest.trim()

  if (!trimmed) {
    return ''
  }

  return trimmed.replace(/^["']|["']$/g, '')
}
