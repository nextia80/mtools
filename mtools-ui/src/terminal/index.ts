import type { TerminalLineDraft } from '../types'
import { executeBdCommand } from './commands/boardCommand'
import { executeGcCommand } from './commands/calendarCommand'
import {
  executeLoginCommand,
  guestWelcomeLines,
  loggedInWelcomeLines,
  LOGIN_COMMAND,
  LOGIN_GUIDE_MESSAGE,
  LOGIN_PW_CONTEXT,
  LOGOUT_COMMAND,
  isLoginEntryAllowed,
  parseInlineLogin,
  resetLoginState,
} from './commands/loginCommand'
import { formatSessionDurationLabel } from './textUtils'
import { executeGmCommand } from './commands/mailCommand'
import { executeMdCommand } from './commands/mdCommand'
import { isCdCommand, parseCdCommand, resolveCommandInput, type TerminalContext } from './context'
import { executeHelpCommand, formatKeywordHelpLines, isHelpCommand, parseContextHelpCommand } from './help'
import type { TerminalCommandResult, TerminalSessionInfo } from './types'

export type { TerminalAction, TerminalCommandResult, TerminalSessionInfo } from './types'
export type { TerminalContext } from './context'
export { resolveCommandInput } from './context'

const LOGIN_REQUIRED_MESSAGE = LOGIN_GUIDE_MESSAGE

const isLoginContext = (context: TerminalContext | null) =>
  context === LOGIN_COMMAND || context === LOGIN_PW_CONTEXT

const requiresLogin = (trimmed: string, context: TerminalContext | null, isLoggedIn: boolean) => {
  if (isLoggedIn || isLoginContext(context)) {
    return false
  }

  const lower = trimmed.toLowerCase()

  if (lower === 'cls' || isLoginEntryAllowed(trimmed)) {
    return false
  }

  return true
}

export const executeTerminalCommand = async (
  input: string,
  apiBaseUrl: string,
  context: TerminalContext | null = null,
  isLoggedIn = false,
  session: TerminalSessionInfo = { loggedInAt: null, lastSessionLabel: null },
): Promise<TerminalCommandResult> => {
  const trimmed = input.trim()

  if (!trimmed) {
    return { lines: [] }
  }

  if (requiresLogin(trimmed, context, isLoggedIn)) {
    return { lines: [{ type: 'error', text: LOGIN_REQUIRED_MESSAGE }] }
  }

  try {
    if (trimmed === '?') {
      if (context) {
        const root = context.split(/\s+/)[0]?.toLowerCase() ?? ''
        const contextHelp = parseContextHelpCommand(`${root} ?`)

        if (contextHelp && !('error' in contextHelp)) {
          return { lines: formatKeywordHelpLines(contextHelp.keyword) }
        }
      }

      return { lines: executeHelpCommand('?') }
    }

    if (isHelpCommand(trimmed)) {
      return { lines: executeHelpCommand(trimmed) }
    }

    if (trimmed.toLowerCase() === 'cls') {
      return { lines: [], clear: true }
    }

    if (trimmed === LOGOUT_COMMAND) {
      resetLoginState()

      if (isLoggedIn) {
        const sessionDurationLabel = session.loggedInAt
          ? formatSessionDurationLabel(session.loggedInAt)
          : null

        return {
          lines: [],
          context: null,
          welcomeLines: guestWelcomeLines(sessionDurationLabel),
          resetCommands: true,
          action: {
            type: 'member-logout',
            sessionDurationLabel: sessionDurationLabel ?? undefined,
          },
        }
      }

      return { lines: [], context: null }
    }

    if (trimmed === LOGIN_COMMAND || parseInlineLogin(trimmed)) {
      resetLoginState()
      return executeLoginCommand(trimmed, apiBaseUrl)
    }

    if (isCdCommand(trimmed)) {
      const parsed = parseCdCommand(trimmed, context)

      if ('error' in parsed) {
        return { lines: [{ type: 'error', text: parsed.error }] }
      }

      if (parsed.context === null) {
        resetLoginState()
      }

      return { lines: [], context: parsed.context }
    }

    if (trimmed === '<') {
      return {
        lines: [{ type: 'output', text: '좌측 메뉴를 접었습니다.' }],
        action: { type: 'sidebar-set-collapsed', collapsed: true },
      }
    }

    if (trimmed === '>') {
      return {
        lines: [{ type: 'output', text: '좌측 메뉴를 펼쳤습니다.' }],
        action: { type: 'sidebar-set-collapsed', collapsed: false },
      }
    }

    const resolved = resolveCommandInput(trimmed, context)
    const contextHelp = parseContextHelpCommand(resolved)

    if (contextHelp) {
      if ('error' in contextHelp) {
        return { lines: [{ type: 'error', text: contextHelp.error }] }
      }

      return { lines: formatKeywordHelpLines(contextHelp.keyword) }
    }

    if (resolved.startsWith(LOGIN_COMMAND)) {
      return executeLoginCommand(resolved, apiBaseUrl)
    }

    const group = resolved.split(/\s+/)[0]?.toLowerCase() ?? ''

    if (group === 'bd') {
      return executeBdCommand(resolved, apiBaseUrl)
    }

    if (group === 'gc') {
      return executeGcCommand(resolved, apiBaseUrl)
    }

    if (group === 'gm') {
      return executeGmCommand(resolved, apiBaseUrl)
    }

    if (group === 'md') {
      return executeMdCommand(resolved, apiBaseUrl)
    }

    return {
      lines: [{ type: 'error', text: `알 수 없는 명령어: ${group}. ? 를 입력하세요.` }],
    }
  } catch (error) {
    return {
      lines: [
        {
          type: 'error',
          text: error instanceof Error ? error.message : '명령 실행 중 오류가 발생했습니다.',
        },
      ],
    }
  }
}

export const terminalWelcomeLines = (
  isLoggedIn = false,
  lastSessionLabel: string | null = null,
): TerminalLineDraft[] =>
  isLoggedIn ? loggedInWelcomeLines() : guestWelcomeLines(lastSessionLabel)
