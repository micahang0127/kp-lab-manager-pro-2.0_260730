import { create } from 'zustand'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PendingVerification {
  email: string
  /** 이메일 인증번호 만료 시각 (Date.now() 기준 ms) */
  expiresAt: number
}

interface LoginFlowState {
  pending: PendingVerification | null
  setPending: (p: PendingVerification) => void
  clearPending: () => void
}

// ─── Store ────────────────────────────────────────────────────────────────────

/**
 * 로그인 → 이메일 인증(신규 기기) 2단계 사이에서 필요한 정보를 전달하는 store.
 * 의도적으로 persist하지 않는다 — 새로고침하면 진행 중인 인증 플로우가 초기화되어
 * `/login`으로 돌아가는 것이 기존 동작과 동일하고 보안상으로도 안전하다.
 */
export const useLoginFlowStore = create<LoginFlowState>((set) => ({
  pending: null,
  setPending: (p) => set({ pending: p }),
  clearPending: () => set({ pending: null }),
}))
