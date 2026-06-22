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
    'cd',
    {
      description: '명령 모드 전환',
      detailLines: [
        'cd gc              구글캘린더 모드 (gc 생략 가능)',
        'cd bd              게시판 모드 (bd 생략 가능)',
        'cd md              일자별로그 모드 (md 생략 가능)',
        'cd l               (gc) 모드에서 gc l 생략 모드 → (gc l)',
        'cd g               (bd) 모드에서 bd g 생략 모드 → (bd g)',
        'cd /               초기 모드',
        'cd /gc             gc 모드 (하위에서 상위 복귀)',
        'cd /gc/l           gc l 모드',
        'cd /bd             게시판 모드',
        'cd /md             일자별로그 모드',
      ],
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
        'bd -?           게시판 도움말 (/? bd 와 동일)',
      ],
    },
  ],
  [
    'gc',
    {
      description: '구글캘린더',
      detailLines: [
        'gc                            오늘 일정',
        'gc l                          오늘 기준 1주일 일정',
        'gc l <YYYYMMDD>               특정일 일정',
        'gc l <YYYYMMDD>~<YYYYMMDD>    특정 기간 일정',
        'gc l --y <YYYY>               해당 연도 전체 (0101~1231)',
        'gc l --y <YYYY~YYYY>          연도 범위 전체',
        'gc l --y <YYYYMM>             해당 월 전체 (1일~말일)',
        'gc l --y <YYYYMM~YYYYMM>      월 범위 전체',
        'gc l -c <n>[,<n>]             이름 앞 번호(1., 2., ...) 기준 조회',
        'gc l -k "키워드"              제목·메모·캘린더·장소 키워드 검색',
        'gc l --y 2026 -k "PT"         연도·키워드 조합 조회',
        'gc c                          내 캘린더 목록 (이름 앞 번호)',
        'gc a "<내용>"                 오늘 종일 일정 추가',
        'gc a "<내용>" <YYYYMMDD>       특정일 종일 일정 추가',
        'gc a "<내용>" <날짜> <HHmm~HHmm>  시간 범위 일정 추가',
        'gc a "<내용>" <날짜> <HHmm+nh>    시작+길이 일정 추가',
        'gc a "<내용>" ... -c <n>      특정 캘린더에 추가',
        'gc m <캘린더-MMDD-순번> -t "<제목>"  일정 제목 수정 (예: 1-0618-2)',
        'gc m <캘린더-MMDD-순번> -d "<메모>"  일정 메모 수정',
        'gc m <캘린더-MMDD-순번> -c <n>       캘린더 이동',
        'gc r <캘린더-MMDD-순번>             일정 삭제',
        'gc -?                         구글캘린더 도움말 (/? gc 와 동일)',
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
        'md -?           일자별로그 도움말 (/? md 와 동일)',
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

/** `<키워드> -?` — /? <키워드> 와 동일 (예: gc -? === /? gc) */
export const parseContextHelpCommand = (
  input: string,
): { keyword: string } | { error: string } | null => {
  const match = input.trim().match(/^(\S+)\s+-\?$/)

  if (!match?.[1]) {
    return null
  }

  const keyword = match[1].toLowerCase()

  if (!TERMINAL_HELP.has(keyword)) {
    return { error: `도움말을 찾을 수 없습니다 : ${keyword}` }
  }

  return { keyword }
}

export const isHelpCommand = (input: string) => input.trim().startsWith('/?')
