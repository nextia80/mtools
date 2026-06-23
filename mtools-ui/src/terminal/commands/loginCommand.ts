import type { Member, TerminalLineDraft } from '../../types'
import type { TerminalCommandResult } from '../types'
import {
  LOGIN_COMMAND,
  LOGIN_PW_CONTEXT,
  normalizeLastSessionLabel,
  parseInlineLogin,
} from '../textUtils'
import { bannerBarLine, loggedInWelcomeLines } from '../logo'

export { loggedInWelcomeLines }
export {
  LOGIN_COMMAND,
  LOGOUT_COMMAND,
  LOGIN_PW_CONTEXT,
  isLoginPasswordContext,
  parseInlineLogin,
  maskLoginCommandForDisplay,
  isLoginEntryAllowed,
} from '../textUtils'

export const LOGIN_GUIDE_MESSAGE = '메뉴를 사용하시려면 로그인을 해주시기 바랍니다.'

const GUEST_WELCOME_MESSAGE = '* mTools Terminal System ver 1.0에 접속하였습니다.'

let pendingLoginId: string | null = null

export const resetLoginState = () => {
  pendingLoginId = null
}

const guestWelcomeContentLines = (): TerminalLineDraft[] => [
  bannerBarLine(),
  { type: 'output', text: GUEST_WELCOME_MESSAGE, welcomeStatus: true },
  { type: 'output', text: `* ${LOGIN_GUIDE_MESSAGE}`, welcomeStatus: true },
  bannerBarLine(),
]

export const guestWelcomeLines = (lastSessionLabel: string | null = null): TerminalLineDraft[] => {
  const normalizedLabel = normalizeLastSessionLabel(lastSessionLabel)
  const welcomeBlock = guestWelcomeContentLines()

  if (!normalizedLabel) {
    return welcomeBlock
  }

  return [
    { type: 'output', text: `* 직전 접속기록 : ${normalizedLabel}`, welcomeStatus: true },
    ...welcomeBlock,
  ]
}

const loginFailureWelcomeLines = (): TerminalLineDraft[] => [
  { type: 'output', text: '정보가 올바르지 않습니다.' },
  { type: 'output', text: '' },
  ...guestWelcomeLines(),
]

const loginFailureResult = (): TerminalCommandResult => ({
  lines: [],
  context: null,
  welcomeLines: loginFailureWelcomeLines(),
  resetCommands: true,
})

const performLogin = async (
  memberId: string,
  password: string,
  apiBaseUrl: string,
): Promise<TerminalCommandResult> => {
  pendingLoginId = null

  try {
    const response = await fetch(`${apiBaseUrl}/api/members/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId, password }),
    })

    if (!response.ok) {
      return loginFailureResult()
    }

    const member = (await response.json()) as Member

    return {
      lines: [],
      context: null,
      welcomeLines: loggedInWelcomeLines(),
      resetCommands: true,
      action: { type: 'member-login', member },
    }
  } catch {
    return loginFailureResult()
  }
}

export async function executeLoginCommand(
  resolved: string,
  apiBaseUrl: string,
): Promise<TerminalCommandResult> {
  const trimmed = resolved.trim()
  const inline = parseInlineLogin(trimmed)

  if (inline) {
    return performLogin(inline.memberId, inline.password, apiBaseUrl)
  }

  const parts = trimmed.split(/\s+/)

  if (parts[0] !== LOGIN_COMMAND) {
    return { lines: [{ type: 'error', text: '알 수 없는 로그인 명령입니다.' }] }
  }

  if (parts[1] === 'pw' && parts.length >= 3) {
    const password = parts.slice(2).join(' ')
    const memberId = pendingLoginId

    pendingLoginId = null

    if (!memberId) {
      return loginFailureResult()
    }

    return performLogin(memberId, password, apiBaseUrl)
  }

  if (parts.length >= 2) {
    pendingLoginId = parts.slice(1).join(' ')

    return {
      lines: [],
      context: LOGIN_PW_CONTEXT,
    }
  }

  return {
    lines: [],
    context: LOGIN_COMMAND,
  }
}
