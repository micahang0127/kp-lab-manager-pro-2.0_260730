/**
 * [TEMP] 26.07.27 백엔드 미연동 — requireAuth(JWT 형식 + 만료 검증)를 통과시키기 위한 가짜 토큰 생성.
 * 실제 서버 발급 토큰이 아니므로 `/user/login`, `/user/email-verification-login` 백엔드 연동
 * 완료 시 이 함수와 모든 호출부(`LoginPage.tsx`, `EmailVerificationPage.tsx`)를 제거할 것.
 */
export function createTempAccessToken(): string {
  const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }))
  const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 }))
  return `${header}.${payload}.temp-signature`
}
