import { create } from 'zustand'

import { getCookie, setCookie } from '../utils/cookie'

const FINGERPRINT_COOKIE_KEY = 'fingerprintCode'
// 재방문 시에도 동일 브라우저로 인식되어야 하므로 장기간 유지 (savedEmailStore와 동일하게 1년).
// "1년 뒤 강제 재인증"은 정책으로 정해진 적이 없으므로, 활성 사용자가 계속 방문하는 한 만료되지
// 않도록 앱 로드마다(store 초기화 시) 만료 시각을 다시 1년 뒤로 슬라이딩 연장한다 — 정말 오래
// 방문하지 않은(또는 쿠키를 지운) 브라우저만 자연스럽게 만료된다
const FINGERPRINT_MAX_AGE = 60 * 60 * 24 * 365

interface FingerprintState {
  fingerprintCode: string | null
  saveFingerprintCode: (code: string) => void
}

/** 쿠키에 저장된 fingerprintCode를 읽고, 있다면 만료 시각을 다시 FINGERPRINT_MAX_AGE 뒤로 연장한다 */
function readAndRefreshFingerprintCode(): string | null {
  const existing = getCookie(FINGERPRINT_COOKIE_KEY)
  if (existing) {
    setCookie(FINGERPRINT_COOKIE_KEY, existing, FINGERPRINT_MAX_AGE)
  }
  return existing
}

export const useFingerprintStore = create<FingerprintState>((set) => ({
  fingerprintCode: readAndRefreshFingerprintCode(),
  saveFingerprintCode: (code) => {
    setCookie(FINGERPRINT_COOKIE_KEY, code, FINGERPRINT_MAX_AGE)
    set({ fingerprintCode: code })
  },
}))
