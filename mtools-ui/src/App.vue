<script setup lang="ts">
import { marked } from 'marked'
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import ApiTestView from './components/ApiTestView.vue'
import BoardView from './components/BoardView.vue'
import DocsView from './components/DocsView.vue'
import MailDetailView from './components/MailDetailView.vue'
import MailView from './components/MailView.vue'
import MemberView from './components/MemberView.vue'
import ScheduleView from './components/ScheduleView.vue'
import SidebarMenu from './components/SidebarMenu.vue'
import SwaggerView from './components/SwaggerView.vue'
import TerminalView from './components/TerminalView.vue'
import type { TerminalAction } from './terminal'
import type { ActiveView, BoardPost, CalendarConnectionStatus, CalendarEvent, MailConnectionStatus, MailMessage, MailMessageDetail, MailMessagesPage, MdFile, MdViewMode } from './types'

const API_BASE_URL = 'http://localhost:8080'
const SWAGGER_UI_URL = `${API_BASE_URL}/swagger-ui/index.html`

const activeView = ref<ActiveView>('home')
const sidebarCollapsed = ref(false)
const terminalViewRef = ref<{ focusInput: () => void } | null>(null)
const apiEndpoint = ref('/api/echo')
const apiInput = ref('{\n  "id": "a"\n}')
const apiResult = ref('')
const errorMessage = ref('')
const boardPosts = ref<BoardPost[]>([])
const boardFormTitle = ref('')
const boardFormText = ref('')
const editingBoardId = ref<string | null>(null)
const boardReplyParentId = ref<string | null>(null)
const boardErrorMessage = ref('')
const boardSaveMessage = ref('')
const isBoardLoading = ref(false)
const isBoardSaving = ref(false)
const mdFiles = ref<MdFile[]>([])
const selectedMdPath = ref('')
const openMdDate = ref('')
const mdContent = ref('')
const editedMdContent = ref('')
const mdViewMode = ref<MdViewMode>('review')
const mdErrorMessage = ref('')
const mdSaveMessage = ref('')
const isMdLoading = ref(false)
const isMdContentLoading = ref(false)
const isMdSaving = ref(false)
const calendarConnected = ref(false)
const calendarEmail = ref<string | null>(null)
const calendarEvents = ref<CalendarEvent[]>([])
const calendarErrorMessage = ref('')
const calendarSaveMessage = ref('')
const isCalendarLoading = ref(false)
const isCalendarConnecting = ref(false)
const isCalendarDisconnecting = ref(false)
const mailConnected = ref(false)
const mailEmail = ref<string | null>(null)
const mailMessages = ref<MailMessage[]>([])
const mailUnreadOnly = ref(true)
const mailPageIndex = ref(1)
const mailPageTokens = ref<(string | null)[]>([null])
const mailPageSize = ref(10)
const mailTotalCount = ref(0)
const mailUnreadCount = ref(0)
const mailInboxTotalCount = ref(0)
const mailHasNext = ref(false)
const mailViewMode = ref<'list' | 'detail'>('list')
const mailDetail = ref<MailMessageDetail | null>(null)
const selectedMailIndex = ref(-1)
const isMailDetailLoading = ref(false)
const isMailDeleting = ref(false)
const mailErrorMessage = ref('')
const mailSaveMessage = ref('')
const isMailLoading = ref(false)
const isMailConnecting = ref(false)
const isMailDisconnecting = ref(false)
let mdListTimer: number | undefined

const getMdFileDate = (file: MdFile) => {
  const pathDate = file.path.split('/')[0] ?? ''

  return /^\d{4}-\d{2}-\d{2}$/.test(pathDate)
    ? pathDate
    : new Date(file.modifiedAt).toISOString().slice(0, 10)
}

const selectedMdFile = computed(() =>
  mdFiles.value.find((file) => file.path === selectedMdPath.value),
)
const addCopyButtonsToCodeBlocks = (html: string) => {
  const document = new DOMParser().parseFromString(html, 'text/html')

  document.querySelectorAll('pre').forEach((pre) => {
    const wrapper = document.createElement('div')
    const button = document.createElement('button')

    wrapper.className = 'code-block'
    button.className = 'copy-code-button'
    button.type = 'button'
    button.textContent = '복사'

    pre.replaceWith(wrapper)
    wrapper.append(button, pre)
  })

  return document.body.innerHTML
}
const renderedMdContent = computed(() => {
  const html = marked.parse(editedMdContent.value, { async: false }) as string

  return addCopyButtonsToCodeBlocks(html)
})
const mdFilesByDate = computed(() => {
  const groups = new Map<string, MdFile[]>()

  mdFiles.value.forEach((file) => {
    const date = getMdFileDate(file)
    const files = groups.get(date) ?? []

    files.push(file)
    groups.set(date, files)
  })

  return Array.from(groups.entries())
    .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
    .map(([date, files]) => ({
      date,
      files: [...files].sort((fileA, fileB) => fileB.modifiedAt.localeCompare(fileA.modifiedAt)),
    }))
})

const setActiveView = (view: ActiveView) => {
  activeView.value = view

  if (view === 'docs') {
    const date = openMdDate.value || mdFilesByDate.value[0]?.date || ''

    if (date) {
      openMdDate.value = date
      selectFirstMdFileByDate(date)
    }
  }

  if (view === 'board') {
    void loadBoardPosts()
  }

  if (view === 'schedule') {
    void loadCalendarData()
  }

  if (view === 'mail') {
    void loadMailData()
  }
}

const selectFirstMdFileByDate = (date: string) => {
  const firstFile = mdFilesByDate.value.find((group) => group.date === date)?.files[0]

  if (firstFile && firstFile.path !== selectedMdPath.value) {
    void selectMdFile(firstFile.path)
  }
}

const openDateGroup = (date: string) => {
  openMdDate.value = date
  selectFirstMdFileByDate(date)
}

const setMdViewMode = (mode: MdViewMode) => {
  mdViewMode.value = mode
}

const buildApiUrl = () => {
  const endpoint = apiEndpoint.value.trim()

  if (!endpoint) {
    throw new Error('End point를 입력하세요.')
  }

  const url = new URL(endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`)
  const input = apiInput.value.trim()

  if (!input) {
    return url.toString()
  }

  const params = JSON.parse(input) as Record<string, unknown>

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return
    }

    url.searchParams.set(key, typeof value === 'string' ? value : JSON.stringify(value))
  })

  return url.toString()
}

const callApi = async () => {
  apiResult.value = ''
  errorMessage.value = ''

  try {
    const response = await fetch(buildApiUrl())

    if (!response.ok) {
      throw new Error(`API 요청 실패: ${response.status}`)
    }

    const contentType = response.headers.get('content-type') ?? ''
    const data = contentType.includes('application/json') ? await response.json() : await response.text()
    apiResult.value = typeof data === 'string' ? data : JSON.stringify(data, null, 2)
  } catch (error) {
    if (error instanceof SyntaxError) {
      errorMessage.value = '입력값은 JSON 형식이어야 합니다. 예: {"id":"a"}'
      return
    }

    errorMessage.value = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
  }
}

const loadBoardPosts = async () => {
  boardErrorMessage.value = ''
  isBoardLoading.value = true

  try {
    const response = await fetch(`${API_BASE_URL}/api/boards`)

    if (!response.ok) {
      throw new Error(`게시판 조회 실패: ${response.status}`)
    }

    boardPosts.value = (await response.json()) as BoardPost[]
  } catch (error) {
    boardErrorMessage.value =
      error instanceof Error ? error.message : '게시판을 불러오지 못했습니다.'
  } finally {
    isBoardLoading.value = false
  }
}

const resetBoardForm = () => {
  editingBoardId.value = null
  boardReplyParentId.value = null
  boardFormTitle.value = ''
  boardFormText.value = ''
}

const startBoardReply = (post: BoardPost) => {
  boardReplyParentId.value = post.idBoard
  editingBoardId.value = null
  boardFormTitle.value = ''
  boardFormText.value = ''
  boardErrorMessage.value = ''
  boardSaveMessage.value = ''
}

const cancelBoardReply = () => {
  boardReplyParentId.value = null
  boardFormTitle.value = ''
  boardFormText.value = ''
}

const editBoardPost = (post: BoardPost) => {
  editingBoardId.value = post.idBoard
  boardReplyParentId.value = null
  boardFormTitle.value = post.title ?? ''
  boardFormText.value = post.text ?? ''
  boardErrorMessage.value = ''
  boardSaveMessage.value = ''
}

const saveBoardPost = async () => {
  if (!boardFormTitle.value.trim()) {
    boardErrorMessage.value = '제목을 입력하세요.'
    return
  }

  boardErrorMessage.value = ''
  boardSaveMessage.value = ''
  isBoardSaving.value = true

  const isEditing = editingBoardId.value !== null
  const url = isEditing
    ? `${API_BASE_URL}/api/boards/${editingBoardId.value}`
    : `${API_BASE_URL}/api/boards`

  try {
    const response = await fetch(url, {
      method: isEditing ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: boardFormTitle.value,
        text: boardFormText.value,
        ...(boardReplyParentId.value ? { parentId: boardReplyParentId.value } : {}),
      }),
    })

    if (!response.ok) {
      throw new Error(`게시글 저장 실패: ${response.status}`)
    }

    resetBoardForm()
    boardSaveMessage.value = isEditing ? '게시글을 수정했습니다.' : '게시글을 등록했습니다.'
    await loadBoardPosts()
  } catch (error) {
    boardErrorMessage.value =
      error instanceof Error ? error.message : '게시글을 저장하지 못했습니다.'
  } finally {
    isBoardSaving.value = false
  }
}

const deleteBoardPost = async (post: BoardPost) => {
  if (!window.confirm(`"${post.title || '제목 없음'}" 게시글을 삭제할까요?`)) {
    return
  }

  boardErrorMessage.value = ''
  boardSaveMessage.value = ''

  try {
    const response = await fetch(`${API_BASE_URL}/api/boards/${post.idBoard}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error(`게시글 삭제 실패: ${response.status}`)
    }

    if (editingBoardId.value === post.idBoard || boardReplyParentId.value === post.idBoard) {
      resetBoardForm()
    }

    boardSaveMessage.value = '게시글을 삭제했습니다.'
    await loadBoardPosts()
  } catch (error) {
    boardErrorMessage.value =
      error instanceof Error ? error.message : '게시글을 삭제하지 못했습니다.'
  }
}

const loadCalendarStatus = async () => {
  const response = await fetch(`${API_BASE_URL}/api/calendar/status`)

  if (!response.ok) {
    throw new Error(`연결 상태 조회 실패: ${response.status}`)
  }

  const status = (await response.json()) as CalendarConnectionStatus
  calendarConnected.value = status.connected
  calendarEmail.value = status.email
}

const loadCalendarEvents = async () => {
  const response = await fetch(`${API_BASE_URL}/api/calendar/events`)

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `일정 조회 실패: ${response.status}`)
  }

  calendarEvents.value = (await response.json()) as CalendarEvent[]
}

const loadCalendarData = async () => {
  calendarErrorMessage.value = ''
  isCalendarLoading.value = true

  try {
    await loadCalendarStatus()

    if (calendarConnected.value) {
      await loadCalendarEvents()
    } else {
      calendarEvents.value = []
    }
  } catch (error) {
    calendarErrorMessage.value =
      error instanceof Error ? error.message : '일정 정보를 불러오지 못했습니다.'
  } finally {
    isCalendarLoading.value = false
  }
}

const connectGoogleCalendar = async () => {
  calendarErrorMessage.value = ''
  calendarSaveMessage.value = ''
  isCalendarConnecting.value = true

  try {
    const response = await fetch(`${API_BASE_URL}/api/calendar/auth-url`)

    if (!response.ok) {
      const message = await response.text()
      throw new Error(message || `연결 URL 생성 실패: ${response.status}`)
    }

    const data = (await response.json()) as { authUrl: string }
    window.location.href = data.authUrl
  } catch (error) {
    calendarErrorMessage.value =
      error instanceof Error ? error.message : 'Google Calendar 연결을 시작하지 못했습니다.'
    isCalendarConnecting.value = false
  }
}

const disconnectGoogleCalendar = async () => {
  if (!window.confirm('Google Calendar 연결을 해제할까요?')) {
    return
  }

  calendarErrorMessage.value = ''
  calendarSaveMessage.value = ''
  isCalendarDisconnecting.value = true

  try {
    const response = await fetch(`${API_BASE_URL}/api/calendar/disconnect`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error(`연결 해제 실패: ${response.status}`)
    }

    calendarConnected.value = false
    calendarEmail.value = null
    calendarEvents.value = []
    calendarSaveMessage.value = 'Google Calendar 연결을 해제했습니다.'
  } catch (error) {
    calendarErrorMessage.value =
      error instanceof Error ? error.message : 'Google Calendar 연결을 해제하지 못했습니다.'
  } finally {
    isCalendarDisconnecting.value = false
  }
}

const handleCalendarCallbackParams = () => {
  const params = new URLSearchParams(window.location.search)
  const view = params.get('view')

  if (view !== 'schedule') {
    return
  }

  activeView.value = 'schedule'

  const calendarResult = params.get('calendar')

  if (calendarResult === 'connected') {
    calendarSaveMessage.value = 'Google Calendar 연결에 성공했습니다.'
  }

  if (calendarResult === 'error') {
    calendarErrorMessage.value = params.get('message') || 'Google Calendar 연결에 실패했습니다.'
  }

  window.history.replaceState({}, '', window.location.pathname)
  void loadCalendarData()
}

const loadMailStatus = async () => {
  const response = await fetch(`${API_BASE_URL}/api/mail/status`)

  if (!response.ok) {
    throw new Error(`연결 상태 조회 실패: ${response.status}`)
  }

  const status = (await response.json()) as MailConnectionStatus
  mailConnected.value = status.connected
  mailEmail.value = status.email
}

const resetMailPagination = () => {
  mailPageIndex.value = 1
  mailPageTokens.value = [null]
}

const loadMailMessages = async (targetPage = mailPageIndex.value) => {
  const pageToken = mailPageTokens.value[targetPage - 1] ?? null
  const params = new URLSearchParams({
    maxResults: '10',
    unreadOnly: String(mailUnreadOnly.value),
  })

  if (pageToken) {
    params.set('pageToken', pageToken)
  }

  const response = await fetch(`${API_BASE_URL}/api/mail/messages?${params.toString()}`)

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `메일 조회 실패: ${response.status}`)
  }

  const page = (await response.json()) as MailMessagesPage

  mailMessages.value = page.messages
  mailPageSize.value = page.pageSize
  mailTotalCount.value = page.totalCount
  mailUnreadCount.value = page.unreadCount
  mailInboxTotalCount.value = page.inboxTotalCount
  mailHasNext.value = page.hasNext
  mailPageIndex.value = targetPage

  if (page.hasNext && page.nextPageToken) {
    const tokens = [...mailPageTokens.value]

    tokens[targetPage] = page.nextPageToken
    mailPageTokens.value = tokens
  }
}

const setMailUnreadOnly = (unreadOnly: boolean) => {
  mailUnreadOnly.value = unreadOnly
  resetMailPagination()
  closeMailDetail()
  void loadMailData()
}

const goMailNextPage = () => {
  if (!mailHasNext.value || isMailLoading.value) {
    return
  }

  void loadMailData(mailPageIndex.value + 1)
}

const goMailPrevPage = () => {
  if (mailPageIndex.value <= 1 || isMailLoading.value) {
    return
  }

  void loadMailData(mailPageIndex.value - 1)
}

const loadMailData = async (targetPage = mailPageIndex.value) => {
  mailErrorMessage.value = ''
  isMailLoading.value = true

  try {
    await loadMailStatus()

    if (mailConnected.value) {
      await loadMailMessages(targetPage)
    } else {
      mailMessages.value = []
      resetMailPagination()
      mailTotalCount.value = 0
      mailUnreadCount.value = 0
      mailInboxTotalCount.value = 0
      mailHasNext.value = false
    }
  } catch (error) {
    mailErrorMessage.value =
      error instanceof Error ? error.message : '메일 정보를 불러오지 못했습니다.'
  } finally {
    isMailLoading.value = false
  }
}

const refreshMailData = () => {
  resetMailPagination()
  closeMailDetail()
  void loadMailData(1)
}

const markMailMessageAsRead = (messageId: string) => {
  const target = mailMessages.value.find((message) => message.id === messageId)

  if (!target || !target.unread) {
    return
  }

  target.unread = false
  mailUnreadCount.value = Math.max(0, mailUnreadCount.value - 1)

  if (mailUnreadOnly.value) {
    mailTotalCount.value = Math.max(0, mailTotalCount.value - 1)
  }
}

const loadMailDetail = async (messageId: string) => {
  isMailDetailLoading.value = true
  mailErrorMessage.value = ''

  try {
    const response = await fetch(`${API_BASE_URL}/api/mail/messages/${messageId}`)

    if (!response.ok) {
      const message = await response.text()
      throw new Error(message || `메일 상세 조회 실패: ${response.status}`)
    }

    mailDetail.value = (await response.json()) as MailMessageDetail
    markMailMessageAsRead(messageId)
  } catch (error) {
    mailErrorMessage.value =
      error instanceof Error ? error.message : '메일 상세를 불러오지 못했습니다.'
  } finally {
    isMailDetailLoading.value = false
  }
}

const openMailDetail = (message: MailMessage, index: number) => {
  mailViewMode.value = 'detail'
  selectedMailIndex.value = index
  mailSaveMessage.value = ''
  mailErrorMessage.value = ''
  void loadMailDetail(message.id)
}

const closeMailDetail = () => {
  mailViewMode.value = 'list'
  selectedMailIndex.value = -1
  mailDetail.value = null
  isMailDetailLoading.value = false
  isMailDeleting.value = false
}

const goMailDetailPrev = () => {
  if (selectedMailIndex.value <= 0 || isMailDetailLoading.value || isMailDeleting.value) {
    return
  }

  const prevIndex = selectedMailIndex.value - 1
  const message = mailMessages.value[prevIndex]

  if (message) {
    openMailDetail(message, prevIndex)
  }
}

const goMailDetailNext = () => {
  if (
    selectedMailIndex.value < 0
    || selectedMailIndex.value >= mailMessages.value.length - 1
    || isMailDetailLoading.value
    || isMailDeleting.value
  ) {
    return
  }

  const nextIndex = selectedMailIndex.value + 1
  const message = mailMessages.value[nextIndex]

  if (message) {
    openMailDetail(message, nextIndex)
  }
}

const deleteMailDetail = async () => {
  const messageId = mailDetail.value?.id

  if (!messageId || isMailDeleting.value) {
    return
  }

  if (!window.confirm('이 메일을 휴지통으로 이동할까요?')) {
    return
  }

  isMailDeleting.value = true
  mailErrorMessage.value = ''
  mailSaveMessage.value = ''

  try {
    const response = await fetch(`${API_BASE_URL}/api/mail/messages/${messageId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const message = await response.text()
      throw new Error(message || `메일 삭제 실패: ${response.status}`)
    }

    const deletedIndex = selectedMailIndex.value
    mailMessages.value = mailMessages.value.filter((message) => message.id !== messageId)
    mailSaveMessage.value = '메일을 휴지통으로 이동했습니다.'

    if (mailMessages.value.length === 0) {
      closeMailDetail()
      await loadMailData(mailPageIndex.value)
      return
    }

    const nextIndex = Math.min(deletedIndex, mailMessages.value.length - 1)
    const nextMessage = mailMessages.value[nextIndex]

    if (nextMessage) {
      openMailDetail(nextMessage, nextIndex)
    } else {
      closeMailDetail()
    }
  } catch (error) {
    mailErrorMessage.value =
      error instanceof Error ? error.message : '메일을 삭제하지 못했습니다.'
  } finally {
    isMailDeleting.value = false
  }
}

const connectGmail = async () => {
  mailErrorMessage.value = ''
  mailSaveMessage.value = ''
  isMailConnecting.value = true

  try {
    const response = await fetch(`${API_BASE_URL}/api/mail/auth-url`)

    if (!response.ok) {
      const message = await response.text()
      throw new Error(message || `연결 URL 생성 실패: ${response.status}`)
    }

    const data = (await response.json()) as { authUrl: string }
    window.location.href = data.authUrl
  } catch (error) {
    mailErrorMessage.value =
      error instanceof Error ? error.message : 'Gmail 연결을 시작하지 못했습니다.'
    isMailConnecting.value = false
  }
}

const disconnectGmail = async () => {
  if (!window.confirm('Gmail 연결을 해제할까요?')) {
    return
  }

  mailErrorMessage.value = ''
  mailSaveMessage.value = ''
  isMailDisconnecting.value = true

  try {
    const response = await fetch(`${API_BASE_URL}/api/mail/disconnect`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error(`연결 해제 실패: ${response.status}`)
    }

    mailConnected.value = false
    mailEmail.value = null
    mailMessages.value = []
    resetMailPagination()
    mailTotalCount.value = 0
    mailUnreadCount.value = 0
    mailInboxTotalCount.value = 0
    mailHasNext.value = false
    mailSaveMessage.value = 'Gmail 연결을 해제했습니다.'
  } catch (error) {
    mailErrorMessage.value =
      error instanceof Error ? error.message : 'Gmail 연결을 해제하지 못했습니다.'
  } finally {
    isMailDisconnecting.value = false
  }
}

const handleMailCallbackParams = () => {
  const params = new URLSearchParams(window.location.search)
  const view = params.get('view')

  if (view !== 'mail') {
    return
  }

  activeView.value = 'mail'

  const mailResult = params.get('mail')

  if (mailResult === 'connected') {
    mailSaveMessage.value = 'Gmail 연결에 성공했습니다.'
  }

  if (mailResult === 'error') {
    mailErrorMessage.value = params.get('message') || 'Gmail 연결에 실패했습니다.'
  }

  window.history.replaceState({}, '', window.location.pathname)
  void loadMailData()
}

const loadMdFiles = async (selectFirstFile = false) => {
  mdErrorMessage.value = ''
  isMdLoading.value = true

  try {
    const response = await fetch(`${API_BASE_URL}/api/md-files`)

    if (!response.ok) {
      throw new Error(`MD 목록 요청 실패: ${response.status}`)
    }

    const files = (await response.json()) as MdFile[]
    mdFiles.value = files
    const dates = Array.from(new Set(files.map(getMdFileDate))).sort((dateA, dateB) =>
      dateB.localeCompare(dateA),
    )
    const openDateExists = dates.includes(openMdDate.value)

    if (!openDateExists) {
      openMdDate.value = dates[0] ?? ''
    }

    const selectedFileExists = files.some((file) => file.path === selectedMdPath.value)

    if (!selectedFileExists) {
      selectedMdPath.value = ''
      mdContent.value = ''
      editedMdContent.value = ''
      mdSaveMessage.value = ''
    }

    const firstFile = files[0]

    if (selectFirstFile && firstFile) {
      await selectMdFile(firstFile.path)
    }
  } catch (error) {
    mdErrorMessage.value = error instanceof Error ? error.message : 'MD 목록을 불러오지 못했습니다.'
  } finally {
    isMdLoading.value = false
  }
}

const selectMdFile = async (path: string) => {
  activeView.value = 'docs'
  selectedMdPath.value = path
  const selectedFile = mdFiles.value.find((file) => file.path === path)

  if (selectedFile) {
    openMdDate.value = getMdFileDate(selectedFile)
  }

  mdContent.value = ''
  editedMdContent.value = ''
  mdErrorMessage.value = ''
  mdSaveMessage.value = ''
  mdViewMode.value = 'review'
  isMdContentLoading.value = true

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/md-files/content?path=${encodeURIComponent(path)}`,
    )

    if (!response.ok) {
      throw new Error(`MD 파일 요청 실패: ${response.status}`)
    }

    const data = (await response.json()) as { content: string }
    mdContent.value = data.content
    editedMdContent.value = data.content
  } catch (error) {
    mdErrorMessage.value = error instanceof Error ? error.message : 'MD 파일을 불러오지 못했습니다.'
  } finally {
    isMdContentLoading.value = false
  }
}

const saveMdFile = async () => {
  if (!selectedMdPath.value) {
    mdErrorMessage.value = '저장할 MD 파일을 선택하세요.'
    return
  }

  mdErrorMessage.value = ''
  mdSaveMessage.value = ''
  isMdSaving.value = true

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/md-files/content?path=${encodeURIComponent(selectedMdPath.value)}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: editedMdContent.value }),
      },
    )

    if (!response.ok) {
      throw new Error(`MD 파일 저장 실패: ${response.status}`)
    }

    mdContent.value = editedMdContent.value
    mdSaveMessage.value = '저장되었습니다.'
    mdViewMode.value = 'review'
    await loadMdFiles()
  } catch (error) {
    mdErrorMessage.value = error instanceof Error ? error.message : 'MD 파일을 저장하지 못했습니다.'
  } finally {
    isMdSaving.value = false
  }
}

const focusHomeTerminal = async () => {
  setActiveView('home')
  await nextTick()
  terminalViewRef.value?.focusInput()
}

const openDocsMenu = () => {
  setActiveView('docs')

  const date = openMdDate.value || mdFilesByDate.value[0]?.date || ''

  if (date) {
    openMdDate.value = date
    selectFirstMdFileByDate(date)
  }
}

const toggleSidebarCollapsed = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

const handleTerminalAction = (action: TerminalAction) => {
  if (action.type === 'sidebar-set-collapsed') {
    sidebarCollapsed.value = action.collapsed
    return
  }

  if (action.type === 'open-md') {
    setActiveView('docs')
    void selectMdFile(action.path)
    return
  }

  if (action.type === 'board-add') {
    setActiveView('board')
    resetBoardForm()
    return
  }

  if (action.type === 'board-edit') {
    setActiveView('board')
    void (async () => {
      if (boardPosts.value.length === 0) {
        await loadBoardPosts()
      }

      const post = boardPosts.value.find((item) => item.idBoard === action.id)

      if (post) {
        editBoardPost(post)
      }
    })()
  }
}

const handleMailListKeyboardShortcut = (event: KeyboardEvent) => {
  if (activeView.value !== 'mail' || mailViewMode.value !== 'list' || !mailConnected.value) {
    return false
  }

  if (!event.altKey || event.metaKey || event.ctrlKey) {
    return false
  }

  if (event.key !== 'Enter') {
    return false
  }

  event.preventDefault()

  const firstMessage = mailMessages.value[0]

  if (!isMailLoading.value && firstMessage) {
    openMailDetail(firstMessage, 0)
  }

  return true
}

const handleMailDetailKeyboardShortcut = (event: KeyboardEvent) => {
  if (activeView.value !== 'mail' || mailViewMode.value !== 'detail') {
    return false
  }

  if (!event.altKey || event.metaKey || event.ctrlKey) {
    return false
  }

  const key = event.key

  if (key === 'ArrowLeft') {
    event.preventDefault()
    goMailDetailPrev()
    return true
  }

  if (key === 'ArrowRight') {
    event.preventDefault()
    goMailDetailNext()
    return true
  }

  if (key.toLowerCase() === 'd') {
    event.preventDefault()
    void deleteMailDetail()
    return true
  }

  return false
}

const handleKeyboardShortcut = (event: KeyboardEvent) => {
  if (handleMailListKeyboardShortcut(event)) {
    return
  }

  if (handleMailDetailKeyboardShortcut(event)) {
    return
  }

  if (!event.metaKey || event.ctrlKey || event.altKey) {
    return
  }

  const key = event.key

  if (key === '1') {
    event.preventDefault()
    void focusHomeTerminal()
    return
  }

  if (key === '2') {
    event.preventDefault()
    openDocsMenu()
    return
  }

  if (key === '3') {
    event.preventDefault()
    setActiveView('schedule')
    return
  }

  if (key === '4') {
    event.preventDefault()
    setActiveView('mail')
    return
  }

  if (key === '5') {
    event.preventDefault()
    setActiveView('board')
    return
  }

  if (key === '6') {
    event.preventDefault()
    setActiveView('member')
    return
  }

  if (key === '7') {
    event.preventDefault()
    setActiveView('swagger')
    return
  }

  if (key === '8') {
    event.preventDefault()
    setActiveView('api')
    return
  }

  if (key === 'ArrowLeft') {
    event.preventDefault()
    sidebarCollapsed.value = true
    return
  }

  if (key === 'ArrowRight') {
    event.preventDefault()
    sidebarCollapsed.value = false
    return
  }

  if (!selectedMdPath.value) {
    return
  }

  const lowerKey = key.toLowerCase()

  if (lowerKey === 'e') {
    event.preventDefault()
    activeView.value = 'docs'
    setMdViewMode('edit')
    return
  }

  if (lowerKey === 's') {
    event.preventDefault()
    activeView.value = 'docs'
    void saveMdFile()
    return
  }

  if (lowerKey === 'v') {
    event.preventDefault()
    activeView.value = 'docs'
    setMdViewMode('review')
  }
}

const copyText = async (text: string) => {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.append(textarea)
  textarea.select()
  document.execCommand('copy')
  textarea.remove()
}

const handleMdContentClick = async (event: MouseEvent) => {
  const target = event.target

  if (!(target instanceof HTMLElement)) {
    return
  }

  const button = target.closest<HTMLButtonElement>('.copy-code-button')

  if (!button) {
    return
  }

  const code = button.parentElement?.querySelector('pre code')
  const text = code?.textContent

  if (!text) {
    return
  }

  await copyText(text)
  button.textContent = '복사됨'

  window.setTimeout(() => {
    button.textContent = '복사'
  }, 1200)
}

onMounted(() => {
  handleCalendarCallbackParams()
  handleMailCallbackParams()
  void loadMdFiles()
  window.addEventListener('keydown', handleKeyboardShortcut)
  mdListTimer = window.setInterval(() => {
    void loadMdFiles()
  }, 60000)
})

onUnmounted(() => {
  if (mdListTimer !== undefined) {
    window.clearInterval(mdListTimer)
  }

  window.removeEventListener('keydown', handleKeyboardShortcut)
})
</script>

<template>
  <div class="app-shell" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
    <SidebarMenu
      :active-view="activeView"
      :collapsed="sidebarCollapsed"
      :md-files="mdFiles"
      :md-files-by-date="mdFilesByDate"
      :open-md-date="openMdDate"
      :selected-md-path="selectedMdPath"
      :is-md-loading="isMdLoading"
      :md-error-message="mdErrorMessage"
      @set-active-view="setActiveView"
      @toggle-collapsed="toggleSidebarCollapsed"
      @refresh-md-files="loadMdFiles"
      @open-date-group="openDateGroup"
      @select-md-file="selectMdFile"
    />

    <main class="workspace">
      <TerminalView
        v-show="activeView === 'home'"
        ref="terminalViewRef"
        :api-base-url="API_BASE_URL"
        :active="activeView === 'home'"
        @action="handleTerminalAction"
      />

      <BoardView
        v-if="activeView === 'board'"
        :posts="boardPosts"
        :title="boardFormTitle"
        :text="boardFormText"
        :editing-board-id="editingBoardId"
        :reply-parent-id="boardReplyParentId"
        :error-message="boardErrorMessage"
        :save-message="boardSaveMessage"
        :is-loading="isBoardLoading"
        :is-saving="isBoardSaving"
        @refresh="loadBoardPosts"
        @save="saveBoardPost"
        @reset="resetBoardForm"
        @start-reply="startBoardReply"
        @cancel-reply="cancelBoardReply"
        @edit="editBoardPost"
        @delete="deleteBoardPost"
        @update-title="boardFormTitle = $event"
        @update-text="boardFormText = $event"
      />

      <MemberView v-if="activeView === 'member'" />

      <ScheduleView
        v-if="activeView === 'schedule'"
        :connected="calendarConnected"
        :email="calendarEmail"
        :events="calendarEvents"
        :error-message="calendarErrorMessage"
        :save-message="calendarSaveMessage"
        :is-loading="isCalendarLoading"
        :is-connecting="isCalendarConnecting"
        :is-disconnecting="isCalendarDisconnecting"
        @refresh="loadCalendarData"
        @connect="connectGoogleCalendar"
        @disconnect="disconnectGoogleCalendar"
      />

      <MailView
        v-if="activeView === 'mail' && mailViewMode === 'list'"
        :connected="mailConnected"
        :email="mailEmail"
        :messages="mailMessages"
        :unread-only="mailUnreadOnly"
        :page-index="mailPageIndex"
        :page-size="mailPageSize"
        :total-count="mailTotalCount"
        :unread-count="mailUnreadCount"
        :inbox-total-count="mailInboxTotalCount"
        :has-next="mailHasNext"
        :error-message="mailErrorMessage"
        :save-message="mailSaveMessage"
        :is-loading="isMailLoading"
        :is-connecting="isMailConnecting"
        :is-disconnecting="isMailDisconnecting"
        @refresh="refreshMailData"
        @connect="connectGmail"
        @disconnect="disconnectGmail"
        @set-unread-only="setMailUnreadOnly"
        @prev-page="goMailPrevPage"
        @next-page="goMailNextPage"
        @select-message="openMailDetail"
      />

      <MailDetailView
        v-if="activeView === 'mail' && mailViewMode === 'detail'"
        :detail="mailDetail"
        :messages="mailMessages"
        :selected-index="selectedMailIndex"
        :error-message="mailErrorMessage"
        :save-message="mailSaveMessage"
        :is-loading="isMailDetailLoading"
        :is-deleting="isMailDeleting"
        @back="closeMailDetail"
        @prev="goMailDetailPrev"
        @next="goMailDetailNext"
        @delete-mail="deleteMailDetail"
      />

      <SwaggerView v-if="activeView === 'swagger'" :swagger-url="SWAGGER_UI_URL" />

      <ApiTestView
        v-if="activeView === 'api'"
        :endpoint="apiEndpoint"
        :input="apiInput"
        :result="apiResult"
        :error-message="errorMessage"
        @update-endpoint="apiEndpoint = $event"
        @update-input="apiInput = $event"
        @call-api="callApi"
      />

      <DocsView
        v-if="activeView === 'docs'"
        :selected-md-file="selectedMdFile"
        :md-view-mode="mdViewMode"
        :md-error-message="mdErrorMessage"
        :md-save-message="mdSaveMessage"
        :is-md-content-loading="isMdContentLoading"
        :is-md-saving="isMdSaving"
        :edited-md-content="editedMdContent"
        :rendered-md-content="renderedMdContent"
        @set-md-view-mode="setMdViewMode"
        @save-md-file="saveMdFile"
        @update-edited-md-content="editedMdContent = $event"
        @md-content-click="handleMdContentClick"
      />
    </main>
  </div>
</template>
