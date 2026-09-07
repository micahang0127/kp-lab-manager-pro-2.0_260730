import { create } from 'zustand'

import {
  getStoredAccessToken,
  getTokenExpiry as getJwtExpiry,
  isTokenExpired as isJwtExpired,
  removeStoredAccessToken,
} from '../utils/token'

interface AuthState {
  isLoggedIn: boolean
  setLoggedIn: (value: boolean) => void
  logout: () => void
  isTokenExpired: () => boolean
  getTokenExpiry: () => number | null
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: !!getStoredAccessToken(),
  setLoggedIn: (value) => set({ isLoggedIn: value }),
  logout: () => {
    removeStoredAccessToken()
    set({ isLoggedIn: false })
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
