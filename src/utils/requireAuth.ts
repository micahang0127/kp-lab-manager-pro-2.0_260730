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

/**
 * 공개 라우트(로그인·회원가입·아이디/비밀번호 찾기 등)용 - TanStack Router beforeLoad에서 호출.
 * 이미 로그인된 사용자가 접근하면 '/main'으로 리디렉션한다.
 *
 * 반드시 requireAuth와 동일한 기준(isAuthValid — 형식+만료 검증)으로 판단해야 한다. 과거에는
 * `sessionStorage.getItem('accessToken')` 존재 여부만 봤는데, 형식이 깨졌거나 만료된 토큰이
 * sessionStorage에 남아있는 상태로 공개 라우트에 들어오면 여기서 '/main'으로 보내고,
 * requireAuth가 다시 만료를 감지해 '/login'으로 돌려보내는 불필요한 리다이렉트 왕복(ping-pong)이
 * 발생했다. 두 가드의 판단 기준을 하나로 통일해, 유효하지 않은 토큰은 애초에 '/main'으로
 * 보내지지 않도록 한다 — removeStoredAccessToken()이 실패하는 극단적 환경에서도 왕복 자체가
 * 성립하지 않으므로 무한 루프 가능성도 함께 제거된다.
 */
export function redirectIfAuthenticated(): ReturnType<typeof redirect> | undefined {
  if (isAuthValid()) {
    return redirect({ to: '/main' })
  }
}
