import { isHelpCommand } from './help'

export type TerminalContext = string | null

const ROOT_COMMANDS = ['bd', 'gc', 'md'] as const
type RootCommand = (typeof ROOT_COMMANDS)[number]

const SUBCOMMANDS: Record<RootCommand, readonly string[]> = {
  gc: ['l', 'c', 'a', 'm', 'r'],
  bd: ['l', 'lb', 'g', 'a', 'm', 'd'],
  md: ['ld', 'l', 'g'],
}

const GLOBAL_COMMANDS = new Set(['bd', 'gc', 'md', 'cd', 'cls'])

const isRootCommand = (value: string): value is RootCommand =>
  (ROOT_COMMANDS as readonly string[]).includes(value)

const isSubcommand = (root: RootCommand, sub: string) => SUBCOMMANDS[root].includes(sub)

const parseContextParts = (context: TerminalContext) => (context ? context.split(/\s+/) : [])

const joinContext = (parts: string[]) => parts.join(' ')

export const isCdCommand = (input: string) => /^cd(?:\s|$)/i.test(input.trim())

const isGcListArg = (input: string) => {
  const firstToken = input.trim().split(/\s+/)[0] ?? ''

  if (/^-k$/i.test(firstToken) || /^--y$/i.test(firstToken) || /^-c$/i.test(firstToken)) {
    return true
  }

  return /^\d{8}(?:~\d{8})?$/.test(firstToken)
}

export const resolveCommandInput = (
  input: string,
  context: TerminalContext,
): string => {
  const trimmed = input.trim()

  if (!trimmed || !context) {
    return trimmed
  }

  if (isHelpCommand(trimmed) || trimmed === '<' || trimmed === '>') {
    return trimmed
  }

  if (trimmed === '-?') {
    const root = context.split(/\s+/)[0] ?? ''

    if (isRootCommand(root)) {
      return `${root} -?`
    }
  }

  const firstWord = trimmed.split(/\s+/)[0]?.toLowerCase() ?? ''

  if (GLOBAL_COMMANDS.has(firstWord)) {
    return trimmed
  }

  const contextParts = parseContextParts(context)

  if (contextParts.length >= 2) {
    return `${context} ${trimmed}`
  }

  if (contextParts.length === 1) {
    const root = contextParts[0] as RootCommand

    if (isSubcommand(root, firstWord)) {
      return `${root} ${trimmed}`
    }

    if (root === 'gc' && isGcListArg(trimmed)) {
      return `${root} l ${trimmed}`
    }

    return `${root} ${trimmed}`
  }

  return trimmed
}

export const parseCdCommand = (
  input: string,
  currentContext: TerminalContext = null,
): { context: TerminalContext } | { error: string } => {
  const body = input.trim().replace(/^cd\s+/i, '').trim()

  if (!body) {
    return {
      error: '사용법: cd gc | cd l | cd / | cd /gc | cd /gc/l | cd /bd',
    }
  }

  const normalized = body.toLowerCase()

  if (normalized === '/') {
    return { context: null }
  }

  if (normalized.startsWith('/')) {
    const segments = normalized.slice(1).split('/').filter(Boolean)

    if (segments.length === 0) {
      return { context: null }
    }

    const root = segments[0] ?? ''

    if (!isRootCommand(root)) {
      return { error: `알 수 없는 경로: ${body}` }
    }

    if (segments.length === 1) {
      return { context: root }
    }

    if (segments.length === 2) {
      const sub = segments[1] ?? ''

      if (!isSubcommand(root, sub)) {
        return { error: `알 수 없는 하위 경로: ${root}/${sub}` }
      }

      return { context: joinContext([root, sub]) }
    }

    return { error: '경로는 최대 2단계입니다. 예: cd /gc/l' }
  }

  if (isRootCommand(normalized)) {
    return { context: normalized }
  }

  const currentParts = parseContextParts(currentContext)

  if (currentParts.length === 1) {
    const root = currentParts[0] as RootCommand

    if (isSubcommand(root, normalized)) {
      return { context: joinContext([root, normalized]) }
    }

    return { error: `알 수 없는 하위 명령: ${normalized}` }
  }

  if (currentParts.length >= 2) {
    return { error: '이미 최하위 모드입니다. cd /gc 등으로 상위로 이동하세요.' }
  }

  return { error: '먼저 cd gc 등으로 상위 모드를 선택하세요.' }
}
