// ─── sessionStorage 접근 ──────────────────────────────────────────────────────
// accessToken을 다루는 sessionStorage 접근을 한 곳으로 모은다. 서드파티 스토리지 차단 등
// 일부 브라우저 환경에서는 sessionStorage 접근 자체가 예외(SecurityError 등)를 던질 수 있는데,
// 방어 코드 없이 이 값을 곳곳(requireAuth, authStore)에서 직접 읽으면 앱 초기화 단계에서부터
// 예외가 나 전체 화면이 뜨지 않을 위험이 있다.

const ACCESS_TOKEN_KEY = 'accessToken'

/** sessionStorage에서 accessToken을 안전하게 읽어온다. 접근 자체가 실패하면 null을 반환한다 */
export function getStoredAccessToken(): string | null {
  try {
    return sessionStorage.getItem(ACCESS_TOKEN_KEY)?.trim() || null
  } catch (err) {
    console.error('[token] sessionStorage 읽기 실패:', err)
    return null
  }
}

/** sessionStorage에 accessToken을 안전하게 저장한다. 접근 자체가 실패하면 콘솔에만 남긴다 */
export function setStoredAccessToken(token: string): void {
  try {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, token)
  } catch (err) {
    console.error('[token] sessionStorage 저장 실패:', err)
  }
}

/** sessionStorage에서 accessToken을 안전하게 제거한다 */
export function removeStoredAccessToken(): void {
  try {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY)
  } catch (err) {
    console.error('[token] sessionStorage 삭제 실패:', err)
  }
}

// ─── JWT ──────────────────────────────────────────────────────────────────────
// requireAuth(라우트 가드)와 authStore(로그인 상태)가 동일한 JWT 형식/만료 검증 로직을
// 각자 중복 구현하고 있었다 — 여기로 모아 하나만 유지한다.

/**
 * JWT 형식 검증 (구조만 확인, 서명 검증 아님)
 * - 3개 부분으로 구성 (header.payload.signature)
 * - 각 부분이 비어있지 않아야 함
 */
export function isValidTokenFormat(token: string): boolean {
  const parts = token.split('.')
  return parts.length === 3 && parts.every((part) => part.length > 0)
}

/**
 * JWT payload에서 exp(만료 시각) claim을 추출한다
 * @returns Unix timestamp(초), 파싱 실패 시 null
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
 * - exp claim이 없거나 파싱에 실패하면 만료된 것으로 간주한다
 * - 현재 시간이 exp보다 크면 만료됨
 */
export function isTokenExpired(token: string): boolean {
  const exp = getTokenExpiry(token)
  if (!exp) return true
  return Math.floor(Date.now() / 1000) > exp
}
