import type { VerifyIdentityResult } from '../api/auth'

// ─── Constants ─────────────────────────────────────────────────────────────────

const FIELD_SEPARATOR = '  /  '

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** 성별 코드를 한국어 표기로 변환 (예: 'M' → '남성') */
function formatGender(gender?: string): string | undefined {
  if (gender === 'M') return '남성'
  if (gender === 'F') return '여성'
  return gender
}

// ─── API ─────────────────────────────────────────────────────────────────────

/**
 * 신규 사용자(가입된 계정 없음)의 마스킹된 본인인증 정보를 화면 표시용 한 줄로 합친다.
 * maskedName/maskedBirth/maskedMobile은 이미 백엔드에서 마스킹되어 내려온 값이므로,
 * 여기서는 표시 구분자(하이픈 → 마침표/공백)와 성별 표기만 다듬는다.
 * 예: { maskedName: '홍길*', maskedBirth: '1990-**-**', gender: 'M', maskedMobile: '010-**-5678' }
 *     → '홍길*  /  1990.**.**  /  남성  /  010 - ** - 5678'
 * 필드가 없으면(예: 가입된 계정이 있는 경우) 해당 필드는 건너뛴다.
 */
export function formatMaskedIdentity(result: VerifyIdentityResult): string {
  const fields = [
    result.maskedName,
    result.maskedBirth?.replace(/-/g, '.'),
    formatGender(result.gender),
    result.maskedMobile?.replace(/-/g, ' - '),
  ].filter((field): field is string => Boolean(field))

  return fields.join(FIELD_SEPARATOR)
}
