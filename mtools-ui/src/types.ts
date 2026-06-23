export type MdFile = {
  path: string
  name: string
  size: number
  modifiedAt: string
}

export type MdFileGroup = {
  date: string
  files: MdFile[]
}

export type BoardPost = {
  idBoard: string
  stPid: string
  stOrder: string
  title: string
  text: string
  insertedAt: string | null
  updatedAt: string | null
}

export type Member = {
  idMember: string
  memberId: string
  name: string
  email: string | null
  level: string
  ynUse: string
  insertedAt: string | null
  updatedAt: string | null
}

export type ActiveView = 'home' | 'board' | 'member' | 'schedule' | 'mail' | 'swagger' | 'api' | 'docs'

export type MdViewMode = 'review' | 'edit'

export type TerminalLineType = 'input' | 'output' | 'error'

export type TerminalLineTextPart = {
  text: string
  color?: string
}

export type TerminalLineDraft = {
  type: TerminalLineType
  text: string
  clickValue?: string
  indented?: boolean
  groupBreak?: boolean
  textParts?: TerminalLineTextPart[]
  htmlContent?: string
  mailScrollAnchor?: 'start' | 'end'
  mailRef?: string
  logo?: boolean
  logoSubtitle?: boolean
  bannerBar?: boolean
  welcomeStatus?: boolean
  logoMark?: boolean
}

export type TerminalLine = TerminalLineDraft & {
  id: number
}

export type CalendarEvent = {
  id: string
  calendarKey: number | null
  calendarId: string
  calendarName: string
  calendarBackgroundColor: string | null
  calendarForegroundColor: string | null
  summary: string
  description: string | null
  start: string
  end: string
  allDay: boolean
  htmlLink: string | null
  location: string | null
}

export type CalendarConnectionStatus = {
  connected: boolean
  email: string | null
}

export type MailMessage = {
  id: string
  threadId: string
  subject: string
  from: string
  date: string
  snippet: string
  unread: boolean
}

export type MailConnectionStatus = {
  connected: boolean
  email: string | null
}

export type MailMessageDetail = {
  id: string
  threadId: string
  subject: string
  from: string
  date: string
  snippet: string
  unread: boolean
  bodyText: string
  bodyHtml: string | null
}

export type MailMessagesPage = {
  messages: MailMessage[]
  pageSize: number
  totalCount: number
  unreadCount: number
  inboxTotalCount: number
  nextPageToken: string | null
  hasNext: boolean
}

export type CalendarListItem = {
  key: number
  calendarId: string
  calendarName: string
}
