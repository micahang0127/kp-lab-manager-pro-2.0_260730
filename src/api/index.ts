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
 * 에러 메시지 형태 — 백엔드가 검증 단계에 따라 다르게 내려준다.
 * - 문자열 배열: 서비스 로직이 직접 던진 에러 (예: 발송 횟수 초과, 필수값 조합 검증)
 * - `{ 필드명: [메시지] }` 객체: ValidationPipe(DTO) 검증 실패 — 필드별 메시지 목록
 */
export type ApiErrorMessage = string[] | Record<string, string[]>

/**
 * 모든 API 응답이 공통으로 따르는 표준 응답 형태 (백엔드 CommonResponsePayload와 동일)
 */
export interface ApiResponse<T> {
  /** 요청 성공 여부 */
  result: boolean
  /** 성공 시 응답 데이터, 실패 시 null */
  data: T | null
  /** 에러 메시지. 성공 시 null이며, 실패 시 ApiErrorMessage 형태(문자열 배열 또는 필드별 객체) */
  message: ApiErrorMessage | null
  /** HTTP 상태 코드 */
  statusCode: number
}

export interface RequestOptions {
  extraHeaders?: Record<string, string> // 커스텀 헤더
  skipAuth?: boolean // true면 Authorization 헤더 미포함
  /** 이 요청에만 적용할 타임아웃(ms). 생략 시 기본 REQUEST_TIMEOUT(10초) 사용 */
  timeoutMs?: number
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

// ─── Error message 추출 ─────────────────────────────────────────────────────────

/**
 * 에러 응답의 message에서 사용자에게 보여줄 첫 번째 메시지를 꺼낸다.
 * 문자열 배열이면 첫 원소를, `{ 필드명: [메시지] }` 객체(DTO 검증 실패)면 첫 번째 필드의
 * 첫 메시지를 반환한다. null이거나 빈 값이면 undefined를 반환해 호출 측이 기본 문구로 대체하게 한다.
 */
function extractErrorMessage(message: ApiErrorMessage | null): string | undefined {
  if (!message) return undefined
  if (Array.isArray(message)) return message[0]
  return Object.values(message)[0]?.[0]
}

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
  const timeoutId = setTimeout(() => controller.abort(), options?.timeoutMs ?? REQUEST_TIMEOUT)

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
      const errorMessage = extractErrorMessage(json.message) || '인증이 필요합니다.'

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
    const errorMessage = extractErrorMessage(json.message) || '알 수 없는 오류가 발생했습니다.'
    throw new ApiError(errorMessage, json.statusCode)
  } catch (err) {
    // ApiError는 백엔드가 사용자에게 보여줄 목적으로 준 메시지이므로 그대로 전달한다.
    if (err instanceof ApiError) {
      throw err
    }

    // 그 외(JSON 파싱 실패, 네트워크 단절, 타임아웃 등)는 브라우저/런타임이 던진
    // 원본 에러라서 사용자가 이해할 수 없다 — 콘솔에만 남기고 공통 문구로 대체한다.
    console.error('[API] 요청 처리 중 오류:', err)

    // DOMException instanceof 체크는 jsdom 등 실행 환경에 따라 실제 fetch가 던지는 DOMException과
    // 다른 realm의 클래스를 참조해 매칭에 실패할 수 있어, 더 안전한 name 기반 판별을 사용한다
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.')
    }

    throw new Error('일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
  } finally {
    clearTimeout(timeoutId)
  }
}

// ─── API client ───────────────────────────────────────────────────────────────

export const api = {
  get: <T = PagedData>(endpoint: string, options?: RequestOptions) =>
    request<T>('GET', endpoint, undefined, options),
  post: <T = boolean>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>('POST', endpoint, body, options),
  patch: (endpoint: string, body?: unknown) => request<boolean>('PATCH', endpoint, body),
  delete: (endpoint: string) => request<boolean>('DELETE', endpoint),
}
