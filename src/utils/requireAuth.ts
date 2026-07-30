import { redirect } from '@tanstack/react-router'

/**
 * JWT 토큰 형식 검증 (구조만 확인, 서명 검증 아님)
 * - 3개 부분으로 구성 (header.payload.signature)
 * - 각 부분이 비어있지 않아야 함
 */
function isValidTokenFormat(token: string): boolean {
  const parts = token.split('.')
  return parts.length === 3 && parts.every((part) => part.length > 0)
}

/**
 * 저장된 토큰의 만료 시간 추출 (JWT payload 디코딩)
 * @returns Unix timestamp (초) 또는 null (파싱 실패 시)
 */
export function getTokenExpiry(token: string): number | null {
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
 * 토큰 만료 여부 확인
 * - exp claim이 없으면 만료된 것으로 간주
 * - 현재 시간이 exp보다 크면 만료됨
 */
function isTokenExpired(token: string): boolean {
  const exp = getTokenExpiry(token)
  if (!exp) return true
  return Math.floor(Date.now() / 1000) > exp
}

/**
 * 토큰 유효성 검증 (형식, 만료 여부)
 * @returns 토큰이 유효하면 true, 유효하지 않으면 false
 */
export function isAuthValid(): boolean {
  const token = sessionStorage.getItem('accessToken')?.trim()

  // 토큰 없음 또는 공백
  if (!token) {
    return false
  }

  // 토큰 형식 검증 실패
  if (!isValidTokenFormat(token)) {
    sessionStorage.removeItem('accessToken')
    return false
  }

  // 토큰 만료 확인
  if (isTokenExpired(token)) {
    sessionStorage.removeItem('accessToken')
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
