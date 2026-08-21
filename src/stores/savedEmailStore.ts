import { create } from 'zustand'

import { getCookie, removeCookie, setCookie } from '../utils/cookie'

const SAVED_EMAIL_KEY = 'savedEmail'
// "아이디 저장"은 브라우저를 재시작해도 유지되어야 의미가 있는 기능이므로 sessionStorage가 아닌
// 쿠키(1년 만료)를 사용한다. 저장 대상은 이메일뿐이며 비밀번호·토큰 등 민감 정보는 절대 포함하지
// 않는다. 자세한 배경은 utils/cookie.ts 상단 주석 참고
const SAVED_EMAIL_MAX_AGE = 60 * 60 * 24 * 365

interface SavedEmailState {
  savedEmail: string | null
  saveEmail: (email: string) => void
  clearSavedEmail: () => void
}

export const useSavedEmailStore = create<SavedEmailState>((set) => ({
  savedEmail: getCookie(SAVED_EMAIL_KEY),
  saveEmail: (email) => {
    setCookie(SAVED_EMAIL_KEY, email, SAVED_EMAIL_MAX_AGE)
    set({ savedEmail: email })
  },
  clearSavedEmail: () => {
    removeCookie(SAVED_EMAIL_KEY)
    set({ savedEmail: null })
  },
}))
