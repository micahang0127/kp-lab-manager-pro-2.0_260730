import { create } from 'zustand'

import type { VerifyIdentityResult } from '../api/auth'

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
  /** 4단계(이용약관 동의) 완료 여부 — null이면 아직 동의하지 않은 상태(5단계 라우트 가드에서 사용) */
  termsAgreement: TermsAgreement | null
  setTermsAgreement: (agreement: TermsAgreement) => void
  clearTermsAgreement: () => void
  /** 5단계(이메일 인증) 완료 시 인증된 이메일 — 이후 회원가입 정보 입력 단계에서 사용 */
  registerEmail: string | null
  setRegisterEmail: (email: string) => void
  clearRegisterEmail: () => void
  /** 6단계(비밀번호 설정) 완료 시 입력한 비밀번호 — 최종 회원가입 제출 단계에서 사용 */
  registerPassword: string | null
  setRegisterPassword: (password: string) => void
  clearRegisterPassword: () => void
  /** 7단계(새 조직 등록) 완료 시 업로드한 사업자등록증 PDF 파일 — 최종 회원가입 제출 단계에서 사용.
   *  registerMethod가 'new'일 때만 채워진다 */
  businessRegistrationFile: File | null
  setBusinessRegistrationFile: (file: File) => void
  clearBusinessRegistrationFile: () => void
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
  termsAgreement: null,
  setTermsAgreement: (agreement) => set({ termsAgreement: agreement }),
  clearTermsAgreement: () => set({ termsAgreement: null }),
  registerEmail: null,
  setRegisterEmail: (email) => set({ registerEmail: email }),
  clearRegisterEmail: () => set({ registerEmail: null }),
  registerPassword: null,
  setRegisterPassword: (password) => set({ registerPassword: password }),
  clearRegisterPassword: () => set({ registerPassword: null }),
  businessRegistrationFile: null,
  setBusinessRegistrationFile: (file) => set({ businessRegistrationFile: file }),
  clearBusinessRegistrationFile: () => set({ businessRegistrationFile: null }),
}))
