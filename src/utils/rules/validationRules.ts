// ─── Email Rule ──────────────────────────────────────────────────────────────

export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

export const EMAIL_RULE_MESSAGE = '올바른 이메일 형식으로 입력해주세요.'

// v1/user/email/duplicate는 중복이어도 요청 자체는 성공(message: [])으로 응답하므로,
// 서버가 문구를 내려주지 않는다 — 안내 문구는 프론트에서 직접 정의해 사용한다
export const EMAIL_DUPLICATE_MESSAGE = '이미 가입된 이메일입니다.'

// RFC 5321 기준 이메일 전체 최대 길이(로컬파트 64자 + '@' + 도메인 255자를 넉넉히 포함)
export const EMAIL_MAX_LENGTH = 254

/** 이메일이 형식에 맞는지 검사한다 */
export function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value)
}

// ─── Hangul Rule ──────────────────────────────────────────────────────────────
// 이메일·비밀번호 등 한글을 허용하지 않는 입력칸에서 공통으로 사용한다. 실제 입력 처리는
// useHangulGuardedInput 훅이 담당하며(IME 조합 중 값을 건드리면 조합이 깨지는 문제 때문에
// 이 함수들을 직접 매 키 입력마다 호출하지 않는다), 여기서는 순수 문자열 판별/제거 로직만 둔다.

// 한글(완성형 음절 + 자모) 매칭
const HANGUL_CHAR_CLASS = 'ㄱ-ㅎㅏ-ㅣ가-힣'
const HANGUL_REGEX = new RegExp(`[${HANGUL_CHAR_CLASS}]`, 'g')
// .test() 반복 호출 시 g 플래그의 lastIndex 상태가 남는 문제를 피하기 위해 별도 인스턴스 사용
const HANGUL_TEST_REGEX = new RegExp(`[${HANGUL_CHAR_CLASS}]`)

export const HANGUL_INPUT_MESSAGE = '한글은 입력할 수 없습니다.'

/** 입력값에서 한글(완성형 음절 + 자모)을 제거한다 */
export function removeHangul(value: string): string {
  return value.replace(HANGUL_REGEX, '')
}

/** 입력값에 한글(완성형 음절 + 자모)이 포함되어 있는지 검사한다 (한글 키보드로 입력을 시도했는지 판별용) */
export function containsHangul(value: string): boolean {
  return HANGUL_TEST_REGEX.test(value)
}

// ─── Password Rule ────────────────────────────────────────────────────────────
// 26.09.10 정책 변경: 대소문자 구분 없이 영문 최소 1자 + 숫자 최소 1자 + 특수기호 최소 1자
// 조합을 모두 필수로 한다(작은따옴표(')는 사용 불가 — SQL 문자열 리터럴 구분자와 겹쳐
// 하위 시스템에서 오류를 유발할 수 있어 제외). 최소 8자 이상이어야 하며 길이 상한은 두지 않는다.

export const PASSWORD_MIN_LENGTH = 8

// 영문 1자 이상 + 숫자 1자 이상 + 특수기호(작은따옴표 제외) 1자 이상을 반드시 포함해야 하며,
// 공백과 작은따옴표(')를 제외한 출력 가능 ASCII 문자(영문 대소문자, 숫자, 특수기호)만 허용
export const PASSWORD_REGEX = new RegExp(
  `^(?=.*[a-zA-Z])(?=.*\\d)(?=.*[\\x21-\\x26\\x28-\\x2F\\x3A-\\x40\\x5B-\\x60\\x7B-\\x7E])[\\x21-\\x26\\x28-\\x7E]{${PASSWORD_MIN_LENGTH},}$`
)

export const PASSWORD_RULE_MESSAGE =
  "비밀번호는 영문과 숫자, 특수기호를 포함하여 8자 이상 입력해 주세요. (' 제외)"

/** 비밀번호가 정책(대소문자 구분 없이 영문+숫자+특수기호 조합 필수, 작은따옴표(') 제외, 8자 이상)을 만족하는지 검사한다 */
export function isValidPassword(value: string): boolean {
  return PASSWORD_REGEX.test(value)
}

export const PASSWORD_MISMATCH_MESSAGE = '비밀번호가 일치하지 않습니다.'

/** 새 비밀번호 두 입력값이 형식(영문+숫자+특수기호 조합 8자 이상)에 맞고 서로 일치하는지(제출 가능 상태인지) 검사한다.
 *  회원가입 비밀번호 설정, 비밀번호 재설정 등 새 비밀번호를 두 번 입력받는 화면에서 공통으로 사용한다 */
export function isNewPasswordFieldsValid(newPassword: string, confirmPassword: string): boolean {
  return isValidPassword(newPassword) && confirmPassword === newPassword
}

/** 입력값에서 허용되지 않는 문자(한글, 공백, 작은따옴표(') 등)를 제거한다 (비밀번호 입력 시 실시간 차단용) */
export function sanitizePasswordInput(value: string): string {
  return value.replace(/[^\x21-\x26\x28-\x7E]/g, '')
}

// ─── Email Verification Code Rule ────────────────────────────────────────────

export const EMAIL_CODE_LENGTH = 6

// 이메일 인증코드 발송 API('/v1/user/email/sendCode') 응답에는 유효 시간이 내려오지 않아
// 프론트에서 고정값으로 관리한다 — 화면의 "남은 시간" 타이머 기준값
export const EMAIL_CODE_EXPIRES_IN_SECONDS = 180

export const EMAIL_CODE_REGEX = /^\d{6}$/

export const EMAIL_CODE_RULE_MESSAGE = '인증번호 6자리를 숫자로 입력해주세요.'

/** 이메일 인증번호가 6자리 숫자 형식인지 검사한다 */
export function isValidEmailCode(value: string): boolean {
  return EMAIL_CODE_REGEX.test(value)
}

// ─── Email Verification Limit Rule ───────────────────────────────────────────
// 서버가 실제로 강제하는 한도를 프론트에서도 동일하게 미러링해, 한도 초과가 확실한 요청은
// API를 호출하기 전에 미리 막는다. 실제 방어는 서버 응답이 담당하며, 이 값들은 그 정책을
// 화면에 선제 반영하기 위한 보조 가드일 뿐이다.
// 발송 제한(이메일 인증코드 전송)은 회원가입·로그인 2차 인증 모두 "이메일 계정 기준" 24시간
// 5회로 통일되어 있다 — 브라우저나 기기(fingerprint)가 달라져도 같은 이메일이면 같은 한도를
// 공유한다(회원가입 발송 시 fingerprintCode를 함께 보내지만, 이는 API 요청 파라미터일 뿐
// 발송 횟수 제한의 판단 기준은 아니다. src/api/auth.ts의 sendEmailVerificationCode JSDoc 참고).

export const EMAIL_SEND_LIMIT_MAX_ATTEMPTS = 5
export const EMAIL_SEND_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000

// ─── Login 2FA Verification Limit Rule ───────────────────────────────────────
// 로그인 2차 인증(authType: '1')의 인증코드 발송 제한은 회원가입과 동일하게 이메일 계정 기준
// 24시간 5회다(기기/브라우저 무관).

export const LOGIN_EMAIL_SEND_LIMIT_MAX_ATTEMPTS = 5
export const LOGIN_EMAIL_SEND_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000
