// ─── Cookie ────────────────────────────────────────────────────────────────────
// 이 프로젝트는 인증 토큰 등 민감 정보는 sessionStorage에만 저장하는 정책을 따른다(CLAUDE.md).
// 다만 "아이디 저장"처럼 브라우저를 재시작해도 값이 유지되어야 하는 것 자체가 기능 요구사항인
// 비민감 값(이메일 등)은 sessionStorage로는 구현이 불가능하므로, 이런 극히 제한된 용도에 한해
// 쿠키를 사용한다. 새로운 저장 대상을 추가하기 전에 반드시 민감 정보가 아닌지 확인할 것.

/** 쿠키 값을 읽는다. 존재하지 않으면 null */
export function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

/** 쿠키 값을 저장한다. maxAgeSeconds 동안 유지되며, https 환경에서는 Secure 속성이 자동으로 붙는다 */
export function setCookie(name: string, value: string, maxAgeSeconds: number): void {
  const secure = location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${maxAgeSeconds}; path=/; SameSite=Lax${secure}`
}

/** 쿠키를 즉시 만료시켜 제거한다 */
export function removeCookie(name: string): void {
  const secure = location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${name}=; max-age=0; path=/; SameSite=Lax${secure}`
}
