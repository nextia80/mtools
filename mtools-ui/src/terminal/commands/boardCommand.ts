import type { BoardPost, TerminalLineDraft } from '../../types'
import { fetchJson, requestJson } from '../apiClient'
import { formatDateTime } from '../textUtils'
import type { TerminalCommandResult } from '../types'

const DEFAULT_BOARD_LIST_LIMIT = 20

const BD_USAGE =
  '사용법: bd l | bd l <n> | bd lb <n>~<m> | bd g <id> | bd a | bd m <id> | bd d <id>'

const getBoardDepth = (post: BoardPost) => {
  const hashCount = post.stOrder.match(/#/g)?.length ?? 0

  return Math.max(hashCount - 1, 0)
}

const formatBoardTitleList = (posts: BoardPost[], from = 1, to?: number): TerminalLineDraft[] => {
  const end = to ?? posts.length
  const sliced = posts.slice(from - 1, end)

  if (sliced.length === 0) {
    return [{ type: 'output', text: '게시글이 없습니다.' }]
  }

  return sliced.map((post) => {
    const indent = '  '.repeat(getBoardDepth(post))

    return {
      type: 'output' as const,
      text: `${indent}[${post.idBoard}] ${post.title || '제목 없음'}`,
      clickValue: post.idBoard,
    }
  })
}

const formatBoardDetail = (post: BoardPost): TerminalLineDraft[] => [
  { type: 'output', text: `[${post.idBoard}] ${post.title || '제목 없음'}` },
  { type: 'output', text: post.text || '내용 없음' },
  {
    type: 'output',
    text: `${post.updatedAt ? '수정' : '생성'}: ${formatDateTime(post.updatedAt || post.insertedAt)}`,
  },
]

const loadAllBoards = async (apiBaseUrl: string) =>
  fetchJson<BoardPost[]>(`${apiBaseUrl}/api/boards`)

const findBoardPost = async (apiBaseUrl: string, id: string) => {
  const posts = await loadAllBoards(apiBaseUrl)
  return posts.find((item) => item.idBoard === id) ?? null
}

export const executeBdCommand = async (
  trimmed: string,
  apiBaseUrl: string,
): Promise<TerminalCommandResult> => {
  const rest = trimmed.replace(/^bd\s+/i, '').trim()

  if (!rest) {
    return { lines: [{ type: 'error', text: BD_USAGE }] }
  }

  const listMatch = rest.match(/^l(?:\s+(\d+))?$/i)

  if (listMatch) {
    const limit = listMatch[1] ? Number(listMatch[1]) : DEFAULT_BOARD_LIST_LIMIT

    if (!Number.isInteger(limit) || limit <= 0) {
      return { lines: [{ type: 'error', text: 'list 개수는 1 이상의 정수여야 합니다.' }] }
    }

    const posts = await loadAllBoards(apiBaseUrl)

    return { lines: formatBoardTitleList(posts, 1, limit) }
  }

  const rangeMatch = rest.match(/^lb\s+(\d+)\s*[~\-]\s*(\d+)$/i)

  if (rangeMatch?.[1] && rangeMatch[2]) {
    const from = Number(rangeMatch[1])
    const to = Number(rangeMatch[2])

    if (!Number.isInteger(from) || !Number.isInteger(to) || from <= 0 || to < from) {
      return { lines: [{ type: 'error', text: '범위는 1 이상이며 시작 번호 ≤ 끝 번호여야 합니다.' }] }
    }

    const posts = await loadAllBoards(apiBaseUrl)

    return { lines: formatBoardTitleList(posts, from, to) }
  }

  const getMatch = rest.match(/^g\s+(\d+)$/i)

  if (getMatch?.[1]) {
    const post = await findBoardPost(apiBaseUrl, getMatch[1])

    if (!post) {
      return { lines: [{ type: 'error', text: `게시글 ${getMatch[1]}번을 찾을 수 없습니다.` }] }
    }

    return { lines: formatBoardDetail(post) }
  }

  if (/^a$/i.test(rest)) {
    return {
      lines: [{ type: 'output', text: '게시글 등록 팝업은 추후 구현 예정입니다.' }],
      action: { type: 'board-add' },
    }
  }

  const modMatch = rest.match(/^m\s+(\d+)$/i)

  if (modMatch?.[1]) {
    const post = await findBoardPost(apiBaseUrl, modMatch[1])

    if (!post) {
      return { lines: [{ type: 'error', text: `게시글 ${modMatch[1]}번을 찾을 수 없습니다.` }] }
    }

    return {
      lines: [{ type: 'output', text: `게시글 ${modMatch[1]}번 수정 팝업은 추후 구현 예정입니다.` }],
      action: { type: 'board-edit', id: modMatch[1] },
    }
  }

  const delMatch = rest.match(/^d\s+(\d+)$/i)

  if (delMatch?.[1]) {
    const post = await findBoardPost(apiBaseUrl, delMatch[1])

    if (!post) {
      return { lines: [{ type: 'error', text: `게시글 ${delMatch[1]}번을 찾을 수 없습니다.` }] }
    }

    await requestJson(`${apiBaseUrl}/api/boards/${delMatch[1]}`, 'DELETE')

    return { lines: [{ type: 'output', text: `게시글 ${delMatch[1]}번을 삭제했습니다.` }] }
  }

  return { lines: [{ type: 'error', text: BD_USAGE }] }
}
