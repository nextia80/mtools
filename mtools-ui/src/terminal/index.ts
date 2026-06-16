import type { TerminalLineDraft } from '../types'
import { executeBdCommand } from './commands/boardCommand'
import { executeGcCommand } from './commands/calendarCommand'
import { executeMdCommand } from './commands/mdCommand'
import { executeHelpCommand, isHelpCommand } from './help'
import type { TerminalCommandResult } from './types'

export type { TerminalAction, TerminalCommandResult } from './types'

export const executeTerminalCommand = async (
  input: string,
  apiBaseUrl: string,
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

    const group = trimmed.split(/\s+/)[0]?.toLowerCase() ?? ''

    if (group === 'bd') {
      return executeBdCommand(trimmed, apiBaseUrl)
    }

    if (group === 'gc') {
      return executeGcCommand(trimmed, apiBaseUrl)
    }

    if (group === 'md') {
      return executeMdCommand(trimmed, apiBaseUrl)
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
  { type: 'output', text: '/? 를 입력하면 사용 가능한 명령어를 볼 수 있습니다.' },
]
