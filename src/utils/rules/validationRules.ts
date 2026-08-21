// ─── Email Rule ──────────────────────────────────────────────────────────────

export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

export const EMAIL_RULE_MESSAGE = '올바른 이메일 형식으로 입력해주세요.'

// RFC 5321 기준 이메일 전체 최대 길이(로컬파트 64자 + '@' + 도메인 255자를 넉넉히 포함)
export const EMAIL_MAX_LENGTH = 254

// 한글(완성형 음절 + 자모) 매칭 — 이메일은 한글을 허용하지 않으므로 입력 즉시 제거하거나
// 포함 여부를 검사하는 데 사용
const HANGUL_CHAR_CLASS = 'ㄱ-ㅎㅏ-ㅣ가-힣'
const HANGUL_REGEX = new RegExp(`[${HANGUL_CHAR_CLASS}]`, 'g')
// .test() 반복 호출 시 g 플래그의 lastIndex 상태가 남는 문제를 피하기 위해 별도 인스턴스 사용
const HANGUL_TEST_REGEX = new RegExp(`[${HANGUL_CHAR_CLASS}]`)

/** 이메일이 형식에 맞는지 검사한다 */
export function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value)
}

/** 입력값에서 한글(완성형 음절 + 자모)을 제거한다 (이메일 입력 시 한글 실시간 차단용) */
export function removeHangul(value: string): string {
  return value.replace(HANGUL_REGEX, '')
}

/** 입력값에 한글(완성형 음절 + 자모)이 포함되어 있는지 검사한다 (한글 키보드로 입력을 시도했는지 판별용) */
export function containsHangul(value: string): boolean {
  return HANGUL_TEST_REGEX.test(value)
}

// ─── Password Rule ────────────────────────────────────────────────────────────
// 26.08.20 정책 변경: 영문 최소 1자 + 숫자 최소 1자 조합을 필수로 하며, 특수기호는 선택적으로
// 포함할 수 있다. 최소 8자 이상이어야 하며 길이 상한은 두지 않는다.

export const PASSWORD_MIN_LENGTH = 8

// 영문 1자 이상 + 숫자 1자 이상을 반드시 포함해야 하며, 공백을 제외한 출력 가능 ASCII
// 문자(영문 대소문자, 숫자, 특수기호)만 허용
export const PASSWORD_REGEX = new RegExp(
  `^(?=.*[a-zA-Z])(?=.*\\d)[\\x21-\\x7E]{${PASSWORD_MIN_LENGTH},}$`
)

export const PASSWORD_RULE_MESSAGE = '비밀번호는 영문과 숫자를 포함하여 8자리 이상 입력해주세요.'

/** 비밀번호가 정책(영문+숫자 조합 필수, 특수기호 선택, 8자 이상)을 만족하는지 검사한다 */
export function isValidPassword(value: string): boolean {
  return PASSWORD_REGEX.test(value)
}

/** 입력값에서 허용되지 않는 문자(한글, 공백 등)를 제거한다 (비밀번호 입력 시 실시간 차단용) */
export function sanitizePasswordInput(value: string): string {
  return value.replace(/[^\x21-\x7E]/g, '')
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
// 사업자등록증은 위변조를 막기 위해 스캔 이미지(JPG/PNG)는 받지 않고 PDF만 허용한다.
// 과도한 용량의 파일이 업로드되어 요청이 지연·실패하는 것을 막기 위해 용량 상한도 둔다.
// ⚠️ 아래 검사는 클라이언트 UX용이며 devtools 등으로 우회 가능하므로, 서버에서도 동일한
// 형식·용량 검증(가능하면 매직 바이트 기준)을 반드시 수행해야 한다.

export const BUSINESS_REGISTRATION_FILE_ACCEPT = '.pdf'

const BUSINESS_REGISTRATION_FILE_ALLOWED_TYPES = ['application/pdf']

export const BUSINESS_REGISTRATION_FILE_MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10MB

export const BUSINESS_REGISTRATION_FILE_RULE_MESSAGE =
  'PDF 파일만 첨부할 수 있으며, 최대 10MB까지 업로드할 수 있습니다.'

/** 사업자등록증 첨부파일이 허용된 형식·용량인지 검사한다 */
export function isValidBusinessRegistrationFile(file: File): boolean {
  if (file.size <= 0 || file.size > BUSINESS_REGISTRATION_FILE_MAX_SIZE_BYTES) return false
  return BUSINESS_REGISTRATION_FILE_ALLOWED_TYPES.includes(file.type)
}

// ─── Email Verification Code Rule ────────────────────────────────────────────

export const EMAIL_CODE_LENGTH = 6

export const EMAIL_CODE_REGEX = /^\d{6}$/

export const EMAIL_CODE_RULE_MESSAGE = '인증번호 6자리를 숫자로 입력해주세요.'

/** 이메일 인증번호가 6자리 숫자 형식인지 검사한다 */
export function isValidEmailCode(value: string): boolean {
  return EMAIL_CODE_REGEX.test(value)
}
