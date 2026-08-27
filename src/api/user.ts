import type { TurnstileServerValidationErrorCode } from '@marsidev/react-turnstile'

import type { ApiResponse } from '.'
import { api } from '.'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string
  password: string
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

export interface VerifyTurnstileRequest {
  /** Turnstile 위젯이 발급한 응답 토큰 (cf-turnstile-response) */
  token: string
}

export interface VerifyTurnstileResult {
  /** Cloudflare 서버 검증 성공 여부. 토큰 만료(발급 후 300초 경과) 또는 재사용(일회용) 시 false */
  isVerified: boolean
  /** isVerified가 false일 때 원인 코드 목록. Cloudflare siteverify 표준 에러 코드
   *  (@marsidev/react-turnstile의 TurnstileServerValidationErrorCode 참고) */
  errorCodes?: TurnstileServerValidationErrorCode[]
}

// ─── API ─────────────────────────────────────────────────────────────────────

/**
 * 로그인 — 인증 불필요(skipAuth). Turnstile 검증은 `verifyTurnstile`로 로그인 전에 별도 처리하므로
 * body에는 이메일/비밀번호만 포함한다. 신규 기기 여부(응답 `type: 'O'`)는 백엔드가 device-trust
 * 쿠키(브라우저가 요청에 자동 첨부)로 판단한다 — 프론트는 별도로 기기 식별값을 계산해 보내지 않는다.
 */
export const login = (body: LoginRequest): Promise<ApiResponse<LoginData>> =>
  api.post<LoginData>('/user/login', body, { skipAuth: true })

/**
 * Turnstile 토큰 검증 — 클라이언트가 위젯에서 발급받은 토큰(cf-turnstile-response)을 서버가
 * Cloudflare에 검증한다. 로그인 전에 호출하므로 인증 불필요(skipAuth). 토큰은 일회용이며 발급 후
 * 300초가 지나면 만료되고, 만료/재사용 시 isVerified가 false로 내려온다. Cloudflare와 통신 자체가
 * 실패하면 502 에러가 발생한다 (공통 api 클라이언트가 ApiError로 throw).
 */
export const verifyTurnstile = (
  body: VerifyTurnstileRequest
): Promise<ApiResponse<VerifyTurnstileResult>> =>
  api.post<VerifyTurnstileResult>('/v1/user/turnstile/verify', body, { skipAuth: true })

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
