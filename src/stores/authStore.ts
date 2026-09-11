import { create } from 'zustand'

import {
  getStoredAccessToken,
  getTokenExpiry as getJwtExpiry,
  isTokenExpired as isJwtExpired,
  removeStoredAccessToken,
  setStoredAccessToken,
} from '../utils/token'
import type { UserSession } from '../utils/userSession'
import {
  getStoredUserSession,
  removeStoredUserSession,
  setStoredUserSession,
} from '../utils/userSession'

interface AuthState {
  isLoggedIn: boolean
  /** 로그인 응답으로 받은 사용자/조직 정보. 로그인 전이거나 로그아웃하면 null */
  userSession: UserSession | null
  /** 로그인 성공 처리 — accessToken과 사용자 정보를 sessionStorage에 저장하고 로그인 상태로 만든다.
   *  컴포넌트가 sessionStorage에 직접 접근하지 않도록 이 액션 하나로 묶는다(CLAUDE.md 규칙) */
  login: (accessToken: string, session: UserSession) => void
  setLoggedIn: (value: boolean) => void
  logout: () => void
  isTokenExpired: () => boolean
  getTokenExpiry: () => number | null
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: !!getStoredAccessToken(),
  userSession: getStoredUserSession(),
  login: (accessToken, session) => {
    setStoredAccessToken(accessToken)
    setStoredUserSession(session)
    set({ isLoggedIn: true, userSession: session })
  },
  setLoggedIn: (value) => set({ isLoggedIn: value }),
  logout: () => {
    removeStoredAccessToken()
    removeStoredUserSession()
    set({ isLoggedIn: false, userSession: null })
  },
  isTokenExpired: () => {
    const token = getStoredAccessToken()
    return token ? isJwtExpired(token) : true
  },
  getTokenExpiry: () => {
    const token = getStoredAccessToken()
    return token ? getJwtExpiry(token) : null
  },
}))
