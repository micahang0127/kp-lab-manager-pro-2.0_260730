import type { ApiResponse } from '.'
import { api } from '.'

// ─── Constants ────────────────────────────────────────────────────────────────

export const DEVICE_TYPE_WEB = 'WEB' as const

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SignupRequest {
  email: string
  password: string
  name: string
  phoneNumber: string
  agreeTerms: boolean
  agreePrivacy: boolean
  agreeMarketingEmail: boolean
  agreeMarketingSms: boolean
  // [NOTE] 사업자등록 정보 (사업자등록증 파일은 전송하지 않음)
  corporateName: string
  representativeName: string
  businessRegistrationNumber: string
  businessAddress: string
  businessType: string // 업태
  businessItem: string // 업종
}

export interface LoginRequest {
  email: string
  password: string
  deviceType: string
  cfTurnstileResponse: string
}

export interface LoginData {
  type: 'T' | 'O'
  token?: string
}

export interface OtpLoginRequest {
  email: string
  otpCode: string
  deviceType: string
}

export interface OtpLoginData {
  token: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export interface SendEmailVerificationCodeRequest {
  email: string
}

export interface VerifyEmailVerificationCodeRequest {
  email: string
  code: string
}

// ─── API ─────────────────────────────────────────────────────────────────────

/** 회원가입 (개인정보 + 사업자등록 정보 텍스트 필드. 사업자등록증 파일은 전송하지 않음) — 인증 불필요(skipAuth) */
export const signup = (body: SignupRequest): Promise<ApiResponse<boolean>> =>
  api.post('/auth/signup', body, { skipAuth: true })

/** 로그인 — 인증 불필요(skipAuth), KPMFP 헤더로 핑거프린트 전송, body에 Turnstile 토큰(cfTurnstileResponse) 포함 */
export const login = (
  body: LoginRequest,
  fingerprint: string | null
): Promise<ApiResponse<LoginData>> =>
  api.post<LoginData>('/user/login', body, {
    skipAuth: true,
    extraHeaders: fingerprint ? { KPMFP: fingerprint } : undefined,
  })

/** OTP 로그인 — 인증 불필요(skipAuth), KPMFP 헤더 선택적 전송 */
export const otpLogin = (
  body: OtpLoginRequest,
  fingerprint: string | null
): Promise<ApiResponse<OtpLoginData>> =>
  api.post<OtpLoginData>('/user/otplogin', body, {
    skipAuth: true,
    extraHeaders: fingerprint ? { KPMFP: fingerprint } : undefined,
  })

/** 회원탈퇴 */
export const withdraw = (): Promise<ApiResponse<boolean>> => api.delete('/auth/withdraw')

/** 비밀번호 변경 */
export const changePassword = (body: ChangePasswordRequest): Promise<ApiResponse<boolean>> =>
  api.patch('/auth/password', body)

/** 회원가입 이메일 인증번호 발송 — 인증 불필요(skipAuth) */
// [TEMP] 26.08.13 백엔드 미연동 — 항상 성공 처리. 연동 완료 시 아래 stub을 실제 API 호출로 교체
// export const sendEmailVerificationCode = (
//   body: SendEmailVerificationCodeRequest,
// ): Promise<ApiResponse<boolean>> =>
//   api.post('/auth/signup/email-verification', body, { skipAuth: true })

// [TEMP] 26.08.13
export const sendEmailVerificationCode = (
  _body: SendEmailVerificationCodeRequest
): Promise<ApiResponse<boolean>> => Promise.resolve({ statusCode: 200, data: true, error: [] })

/** 회원가입 이메일 인증번호 확인 — 인증 불필요(skipAuth) */
// [TEMP] 26.08.13 백엔드 미연동 — 항상 성공 처리. 연동 완료 시 아래 stub을 실제 API 호출로 교체
// export const verifyEmailVerificationCode = (
//   body: VerifyEmailVerificationCodeRequest,
// ): Promise<ApiResponse<boolean>> =>
//   api.post('/auth/signup/email-verification/confirm', body, { skipAuth: true })

// [TEMP] 26.08.13
export const verifyEmailVerificationCode = (
  _body: VerifyEmailVerificationCodeRequest
): Promise<ApiResponse<boolean>> => Promise.resolve({ statusCode: 200, data: true, error: [] })
