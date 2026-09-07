import { create } from 'zustand'

import type { VerifyIdentityResult } from '../api/auth'
import type { BusinessRegistrationReviewData } from '../api/file'
import type { InvitedOrg } from '../api/user'

// ─── Types ────────────────────────────────────────────────────────────────────

export type RegisterMethod = 'existing' | 'new'

export interface TermsAgreement {
  /** 마케팅 정보 수신 동의(선택) 여부. 필수 약관(이용약관/개인정보 수집·이용)은 모두 동의해야만
   *  다음 단계로 넘어올 수 있어 항상 true이므로 별도로 저장하지 않는다 */
  marketingOptIn: boolean
}

interface RegisterFlowState {
  registerMethod: RegisterMethod | null
  setRegisterMethod: (method: RegisterMethod) => void
  clearRegisterMethod: () => void
  /** 2단계(본인인증) 완료 시 백엔드로부터 받은 확인 결과 — 3단계(가입 여부 안내)에서 사용 */
  identityVerifyResult: VerifyIdentityResult | null
  setIdentityVerifyResult: (result: VerifyIdentityResult) => void
  clearIdentityVerifyResult: () => void
  /** 2단계(본인인증) 완료 시 PortOne 본인인증 요청에 사용한 인증 키(identityVerificationId) —
   *  최종 회원가입 제출(signUp) API의 verificationCode 파라미터로 그대로 재사용한다 */
  identityVerificationCode: string | null
  setIdentityVerificationCode: (code: string) => void
  clearIdentityVerificationCode: () => void
  /** 4단계(이용약관 동의) 완료 여부 — null이면 아직 동의하지 않은 상태(5단계 라우트 가드에서 사용) */
  termsAgreement: TermsAgreement | null
  setTermsAgreement: (agreement: TermsAgreement) => void
  clearTermsAgreement: () => void
  /** 5단계(이메일 인증) 완료 시 인증된 이메일 — 이후 회원가입 정보 입력 단계에서 사용 */
  registerEmail: string | null
  setRegisterEmail: (email: string) => void
  clearRegisterEmail: () => void
  /** 5단계(이메일 인증) 완료 직후 조회한, 내 이메일로 온 초대 조직 목록 — null이면 아직 조회하지
   *  않았거나 조회에 실패한 상태(7단계에서는 빈 배열과 동일하게 "초대 없음"으로 간주한다).
   *  7단계(새 조직 등록/기존 조직 가입 선택)에서 화면 분기와 최종 제출(signUp)에 사용한다 */
  invitedOrgs: InvitedOrg[] | null
  setInvitedOrgs: (invitedOrgs: InvitedOrg[]) => void
  clearInvitedOrgs: () => void
  /** 6단계(비밀번호 설정) 완료 시 입력한 비밀번호 — 최종 회원가입 제출 단계에서 사용 */
  registerPassword: string | null
  setRegisterPassword: (password: string) => void
  clearRegisterPassword: () => void
  /** 7단계(새 조직 등록) 완료 시 업로드한 사업자등록증 PDF 파일 — 최종 회원가입 제출 단계에서 사용.
   *  registerMethod가 'new'일 때만 채워진다 */
  businessRegistrationFile: File | null
  setBusinessRegistrationFile: (file: File) => void
  clearBusinessRegistrationFile: () => void
  /** 7단계 완료 시 사업자등록증 PDF를 분석한 결과(법인명·사업자등록번호 등) — 최종 회원가입
   *  제출 단계에서 조직 정보로 사용 예정 */
  businessRegistrationReview: BusinessRegistrationReviewData | null
  setBusinessRegistrationReview: (review: BusinessRegistrationReviewData) => void
  clearBusinessRegistrationReview: () => void
  /** 7단계 완료 시 이미 S3에 업로드된 사업자등록증 PDF의 키 — 8단계(최종 제출) API가 나오면
   *  파일을 재업로드하지 않고 이 값을 그대로 재사용한다 */
  businessRegistrationS3Key: string | null
  setBusinessRegistrationS3Key: (s3Key: string) => void
  clearBusinessRegistrationS3Key: () => void
}

// ─── Store ────────────────────────────────────────────────────────────────────

/**
 * 회원가입 1단계(가입 방법 선택) → 2단계(본인인증) → 3단계(가입 여부 안내) →
 * 4단계(이용약관 동의) → 5단계(이메일 인증) → 6단계(비밀번호 설정) → 7단계(새 조직 등록,
 * registerMethod가 'new'인 경우) 사이에서 각 단계의 선택/입력 결과를 전달하는 store.
 * 의도적으로 persist하지 않는다 — 새로고침하면 진행 중인 가입 플로우가 초기화되어
 * 1단계(`/register`)로 돌아가는 것이 기존 로그인 플로우(loginFlowStore)와 동일한 정책이다.
 */
export const useRegisterFlowStore = create<RegisterFlowState>((set) => ({
  registerMethod: null,
  setRegisterMethod: (method) => set({ registerMethod: method }),
  clearRegisterMethod: () => set({ registerMethod: null }),
  identityVerifyResult: null,
  setIdentityVerifyResult: (result) => set({ identityVerifyResult: result }),
  clearIdentityVerifyResult: () => set({ identityVerifyResult: null }),
  identityVerificationCode: null,
  setIdentityVerificationCode: (code) => set({ identityVerificationCode: code }),
  clearIdentityVerificationCode: () => set({ identityVerificationCode: null }),
  termsAgreement: null,
  setTermsAgreement: (agreement) => set({ termsAgreement: agreement }),
  clearTermsAgreement: () => set({ termsAgreement: null }),
  registerEmail: null,
  setRegisterEmail: (email) => set({ registerEmail: email }),
  clearRegisterEmail: () => set({ registerEmail: null }),
  invitedOrgs: null,
  setInvitedOrgs: (invitedOrgs) => set({ invitedOrgs }),
  clearInvitedOrgs: () => set({ invitedOrgs: null }),
  registerPassword: null,
  setRegisterPassword: (password) => set({ registerPassword: password }),
  clearRegisterPassword: () => set({ registerPassword: null }),
  businessRegistrationFile: null,
  setBusinessRegistrationFile: (file) => set({ businessRegistrationFile: file }),
  clearBusinessRegistrationFile: () => set({ businessRegistrationFile: null }),
  businessRegistrationReview: null,
  setBusinessRegistrationReview: (review) => set({ businessRegistrationReview: review }),
  clearBusinessRegistrationReview: () => set({ businessRegistrationReview: null }),
  businessRegistrationS3Key: null,
  setBusinessRegistrationS3Key: (s3Key) => set({ businessRegistrationS3Key: s3Key }),
  clearBusinessRegistrationS3Key: () => set({ businessRegistrationS3Key: null }),
}))
