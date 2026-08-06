// ─── Email Rule ──────────────────────────────────────────────────────────────

export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

export const EMAIL_RULE_MESSAGE = '올바른 이메일 형식으로 입력해주세요.'

/** 이메일이 형식에 맞는지 검사한다 */
export function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value)
}

// ─── Password Rule (샘플) ────────────────────────────────────────────────────
// 영문, 숫자, 특수문자를 각 1개 이상 포함한 8~64자. NIST SP 800-63B 권고에 따라 최대 길이를
// 64자로 설정 — 비밀번호 관리자 생성 값·패스프레이즈 사용을 막지 않기 위함. 실제 정책 확정 시 이 파일만 교체하면 됨.

export const PASSWORD_REGEX =
  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,64}$/

export const PASSWORD_RULE_MESSAGE = '영문, 숫자, 특수문자를 포함하여 8~64자로 입력해주세요.'

/** 비밀번호가 정책을 만족하는지 검사한다 */
export function isValidPassword(value: string): boolean {
  return PASSWORD_REGEX.test(value)
}

// ─── Business Registration Number Rule ──────────────────────────────────────
// 형식 검증만 수행한다 (체크섬 검증 없음). 하이픈 포함/생략 모두 허용.

export const BUSINESS_NUMBER_REGEX = /^\d{3}-?\d{2}-?\d{5}$/

export const BUSINESS_NUMBER_RULE_MESSAGE = '사업자등록번호는 000-00-00000 형식으로 입력해주세요.'

/** 사업자등록번호가 형식에 맞는지 검사한다 (체크섬 검증은 하지 않음) */
export function isValidBusinessNumber(value: string): boolean {
  return BUSINESS_NUMBER_REGEX.test(value)
}

// ─── Representative Name Rule ────────────────────────────────────────────────
// 사업자등록증에 표기된 대표자명 기준. 공동대표는 "1 홍길동 2 김철수"처럼 번호를 함께
// 표기하는 경우가 있어 숫자도 허용한다. 단, 숫자·기호만으로는 대표자명이 될 수 없으므로
// 한글 또는 영문 글자가 최소 1개 이상 포함되어야 한다. 길이 검사는 앞뒤 공백을 제거한 뒤 별도로 수행한다.

export const REPRESENTATIVE_NAME_REGEX =
  /^(?=.{2,50}$)(?=.*[가-힣a-zA-Z])[가-힣a-zA-Z0-9\s().,'·/-]+$/

export const REPRESENTATIVE_NAME_RULE_MESSAGE =
  "대표자명은 한글, 영문, 숫자, 공백, ().,'·/- 문자만 사용하여 2~50자로 입력해주세요."

/** 대표자명이 형식에 맞는지 검사한다 (앞뒤 공백을 제거한 뒤 길이와 허용 문자를 검사) */
export function isValidRepresentativeName(value: string): boolean {
  const trimmed = value.trim()
  if (trimmed.length < 2 || trimmed.length > 50) return false
  return REPRESENTATIVE_NAME_REGEX.test(trimmed)
}

// ─── Business Registration File Rule ────────────────────────────────────────
// 사업자등록증 스캔본은 보통 PDF 또는 사진(JPG/PNG)으로 제출되므로 해당 형식만 허용한다.
// 과도한 용량의 파일이 업로드되어 요청이 지연·실패하는 것을 막기 위해 용량 상한도 둔다.
// ⚠️ 아래 검사는 클라이언트 UX용이며 devtools 등으로 우회 가능하므로, 서버에서도 동일한
// 형식·용량 검증(가능하면 매직 바이트 기준)을 반드시 수행해야 한다.

export const BUSINESS_REGISTRATION_FILE_ACCEPT = '.pdf,.jpg,.jpeg,.png'

const BUSINESS_REGISTRATION_FILE_ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png']

export const BUSINESS_REGISTRATION_FILE_MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10MB

export const BUSINESS_REGISTRATION_FILE_RULE_MESSAGE =
  'PDF, JPG, PNG 파일만 첨부할 수 있으며, 최대 10MB까지 업로드할 수 있습니다.'

/** 사업자등록증 첨부파일이 허용된 형식·용량인지 검사한다 */
export function isValidBusinessRegistrationFile(file: File): boolean {
  if (file.size <= 0 || file.size > BUSINESS_REGISTRATION_FILE_MAX_SIZE_BYTES) return false
  return BUSINESS_REGISTRATION_FILE_ALLOWED_TYPES.includes(file.type)
}
