import type { ApiResponse } from '.'
import { api } from '.'

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

/** 회원가입 이메일 인증번호 발송 — 인증 불필요(skipAuth) */
// [TEMP] 26.08.13 백엔드 미연동 — 항상 성공 처리. 연동 완료 시 아래 stub을 실제 API 호출로 교체
// export const sendEmailVerificationCode = (
//   body: SendEmailVerificationCodeRequest,
// ): Promise<ApiResponse<boolean>> =>
//   api.post('/auth/signup/email-verification', body, { skipAuth: true })

// [TEMP] 26.08.13
export const sendEmailVerificationCode = (
  _body: SendEmailVerificationCodeRequest
): Promise<ApiResponse<boolean>> =>
  Promise.resolve({ result: true, statusCode: 200, data: true, message: [] })

/** 회원가입 이메일 인증번호 확인 — 인증 불필요(skipAuth) */
// [TEMP] 26.08.13 백엔드 미연동 — 항상 성공 처리. 연동 완료 시 아래 stub을 실제 API 호출로 교체
// export const verifyEmailVerificationCode = (
//   body: VerifyEmailVerificationCodeRequest,
// ): Promise<ApiResponse<boolean>> =>
//   api.post('/auth/signup/email-verification/confirm', body, { skipAuth: true })

// [TEMP] 26.08.13
export const verifyEmailVerificationCode = (
  _body: VerifyEmailVerificationCodeRequest
): Promise<ApiResponse<boolean>> =>
  Promise.resolve({ result: true, statusCode: 200, data: true, message: [] })
