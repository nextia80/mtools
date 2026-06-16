import type { MdFile, TerminalLineDraft } from '../../types'
import { fetchJson } from '../apiClient'
import { extractKeyword, matchLike } from '../textUtils'
import type { TerminalCommandResult } from '../types'

const MD_USAGE = '사용법: md ld [*키워드*] | md l [*키워드*] | md g <파일키워드>'

const getMdFileKey = (file: MdFile) => {
  const dateMatch = file.path.match(/^(\d{4})-(\d{2})-(\d{2})\//)
  const timeMatch = file.name.match(/^\d{4}-\d{2}-\d{2}_(\d{2})-(\d{2})_/)

  if (!dateMatch || !timeMatch) {
    return file.path.replace(/\.md$/, '')
  }

  return `${dateMatch[1]}${dateMatch[2]}${dateMatch[3]}_${timeMatch[1]}${timeMatch[2]}`
}

const getMdFolderDate = (file: MdFile) => file.path.split('/')[0] ?? ''

const mdFileLine = (file: MdFile): TerminalLineDraft => {
  const fileKey = getMdFileKey(file)

  return {
    type: 'output',
    text: `${fileKey}  ${file.path}`,
    clickValue: fileKey,
  }
}

const loadAllMdFiles = async (apiBaseUrl: string) =>
  fetchJson<MdFile[]>(`${apiBaseUrl}/api/md-files`)

export const executeMdCommand = async (
  trimmed: string,
  apiBaseUrl: string,
): Promise<TerminalCommandResult> => {
  const rest = trimmed.replace(/^md\s+/i, '').trim()

  if (!rest) {
    return { lines: [{ type: 'error', text: MD_USAGE }] }
  }

  const files = await loadAllMdFiles(apiBaseUrl)

  const ldMatch = rest.match(/^ld(?:\s+(.+))?$/i)

  if (ldMatch) {
    const keyword = extractKeyword(ldMatch[1] ?? '')
    const folders = [...new Set(files.map(getMdFolderDate).filter(Boolean))]
      .filter((folder) => matchLike(folder, keyword))
      .sort((folderA, folderB) => folderB.localeCompare(folderA))

    if (folders.length === 0) {
      return { lines: [{ type: 'output', text: '일치하는 폴더가 없습니다.' }] }
    }

    return {
      lines: folders.map((folder) => ({ type: 'output' as const, text: folder })),
    }
  }

  const listMatch = rest.match(/^l(?:\s+(.+))?$/i)

  if (listMatch) {
    const keyword = extractKeyword(listMatch[1] ?? '')
    const matched = files.filter((file) => {
      const fileKey = getMdFileKey(file)
      const searchTarget = `${fileKey} ${file.path} ${file.name}`

      return matchLike(searchTarget, keyword)
    })

    if (matched.length === 0) {
      return { lines: [{ type: 'output', text: '일치하는 MD 파일이 없습니다.' }] }
    }

    return {
      lines: matched.map(mdFileLine),
    }
  }

  const getMatch = rest.match(/^g\s+(.+)$/i)

  if (getMatch?.[1]) {
    const keyword = extractKeyword(getMatch[1])
    const matched = files.filter((file) => {
      const fileKey = getMdFileKey(file)
      const searchTarget = `${fileKey} ${file.path} ${file.name}`

      return matchLike(searchTarget, keyword)
    })

    if (matched.length === 0) {
      return { lines: [{ type: 'error', text: `파일을 찾을 수 없습니다: ${keyword}` }] }
    }

    if (matched.length > 1) {
      return {
        lines: [
          { type: 'output', text: `${matched.length}건이 일치합니다. 더 구체적인 키워드를 입력하세요.` },
          ...matched.map(mdFileLine),
        ],
      }
    }

    const file = matched[0]!

    return {
      lines: [{ type: 'output', text: `일자별 LOG 페이지로 이동: ${file.path}` }],
      action: { type: 'open-md', path: file.path },
    }
  }

  return { lines: [{ type: 'error', text: MD_USAGE }] }
}
