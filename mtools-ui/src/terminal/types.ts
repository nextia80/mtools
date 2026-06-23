import type { TerminalLineDraft } from '../types'
import type { TerminalContext } from './context'
import type { Member } from '../types'

export type TerminalAction =
  | { type: 'open-md'; path: string }
  | { type: 'board-add' }
  | { type: 'board-edit'; id: string }
  | { type: 'sidebar-set-collapsed'; collapsed: boolean }
  | { type: 'scroll-mail'; anchor: 'start' | 'end'; ref?: string }
  | { type: 'member-login'; member: Member }
  | { type: 'member-logout'; sessionDurationLabel?: string }

export type TerminalSessionInfo = {
  loggedInAt: string | null
  lastSessionLabel: string | null
}

export type TerminalCommandResult = {
  lines: TerminalLineDraft[]
  clear?: boolean
  welcomeLines?: TerminalLineDraft[]
  resetCommands?: boolean
  action?: TerminalAction
  context?: TerminalContext | null
  inputDraft?: string
}
