import type { BoardPost } from './types'

export const getBoardDepth = (post: BoardPost) => {
  const hashCount = post.stOrder.match(/#/g)?.length ?? 0

  return Math.max(hashCount - 1, 0)
}

export const isBoardRoot = (post: BoardPost) => post.idBoard === post.stPid
