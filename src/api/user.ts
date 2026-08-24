import type { ApiResponse } from '.'
import { api } from '.'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string
  password: string
  cfTurnstileResponse: string
}

export interface LoginData {
  type: 'T' | 'O'
  token?: string
}

export interface EmailVerificationLoginRequest {
  email: string
  code: string
  /** true면 이 브라우저를 신뢰 기기로 등록 — 백엔드가 device-trust 쿠키를 발급하는 기준 */
  rememberDevice: boolean
  /** rememberDevice가 true일 때 신뢰를 유지할 기간(일). device-trust 쿠키의 Max-Age 산정 기준 */
  trustDurationDays: number
}

export interface EmailVerificationLoginData {
  token: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

// ─── API ─────────────────────────────────────────────────────────────────────

/**
 * 로그인 — 인증 불필요(skipAuth), body에 Turnstile 토큰(cfTurnstileResponse) 포함.
 * 신규 기기 여부(응답 `type: 'O'`)는 백엔드가 device-trust 쿠키(브라우저가 요청에 자동 첨부)로
 * 판단한다 — 프론트는 별도로 기기 식별값을 계산해 보내지 않는다.
 */
export const login = (body: LoginRequest): Promise<ApiResponse<LoginData>> =>
  api.post<LoginData>('/user/login', body, { skipAuth: true })

/**
 * 이메일 인증번호 로그인 — 인증 불필요(skipAuth). `rememberDevice`가 true면 백엔드가
 * `trustDurationDays` 기간만큼 유효한 device-trust 쿠키를 발급한다.
 */
export const loginWithEmailVerificationCode = (
  body: EmailVerificationLoginRequest
): Promise<ApiResponse<EmailVerificationLoginData>> =>
  api.post<EmailVerificationLoginData>('/user/email-verification-login', body, {
    skipAuth: true,
  })

/** 회원탈퇴 */
export const withdraw = (): Promise<ApiResponse<boolean>> => api.delete('/auth/withdraw')

/** 비밀번호 변경 */
export const changePassword = (body: ChangePasswordRequest): Promise<ApiResponse<boolean>> =>
  api.patch('/auth/password', body)
