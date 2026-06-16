export const formatDateTime = (value: string | null) =>
  value ? new Date(value).toLocaleString('ko-KR') : '-'

export const matchLike = (text: string, pattern: string) => {
  const trimmed = pattern.trim()

  if (!trimmed || trimmed === '*') {
    return true
  }

  const parts = trimmed.split('*').filter(Boolean)

  if (parts.length === 0) {
    return true
  }

  let position = 0

  for (const part of parts) {
    const index = text.indexOf(part, position)

    if (index === -1) {
      return false
    }

    position = index + part.length
  }

  return true
}

export const extractKeyword = (rest: string) => {
  const trimmed = rest.trim()

  if (!trimmed) {
    return ''
  }

  return trimmed.replace(/^["']|["']$/g, '')
}
