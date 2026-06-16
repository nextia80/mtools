import type { TerminalLineDraft } from '../types'

/** 명령어 하나의 도움말 항목 */
export type CommandHelpEntry = {
  /** /? 목록에 표시할 짧은 설명 */
  description: string
  /** /? <키워드> 시 출력할 상세 줄 (명령 구문 + 설명) */
  detailLines: readonly string[]
}

/**
 * 터미널 도움말 데이터.
 * 새 명령어 추가 시 이 Map에 항목만 추가하면 /? 와 /? <키워드> 가 자동 반영된다.
 */
export const TERMINAL_HELP = new Map<string, CommandHelpEntry>([
  [
    'cls',
    {
      description: '화면지우기',
      detailLines: ['cls             화면지우기'],
    },
  ],
  [
    'bd',
    {
      description: '게시판',
      detailLines: [
        'bd l            게시판 상위 20개 제목',
        'bd l <n>        게시판 상위 n개 제목',
        'bd lb <n>~<m>   상위 n~m번째 게시물 제목',
        'bd g <id>       게시물 전체정보',
        'bd a            게시물 등록',
        'bd m <id>       게시물 수정',
        'bd d <id>       게시물 삭제',
      ],
    },
  ],
  [
    'gc',
    {
      description: '구글캘린더',
      detailLines: [
        'gc              오늘일정',
        'gc l            구글 캘린더 1주일 일정',
        'gc l <YYYYMMDD> 해당 날짜 일정',
        'gc c            내 캘린더 목록',
        'gc lc <키>      캘린더 키 기준 1주일 일정',
        'gc lc <키> <YYYYMMDD> 캘린더 키 기준 해당 날짜 일정',
        'gc lcb <키> <YYYYMMDD> <YYYYMMDD> 캘린더 키 기준 날짜 범위 일정',
        'gc a <키> <일정>        오늘 종일 일정 추가',
        'gc ad <키> <YYYYMMDD> <일정> 해당 날짜 종일 일정 추가',
        'gc at <키> <YYYYMMDD> <HHmm> <일정> 해당 날짜·시간 일정 추가 (1시간)',
      ],
    },
  ],
  [
    'md',
    {
      description: '일자별로그',
      detailLines: [
        'md ld [*키워드*]    일자별 로그 폴더 목록 (* = LIKE 검색)',
        'md l [*키워드*]     MD 파일 검색 (파일키 + 경로)',
        'md g <파일키워드>   MD 파일 열기 (일자별 LOG 페이지)',
      ],
    },
  ],
])

const TOP_LEVEL_KEYWORD_WIDTH = 8

const toOutputLines = (texts: readonly string[]): TerminalLineDraft[] =>
  texts.map((text) => ({ type: 'output' as const, text }))

/** /? — 등록된 최상위 명령어 목록 */
export const formatTopLevelHelpLines = (): TerminalLineDraft[] =>
  toOutputLines(
    [...TERMINAL_HELP.entries()].map(
      ([keyword, help]) => `${keyword.padEnd(TOP_LEVEL_KEYWORD_WIDTH)}${help.description}`,
    ),
  )

/** /? <키워드> — 해당 명령어 상세 도움말 */
export const formatKeywordHelpLines = (keyword: string): TerminalLineDraft[] => {
  const help = TERMINAL_HELP.get(keyword.toLowerCase())

  if (!help) {
    return [{ type: 'error', text: `도움말을 찾을 수 없습니다 : ${keyword}` }]
  }

  return toOutputLines(help.detailLines)
}

/** /? 또는 /? <키워드> 입력 처리 */
export const executeHelpCommand = (input: string): TerminalLineDraft[] => {
  const keyword = input.slice(2).trim()

  if (!keyword) {
    return formatTopLevelHelpLines()
  }

  return formatKeywordHelpLines(keyword)
}

export const isHelpCommand = (input: string) => input.trim().startsWith('/?')
