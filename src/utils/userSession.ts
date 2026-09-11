// ─── sessionStorage 접근 ──────────────────────────────────────────────────────
// 로그인 응답으로 받은 사용자/조직 정보를 sessionStorage에 보관한다. token.ts와 동일하게
// sessionStorage 접근 자체가 실패(SecurityError 등)할 수 있는 환경을 방어한다.

const USER_SESSION_KEY = 'userSession'

export interface UserSession {
  userIdx: string
  userName: string
  orgIdx: string
  orgName: string
  userGrade: number
}

/** sessionStorage에서 사용자 세션 정보를 안전하게 읽어온다. 없거나 파싱에 실패하면 null */
export function getStoredUserSession(): UserSession | null {
  try {
    const raw = sessionStorage.getItem(USER_SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as UserSession
  } catch (err) {
    console.error('[userSession] sessionStorage 읽기 실패:', err)
    return null
  }
}

/** sessionStorage에 사용자 세션 정보를 안전하게 저장한다. 접근 자체가 실패하면 콘솔에만 남긴다 */
export function setStoredUserSession(session: UserSession): void {
  try {
    sessionStorage.setItem(USER_SESSION_KEY, JSON.stringify(session))
  } catch (err) {
    console.error('[userSession] sessionStorage 저장 실패:', err)
  }
}

/** sessionStorage에서 사용자 세션 정보를 안전하게 제거한다 */
export function removeStoredUserSession(): void {
  try {
    sessionStorage.removeItem(USER_SESSION_KEY)
  } catch (err) {
    console.error('[userSession] sessionStorage 삭제 실패:', err)
  }
}
