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
