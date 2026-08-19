import type { ApiResponse } from '.'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ConfirmIdentityVerificationRequest {
  identityVerificationId: string
}

export interface VerifiedCustomer {
  ci: string
  di: string
  name: string
  gender: string
  birthDate: string
  phoneNumber: string
}

export interface IdentityVerificationResponse {
  identityVerificationId: string
  status: string
  verifiedCustomer: VerifiedCustomer
  verifiedAt: string
}

// ─── API ─────────────────────────────────────────────────────────────────────

/** 본인인증 완료 확인 — PortOne identityVerificationId를 백엔드로 전달 */
// [TEMP] 26.03.17 백엔드 미연동 — 항상 성공 처리. 연동 완료 시 아래 stub을 실제 API 호출로 교체
// export const confirmIdentityVerification = (
//   body: ConfirmIdentityVerificationRequest,
// ): Promise<ApiResponse<boolean>> =>
//   api.post('/auth/identity-verification', body)

// [TEMP] 26.03.17
const resultTemp: IdentityVerificationResponse = {
  identityVerificationId: 'identity-verification-123e4567-e89b-12d3-a456-426614174000',
  status: 'VERIFIED',
  verifiedCustomer: {
    ci: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxx', // 개인 고유 식별값 (CI)
    di: 'yyyyyyyyyyyyyyyyyyyyyyyyyyyy', // 중복가입 확인용 (DI)
    name: '홍길동',
    gender: 'M',
    birthDate: '1990-01-01',
    phoneNumber: '010-1234-5678',
  },
  verifiedAt: '2026-03-17T09:00:00.000Z',
}

export const confirmIdentityVerification = (
  _body: ConfirmIdentityVerificationRequest
): Promise<ApiResponse<IdentityVerificationResponse>> =>
  Promise.resolve({ result: true, statusCode: 200, data: resultTemp, message: [] })

// ─── 기존 계정 확인/삭제 ─────────────────────────────────────────────────────────

export interface CheckExistingAccountRequest {
  /** 본인인증으로 확인된 CI (개인 고유 식별값) */
  ci: string
}

export interface CheckExistingAccountData {
  exists: boolean
}

/** 본인인증(CI) 기준 기존 가입 계정 존재 여부 확인 — 회원가입 시 재가입 여부 판단에 사용 */
// [TEMP] 26.08.13 백엔드 미연동 — 항상 존재하지 않음(false) 처리. 연동 완료 시 아래 stub을 실제 API 호출로 교체
// export const checkExistingAccount = (
//   body: CheckExistingAccountRequest,
// ): Promise<ApiResponse<CheckExistingAccountData>> =>
//   api.post<CheckExistingAccountData>('/auth/identity-verification/existing-account', body, {
//     skipAuth: true,
//   })

// [TEMP] 26.08.13
export const checkExistingAccount = (
  _body: CheckExistingAccountRequest
): Promise<ApiResponse<CheckExistingAccountData>> =>
  Promise.resolve({ result: true, statusCode: 200, data: { exists: false }, message: [] })

/** 본인인증(CI) 기준 기존 가입 계정 삭제 — 재가입 진행 confirm 이후 호출 */
// [TEMP] 26.08.13 백엔드 미연동 — 항상 성공 처리. 연동 완료 시 아래 stub을 실제 API 호출로 교체
// export const deleteExistingAccount = (
//   body: CheckExistingAccountRequest,
// ): Promise<ApiResponse<boolean>> =>
//   api.post<boolean>('/auth/identity-verification/existing-account/delete', body, {
//     skipAuth: true,
//   })

// [TEMP] 26.08.13
export const deleteExistingAccount = (
  _body: CheckExistingAccountRequest
): Promise<ApiResponse<boolean>> =>
  Promise.resolve({ result: true, statusCode: 200, data: true, message: [] })
