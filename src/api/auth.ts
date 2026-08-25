import type { ApiResponse } from '.'
import { api } from '.'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VerifyIdentityRequest {
  /** 포트원 본인인증 요청 시 발급된 인증 키 */
  identityVerificationId: string
}

export interface VerifyIdentityResult {
  /** 포트원 본인인증 자체의 성공 여부. false면 인증 실패(상태 비정상 또는 조회 실패)이며,
   *  이때는 다른 필드를 내려주지 않는다 */
  isVerified: boolean
  /** 이미 가입된 CI인지 여부. isVerified가 true일 때만 내려온다 */
  hasExistingAccount?: boolean
  /** 이미 가입된 계정이 있을 때, 마스킹 처리된 기존 계정 이메일 (예: 'fu******@gmail.com').
   *  신규 사용자면 내려오지 않는다 */
  existingEmail?: string
  /** 신규 사용자일 때, 마스킹 처리된 본인인증 이름 (예: '홍길*'). 이미 가입된 계정이 있으면 내려오지 않는다 */
  maskedName?: string
  /** 신규 사용자일 때, 마스킹 처리된 생년월일 (예: '2012-**-**', 연도만 노출).
   *  이미 가입된 계정이 있으면 내려오지 않는다 */
  maskedBirth?: string
  /** 신규 사용자일 때, 마스킹 처리된 휴대폰번호 (예: '010-**-5678'). 이미 가입된 계정이 있으면 내려오지 않는다 */
  maskedMobile?: string
  /** 신규 사용자일 때, 본인인증으로 확인된 성별. 이미 가입된 계정이 있으면 내려오지 않는다 */
  gender?: 'M' | 'F'
}

// ─── API ─────────────────────────────────────────────────────────────────────

/**
 * 본인인증 확인 — 포트원 본인인증 키(identityVerificationId)로 실제 인증 결과를 조회한다.
 * isVerified는 포트원 인증 자체의 성공 여부만 나타내며, 인증에 성공하면 hasExistingAccount로
 * CI 중복 여부를 함께 응답한다. 이미 가입된 CI면 마스킹된 기존 계정 이메일(existingEmail)을,
 * 신규 사용자면 마스킹된 이름/생년월일/휴대폰번호(maskedName/maskedBirth/maskedMobile)와
 * 성별(gender)을 함께 응답한다.
 * 회원가입 진행 중(로그인 전)에도 호출되므로 인증 불필요(skipAuth).
 */
export const verifyIdentity = (
  body: VerifyIdentityRequest
): Promise<ApiResponse<VerifyIdentityResult>> =>
  api.post<VerifyIdentityResult>('/v1/user/identity/verify', body, { skipAuth: true })

export interface SendRegisterEmailCodeRequest {
  /** 인증코드를 받을 이메일 주소 */
  email: string
}

export interface SendRegisterEmailCodeData {
  /** 인증코드 발송 성공 여부 */
  success: boolean
}

/**
 * 회원가입 5단계(이메일 인증) — 입력한 그룹 이메일로 6자리 인증번호 발송을 요청한다.
 * 같은 이메일로 하루 5회를 초과해 요청하면 실패한다. 회원가입 진행 중(로그인 전)에도
 * 호출되므로 인증 불필요(skipAuth).
 */
export const sendRegisterEmailCode = (
  body: SendRegisterEmailCodeRequest
): Promise<ApiResponse<SendRegisterEmailCodeData>> =>
  api.post<SendRegisterEmailCodeData>('/v1/user/email/sendCode', body, { skipAuth: true })

export interface VerifyRegisterEmailCodeRequest {
  /** 인증코드를 받은 이메일 주소 */
  email: string
  /** 이메일로 받은 6자리 인증코드 */
  code: string
}

export interface VerifyRegisterEmailCodeData {
  /** 인증 성공 여부. 실패 시에는 에러로 응답하므로 항상 true */
  success: boolean
}

/**
 * 회원가입 5단계(이메일 인증) — 발송된 인증번호가 입력한 이메일과 일치하는지 확인한다.
 * 같은 이메일로 24시간 안에 5회 틀리면 24시간 동안 이메일 인증이 제한된다.
 * 회원가입 진행 중(로그인 전)에도 호출되므로 인증 불필요(skipAuth).
 */
export const verifyRegisterEmailCode = (
  body: VerifyRegisterEmailCodeRequest
): Promise<ApiResponse<VerifyRegisterEmailCodeData>> =>
  api.post<VerifyRegisterEmailCodeData>('/v1/user/email/verifyCode', body, { skipAuth: true })
