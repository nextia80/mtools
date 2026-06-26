import type { TerminalLineDraft } from '../types'

const MTOOLS_ASCII = [
  '███╗   ███╗████████╗ ██████╗  ██████╗ ██╗     ███████╗',
  '████╗ ████║╚══██╔══╝██╔═══██╗██╔═══██╗██║     ██╔════╝',
  '██╔████╔██║   ██║   ██║   ██║██║   ██║██║     ███████╗',
  '██║╚██╔╝██║   ██║   ██║   ██║██║   ██║██║     ╚════██║',
  '██║ ╚═╝ ██║   ██║   ╚██████╔╝╚██████╔╝███████╗███████║',
  '╚═╝     ╚═╝   ╚═╝    ╚═════╝  ╚═════╝ ╚══════╝╚══════╝',
].join('\n')

const bannerBarLine = (): TerminalLineDraft => ({
  type: 'output',
  text: '',
  bannerBar: true,
})

export { bannerBarLine }

export const mtoolsLogoLines = (): TerminalLineDraft[] => [
  { type: 'output', text: MTOOLS_ASCII, logo: true },
  { type: 'output', text: 'Terminal Web System ver 1.0', logoSubtitle: true },
]

export const prependLogo = (lines: TerminalLineDraft[]): TerminalLineDraft[] => [
  bannerBarLine(),
  ...mtoolsLogoLines(),
  { type: 'output', text: '' },
  ...lines,
  { type: 'output', text: '' },
  bannerBarLine(),
]

export const loggedInWelcomeLines = (): TerminalLineDraft[] => [
  bannerBarLine(),
  ...mtoolsLogoLines(),
  bannerBarLine(),
  { type: 'output', text: '** mTools 시스템에 접속하셨습니다.', welcomeStatus: true },
]
