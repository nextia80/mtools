import type { TerminalLineDraft } from '../types'
import { executeBdCommand } from './commands/boardCommand'
import { executeGcCommand } from './commands/calendarCommand'
import { executeMdCommand } from './commands/mdCommand'
import { isCdCommand, parseCdCommand, resolveCommandInput, type TerminalContext } from './context'
import { executeHelpCommand, formatKeywordHelpLines, isHelpCommand, parseContextHelpCommand } from './help'
import type { TerminalCommandResult } from './types'

export type { TerminalAction, TerminalCommandResult } from './types'
export type { TerminalContext } from './context'
export { resolveCommandInput } from './context'

export const executeTerminalCommand = async (
  input: string,
  apiBaseUrl: string,
  context: TerminalContext | null = null,
): Promise<TerminalCommandResult> => {
  const trimmed = input.trim()

  if (!trimmed) {
    return { lines: [] }
  }

  try {
    if (isHelpCommand(trimmed)) {
      return { lines: executeHelpCommand(trimmed) }
    }

    if (trimmed.toLowerCase() === 'cls') {
      return { lines: [], clear: true }
    }

    if (isCdCommand(trimmed)) {
      const parsed = parseCdCommand(trimmed, context)

      if ('error' in parsed) {
        return { lines: [{ type: 'error', text: parsed.error }] }
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

    const group = resolved.split(/\s+/)[0]?.toLowerCase() ?? ''

    if (group === 'bd') {
      return executeBdCommand(resolved, apiBaseUrl)
    }

    if (group === 'gc') {
      return executeGcCommand(resolved, apiBaseUrl)
    }

    if (group === 'md') {
      return executeMdCommand(resolved, apiBaseUrl)
    }

    return {
      lines: [{ type: 'error', text: `알 수 없는 명령어: ${group}. /? 를 입력하세요.` }],
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

export const terminalWelcomeLines = (): TerminalLineDraft[] => [
  { type: 'output', text: 'mtools terminal — bd / gc / md 명령어로 데이터를 조회합니다.' },
  { type: 'output', text: 'cd gc → cd l 로 하위 모드 진입, cd /gc 으로 상위 복귀.' },
  { type: 'output', text: '/? 또는 gc -? 형식으로 도움말을 볼 수 있습니다.' },
]
