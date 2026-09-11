import { create } from 'zustand'

import type { LoginDevice } from '../api/auth'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PendingVerification {
  email: string
  /** verify-device가 비밀번호를 다시 요구하므로(코드만으로 토큰 발급 방지) 1차 로그인 입력값을
   *  그대로 들고 간다. Figma 2차 인증 화면에 비밀번호 입력칸이 없어 재입력을 요구하지 않는다.
   *  registerFlowStore.registerPassword와 동일한 정책 — persist하지 않아 새로고침 시 사라진다 */
  password: string
  /** 1차 로그인에 사용한 값을 그대로 재사용해야 두 요청의 조합이 어긋나지 않는다 */
  fingerprintCode: string
  device: LoginDevice
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
