import type { TerminalLineDraft } from '../types'

export type TerminalAction =
  | { type: 'open-md'; path: string }
  | { type: 'board-add' }
  | { type: 'board-edit'; id: string }

export type TerminalCommandResult = {
  lines: TerminalLineDraft[]
  clear?: boolean
  action?: TerminalAction
}
