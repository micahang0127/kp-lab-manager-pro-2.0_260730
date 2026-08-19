const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''
const REQUEST_TIMEOUT = 10_000 // 10초

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PagedData {
  total: number
  page: number
  limit: number
  totalPages: number
}

/**
 * 모든 API 응답이 공통으로 따르는 표준 응답 형태 (백엔드 CommonResponsePayload와 동일)
 */
export interface ApiResponse<T> {
  /** 요청 성공 여부 */
  result: boolean
  /** 성공 시 응답 데이터, 실패 시 null */
  data: T | null
  /** 에러 메시지 목록. 성공 시 빈 배열 */
  message: string[]
  /** HTTP 상태 코드 */
  statusCode: number
}

export interface RequestOptions {
  extraHeaders?: Record<string, string> // 커스텀 헤더 (예: KPMFP)
  skipAuth?: boolean // true면 Authorization 헤더 미포함
}

// ─── Error Types ──────────────────────────────────────────────────────────────

export class ApiError extends Error {
  statusCode: number

  constructor(message: string, statusCode: number) {
    super(message)
    this.statusCode = statusCode
    Object.setPrototypeOf(this, ApiError.prototype)
  }
}

// ─── Security: HTTPS 강제 (프로덕션) ──────────────────────────────────────────

if (import.meta.env.PROD && BASE_URL && BASE_URL.startsWith('http://')) {
  console.warn('[Security Warning] API BASE_URL은 HTTPS를 사용해야 합니다.')
}

// ─── Token ───────────────────────────────────────────────────────────────────

const getToken = () => sessionStorage.getItem('accessToken')?.trim()

// ─── Base request ─────────────────────────────────────────────────────────────

async function request<T>(
  method: string,
  endpoint: string,
  body?: unknown,
  options?: RequestOptions
): Promise<ApiResponse<T>> {
  const token = getToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && !options?.skipAuth && { Authorization: `Bearer ${token}` }),
    ...options?.extraHeaders,
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers,
      signal: controller.signal,
      ...(body !== undefined && { body: JSON.stringify(body) }),
    })
    const json = (await res.json()) as ApiResponse<T>

    // 401 Unauthorized: 응답 메시지 사용, 만료된 경우만 자동 로그아웃
    if (res.status === 401) {
      const errorMessage = json.message?.[0] || '인증이 필요합니다.'

      // 토큰 만료로 인한 401인 경우에만 자동 로그아웃
      // (api 요청 중 토큰이 만료된 경우 = Silent Refresh 필요)
      if (errorMessage.includes('만료') || errorMessage.includes('expired')) {
        sessionStorage.removeItem('accessToken')
        if (typeof window !== 'undefined') {
          window.location.replace('/login')
        }
      }

      throw new ApiError(errorMessage, 401)
    }

    // result가 요청 성공 여부의 단일 기준 (statusCode는 부가 정보)
    if (json.result) {
      return json
    }

    // 에러 발생 시 에러 객체를 던짐
    const errorMessage = json.message?.[0] || '알 수 없는 오류가 발생했습니다.'
    throw new ApiError(errorMessage, json.statusCode)
  } catch (err) {
    // ApiError는 백엔드가 사용자에게 보여줄 목적으로 준 메시지이므로 그대로 전달한다.
    if (err instanceof ApiError) {
      throw err
    }

    // 그 외(JSON 파싱 실패, 네트워크 단절, 타임아웃 등)는 브라우저/런타임이 던진
    // 원본 에러라서 사용자가 이해할 수 없다 — 콘솔에만 남기고 공통 문구로 대체한다.
    console.error('[API] 요청 처리 중 오류:', err)

    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.')
    }

    throw new Error('일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
  } finally {
    clearTimeout(timeoutId)
  }
}

// ─── API client ───────────────────────────────────────────────────────────────

export const api = {
  get: <T = PagedData>(endpoint: string) => request<T>('GET', endpoint),
  post: <T = boolean>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>('POST', endpoint, body, options),
  patch: (endpoint: string, body?: unknown) => request<boolean>('PATCH', endpoint, body),
  delete: (endpoint: string) => request<boolean>('DELETE', endpoint),
}
