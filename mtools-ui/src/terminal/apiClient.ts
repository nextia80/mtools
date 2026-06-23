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
    if (raw.includes('No static resource')) {
      message = 'API를 찾을 수 없습니다. mtools-api 서버를 재시작하세요.'
    } else if (status === 404) {
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

const FETCH_TIMEOUT_MS = 15000

const fetchWithTimeout = (url: string, init?: RequestInit) => {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  return fetch(url, { ...init, signal: controller.signal }).finally(() => {
    window.clearTimeout(timeoutId)
  })
}

const toFetchError = (error: unknown) => {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return new Error('요청 시간이 초과되었습니다. API 서버 상태를 확인하세요.')
  }

  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return new Error('API 서버에 연결할 수 없습니다. mtools-api(8080)가 실행 중인지 확인하세요.')
  }

  return error
}

export const fetchJson = async <T>(url: string): Promise<T> => {
  try {
    const response = await fetchWithTimeout(url)

    if (!response.ok) {
      const raw = await response.text()
      throw new Error(parseHttpError(raw, response.status))
    }

    return (await response.json()) as T
  } catch (error) {
    const mapped = toFetchError(error)

    if (mapped instanceof Error) {
      throw mapped
    }

    throw error
  }
}

export const requestJson = async <T>(url: string, method: string, body?: unknown): Promise<T> => {
  try {
    const response = await fetchWithTimeout(url, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })

    if (!response.ok) {
      const raw = await response.text()
      throw new Error(parseHttpError(raw, response.status))
    }

    return (await response.json()) as T
  } catch (error) {
    const mapped = toFetchError(error)

    if (mapped instanceof Error) {
      throw mapped
    }

    throw error
  }
}
