import { useAuthStore } from '../stores/authStore'

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
 * - 순수 문자열: CommonResponsePayload 포맷을 거치지 않은 원본 예외(Nest 기본 예외 필터가 그대로
 *   내려주는 5xx 등, 예: `{ statusCode, error, message: "..." }`)의 message
 */
export type ApiErrorMessage = string[] | Record<string, string[]> | string

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
  /** ValidationPipe(DTO) 검증 실패로 message가 `{ 필드명: [메시지] }` 객체 형태일 때만 채워진다.
   *  extractErrorMessage()가 첫 메시지만 꺼내며 버리는 필드명 정보를 보존하기 위한 필드 —
   *  `src/utils/apiError.ts`의 getFieldErrors()로 꺼내 쓴다. */
  fieldErrors?: Record<string, string[]>

  constructor(message: string, statusCode: number, fieldErrors?: Record<string, string[]>) {
    super(message)
    this.statusCode = statusCode
    this.fieldErrors = fieldErrors
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
 * 순수 문자열이면 그대로, 문자열 배열이면 첫 원소를, `{ 필드명: [메시지] }` 객체(DTO 검증 실패)면
 * 첫 번째 필드의 첫 메시지를 반환한다 — 순수 문자열 케이스를 배열/객체와 같이 처리하면
 * `Object.values(문자열)`이 문자 단위로 쪼개져 첫 글자만 남는 버그가 생기므로 반드시 먼저
 * 분기해야 한다. null이거나 빈 값이면 undefined를 반환해 호출 측이 기본 문구로 대체하게 한다.
 */
function extractErrorMessage(message: ApiErrorMessage | null): string | undefined {
  if (!message) return undefined
  if (typeof message === 'string') return message
  if (Array.isArray(message)) return message[0]
  return Object.values(message)[0]?.[0]
}

/**
 * ApiErrorMessage → ApiError 변환을 한 곳에서 처리한다. 메시지 추출(extractErrorMessage)과
 * fieldErrors 보존(message가 `{ 필드명: [메시지] }` 객체 형태일 때만)을 함께 수행해, 401 분기와
 * 일반 실패 분기가 각자 따로 fieldErrors를 추출하지 않도록 한다.
 */
function toApiError(
  message: ApiErrorMessage | null,
  statusCode: number,
  fallback: string
): ApiError {
  const errorMessage = extractErrorMessage(message) || fallback
  const fieldErrors =
    message && typeof message === 'object' && !Array.isArray(message) ? message : undefined
  return new ApiError(errorMessage, statusCode, fieldErrors)
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

    // 401 Unauthorized: sessionStorage에 실제로 토큰이 있었던 요청에서만 자동 로그아웃 + /login
    // 리다이렉트. skipAuth 여부가 아니라 토큰 존재 여부로 판단해야 한다 — 로그인 전(토큰 없음)에도
    // 메시지에 "만료"가 포함된 401이 올 수 있으므로(예: 로그인 2차 인증의 "인증코드가
    // 만료되었습니다"), 이 경우는 세션 만료가 아니라 로그인 실패 같은 도메인 로직 에러다 —
    // 컴포넌트가 ServerErrorBanner 등으로 인라인 표시해야 하므로 여기서 가로채지 않는다.
    if (res.status === 401) {
      const error = toApiError(json.message, 401, '인증이 필요합니다.')

      if (token) {
        useAuthStore.getState().logout()
        if (typeof window !== 'undefined') {
          window.location.replace('/login')
        }
      }

      throw error
    }

    // result가 요청 성공 여부의 단일 기준 (statusCode는 부가 정보)
    if (json.result) {
      return json
    }

    // 에러 발생 시 에러 객체를 던짐 — 5xx를 포함해 별도의 전역 처리 없이 각 컴포넌트가
    // ApiError.message를 그대로 인라인으로 노출한다.
    const error = toApiError(json.message, json.statusCode, '알 수 없는 오류가 발생했습니다.')

    throw error
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
