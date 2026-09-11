// ─── Helpers ───────────────────────────────────────────────────────────────────

/** 문자열 앞 2글자만 남기고 나머지를 글자 수만큼 '*'로 치환한다 (2글자 이하면 그대로 반환) */
function maskKeepingPrefix(value: string): string {
  if (value.length <= 2) return value
  return `${value.slice(0, 2)}${'*'.repeat(value.length - 2)}`
}

// ─── API ─────────────────────────────────────────────────────────────────────

/**
 * 이메일을 화면 표시용으로 마스킹한다. 로컬 파트와 도메인 이름(TLD 제외)은 각각 앞 2글자만
 * 보이고 나머지는 '*'로 치환하며, TLD(마지막 '.' 이후)는 그대로 노출한다.
 * 예: 'hodong@koreapetroleum.com' → 'ho****@ko************.com'
 * '@'가 없는 등 이메일 형식이 아니면 원본을 그대로 반환한다.
 */
export function maskEmail(email: string): string {
  const atIndex = email.indexOf('@')
  if (atIndex <= 0 || atIndex === email.length - 1) return email

  const local = email.slice(0, atIndex)
  const domain = email.slice(atIndex + 1)

  const lastDotIndex = domain.lastIndexOf('.')
  const maskedDomain =
    lastDotIndex > 0
      ? `${maskKeepingPrefix(domain.slice(0, lastDotIndex))}${domain.slice(lastDotIndex)}`
      : maskKeepingPrefix(domain)

  return `${maskKeepingPrefix(local)}@${maskedDomain}`
}
