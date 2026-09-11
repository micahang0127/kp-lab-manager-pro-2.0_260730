import { create } from 'zustand'

import type { VerifyIdentityResult } from '../api/auth'

// ─── Types ────────────────────────────────────────────────────────────────────

interface VerifiedIdentity {
  /** 본인인증 완료 시 백엔드 확인 결과 (hasExistingAccount/existingEmail 등) */
  result: VerifyIdentityResult
  /** 포트원 본인인증 요청에 사용한 인증 키 — 비밀번호 재설정(resetPassword) API 호출에 재사용한다 */
  identityVerificationCode: string
}

interface FindAccountFlowState {
  verifiedIdentity: VerifiedIdentity | null
  setVerifiedIdentity: (v: VerifiedIdentity) => void
  clearVerifiedIdentity: () => void
}

// ─── Store ────────────────────────────────────────────────────────────────────

/**
 * 아이디·비밀번호 찾기(본인인증) → 비밀번호 재설정 화면 사이에서 본인인증 결과를 전달하는 store.
 * loginFlowStore와 동일한 이유로 의도적으로 persist하지 않는다 — 새로고침하면 처음부터
 * 다시 본인인증하도록 `/find-account`로 돌아가는 것이 보안상 안전하다.
 */
export const useFindAccountFlowStore = create<FindAccountFlowState>((set) => ({
  verifiedIdentity: null,
  setVerifiedIdentity: (v) => set({ verifiedIdentity: v }),
  clearVerifiedIdentity: () => set({ verifiedIdentity: null }),
}))
