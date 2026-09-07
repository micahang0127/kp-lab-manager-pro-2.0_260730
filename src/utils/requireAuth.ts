import { redirect } from '@tanstack/react-router'

import {
  getStoredAccessToken,
  getTokenExpiry,
  isTokenExpired,
  isValidTokenFormat,
  removeStoredAccessToken,
} from './token'

export { getTokenExpiry }

/**
 * 토큰 유효성 검증 (형식, 만료 여부)
 * @returns 토큰이 유효하면 true, 유효하지 않으면 false
 */
export function isAuthValid(): boolean {
  const token = getStoredAccessToken()

  // 토큰 없음 또는 공백
  if (!token) {
    return false
  }

  // 토큰 형식 검증 실패
  if (!isValidTokenFormat(token)) {
    removeStoredAccessToken()
    return false
  }

  // 토큰 만료 확인
  if (isTokenExpired(token)) {
    removeStoredAccessToken()
    return false
  }

  return true
}

/**
 * 라우트 가드용 - TanStack Router beforeLoad에서 호출
 * 토큰 유효성을 검증하고 유효하지 않으면 로그인 페이지로 리디렉션
 */
export function requireAuth(): ReturnType<typeof redirect> | undefined {
  if (!isAuthValid()) {
    return redirect({ to: '/login' })
  }
}
