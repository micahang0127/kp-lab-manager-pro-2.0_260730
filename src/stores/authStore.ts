import { create } from 'zustand'

interface AuthState {
  isLoggedIn: boolean
  setLoggedIn: (value: boolean) => void
  logout: () => void
  isTokenExpired: () => boolean
  getTokenExpiry: () => number | null
}

/**
 * JWT payload에서 exp (expiration) claim 추출
 * @returns Unix timestamp (초) 또는 null
 */
function getTokenExpiryValue(token: string): number | null {
  try {
    const payloadStr = atob(token.split('.')[1])
    const payload = JSON.parse(payloadStr) as Record<string, unknown>
    const exp = payload.exp
    return typeof exp === 'number' ? exp : null
  } catch {
    return null
  }
}

/**
 * 현재 저장된 토큰이 만료되었는지 확인
 */
function isTokenExpiredFn(): boolean {
  const token = sessionStorage.getItem('accessToken')?.trim()
  if (!token) return true

  const exp = getTokenExpiryValue(token)
  if (!exp) return true

  return Math.floor(Date.now() / 1000) > exp
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: !!sessionStorage.getItem('accessToken'),
  setLoggedIn: (value) => set({ isLoggedIn: value }),
  logout: () => {
    sessionStorage.removeItem('accessToken')
    set({ isLoggedIn: false })
  },
  isTokenExpired: isTokenExpiredFn,
  getTokenExpiry: () => {
    const token = sessionStorage.getItem('accessToken')?.trim()
    return token ? getTokenExpiryValue(token) : null
  },
}))
