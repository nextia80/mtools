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

export type ActiveView = 'home' | 'board' | 'member' | 'schedule' | 'swagger' | 'api' | 'docs'

export type MdViewMode = 'review' | 'edit'

export type TerminalLineType = 'input' | 'output' | 'error'

export type TerminalLineDraft = {
  type: TerminalLineType
  text: string
  clickValue?: string
  indented?: boolean
  groupBreak?: boolean
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

export type CalendarListItem = {
  key: number
  calendarId: string
  calendarName: string
}
