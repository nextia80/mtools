const parseHttpError = (raw: string, status: number) => {
  let message = raw || `요청 실패: ${status}`

  try {
    const body = JSON.parse(raw) as { message?: string; error?: string }

    if (body.message && !body.message.includes('trace')) {
      message = body.message
    } else if (status === 404) {
      message = `API를 찾을 수 없습니다 (${status}). 백엔드 서버를 재시작했는지 확인하세요.`
    } else if (body.error) {
      message = body.error
    }
  } catch {
    if (status === 404) {
      message = `API를 찾을 수 없습니다 (${status}). 백엔드 서버를 재시작했는지 확인하세요.`
    }
  }

  if (
    message.includes('ACCESS_TOKEN_SCOPE_INSUFFICIENT')
    || message.includes('Insufficient Permission')
    || message.includes('일정 추가 권한이 없습니다')
  ) {
    return '일정 추가 권한이 없습니다. 일정관리 메뉴에서 Google Calendar 연결을 해제한 뒤 다시 연결하세요.'
  }

  return message
}

export const fetchJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url)

  if (!response.ok) {
    const raw = await response.text()
    throw new Error(parseHttpError(raw, response.status))
  }

  return (await response.json()) as T
}

export const requestJson = async <T>(url: string, method: string, body?: unknown): Promise<T> => {
  const response = await fetch(url, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (!response.ok) {
    const raw = await response.text()
    throw new Error(parseHttpError(raw, response.status))
  }

  return (await response.json()) as T
}
