import type { ApiResponse } from '.'
import { api } from '.'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VerifyIdentityRequest {
  /** 포트원 본인인증 요청 시 발급된 인증 키 */
  identityVerificationId: string
}

export interface VerifyIdentityResult {
  /** 포트원 본인인증 자체의 성공 여부. false면 인증 실패(상태 비정상 또는 조회 실패)이며,
   *  이때는 다른 필드를 내려주지 않는다 */
  isVerified: boolean
  /** 이미 가입된 CI인지 여부. isVerified가 true일 때만 내려온다 */
  hasExistingAccount?: boolean
  /** 이미 가입된 계정이 있을 때, 마스킹 처리된 기존 계정 이메일 (예: 'fu******@gmail.com').
   *  신규 사용자면 내려오지 않는다 */
  existingEmail?: string
  /** 신규 사용자일 때, 마스킹 처리된 본인인증 이름 (예: '홍길*'). 이미 가입된 계정이 있으면 내려오지 않는다 */
  maskedName?: string
  /** 신규 사용자일 때, 마스킹 처리된 생년월일 (예: '2012-**-**', 연도만 노출).
   *  이미 가입된 계정이 있으면 내려오지 않는다 */
  maskedBirth?: string
  /** 신규 사용자일 때, 마스킹 처리된 휴대폰번호 (예: '010-**-5678'). 이미 가입된 계정이 있으면 내려오지 않는다 */
  maskedMobile?: string
  /** 신규 사용자일 때, 본인인증으로 확인된 성별. 이미 가입된 계정이 있으면 내려오지 않는다 */
  gender?: 'M' | 'F'
}

// ─── API ─────────────────────────────────────────────────────────────────────

/**
 * 본인인증 확인 — 포트원 본인인증 키(identityVerificationId)로 실제 인증 결과를 조회한다.
 * isVerified는 포트원 인증 자체의 성공 여부만 나타내며, 인증에 성공하면 hasExistingAccount로
 * CI 중복 여부를 함께 응답한다. 이미 가입된 CI면 마스킹된 기존 계정 이메일(existingEmail)을,
 * 신규 사용자면 마스킹된 이름/생년월일/휴대폰번호(maskedName/maskedBirth/maskedMobile)와
 * 성별(gender)을 함께 응답한다.
 * 회원가입 진행 중(로그인 전)에도 호출되므로 인증 불필요(skipAuth).
 */
export const verifyIdentity = (
  body: VerifyIdentityRequest
): Promise<ApiResponse<VerifyIdentityResult>> =>
  api.post<VerifyIdentityResult>('/v1/user/identity/verify', body, { skipAuth: true })

export interface SendEmailVerificationCodeRequest {
  /** 인증코드를 받을 이메일 주소 */
  email: string
  /** 인증코드 발송 목적. '0': 회원가입, '1': 로그인 2차 인증. 목적에 따라 메일 제목·템플릿과
   *  발송 횟수 제한 기준이 달라진다. 백엔드 DTO가 문자열 enum이라 숫자로 보내면
   *  400(유효성 검증 실패)이 나므로 반드시 문자열로 전달할 것 */
  authType: '0' | '1'
  /** 브라우저 핑거프린트 코드. 회원가입(authType: '0') 발송일 때만 필수이며, 이 값과 이메일의
   *  조합으로 같은 기기 기준 발송 횟수를 제한한다. 로그인 2차 인증(authType: '1') 발송에는
   *  사용하지 않는다(이메일만으로 제한) */
  fingerprintCode?: string
}

export interface SendEmailVerificationCodeData {
  /** 인증코드 발송 성공 여부 */
  success: boolean
}

/**
 * 이메일 인증코드 발송 — 입력한 이메일로 6자리 인증코드 발송을 요청한다. 회원가입 5단계
 * (이메일 인증)와 로그인 2차 인증(신규 기기 로그인) 두 화면에서 공용으로 사용하며, authType으로
 * 용도를 구분한다.
 * - 회원가입(authType: '0'): fingerprintCode 필수. 같은 이메일+fingerprintCode(동일 기기) 기준
 *   마지막 발송 후 24시간 안에 5회를 초과하면 실패한다.
 * - 로그인 2차 인증(authType: '1'): 같은 이메일 기준 마지막 발송 후 1시간 안에 5회를 초과하면
 *   실패한다.
 * 회원가입/로그인 진행 중(로그인 전)에도 호출되므로 인증 불필요(skipAuth).
 *
 * 에러 응답 — `request()`가 message 형태(배열/객체)를 통일해 첫 메시지를 `ApiError.message`에
 * 담아주므로, 호출 측은 아래 실제 문구가 그대로 `err.message`로 온다고 보면 된다:
 * - 400 (ValidationPipe/DTO 검증 실패, message는 `{ 필드명: [메시지] }` 객체): email 미입력 →
 *   '이메일을 입력해주세요', email 형식 오류 → '올바른 이메일 형식이 아닙니다', authType 미입력 →
 *   '인증 타입을 입력해주세요', authType이 '0'/'1'이 아님 → '인증 타입은 0(회원가입), 1(로그인
 *   2차 인증) 중 하나여야 합니다', fingerprintCode가 문자열이 아님 → '브라우저 지문 코드는
 *   문자열이어야 합니다'
 * - 400 (서비스 로직이 직접 던짐, message는 문자열 배열): authType이 '0'인데 fingerprintCode가
 *   없음 → '브라우저 지문 코드를 입력해주세요'
 * - 409: 발송 횟수(5회) 초과 → '인증코드 발송 횟수(5회)를 초과했습니다. 마지막 발송 후
 *   24시간이 지나면 다시 요청할 수 있습니다' (로그인 2차 인증은 '24시간'이 '1시간'으로 바뀐다)
 * - 500: 서버 오류(DB·메일 템플릿·SQS 발송 실패 등, 원인은 서버 로그에만 남고 클라이언트에는
 *   고정 메시지) → '서버 오류가 발생했습니다'
 */
export const sendEmailVerificationCode = (
  body: SendEmailVerificationCodeRequest
): Promise<ApiResponse<SendEmailVerificationCodeData>> =>
  api.post<SendEmailVerificationCodeData>('/v1/user/email/sendCode', body, { skipAuth: true })

export interface VerifyRegisterEmailCodeRequest {
  /** 인증코드를 받은 이메일 주소 */
  email: string
  /** 이메일로 받은 6자리 인증코드 */
  code: string
}

export interface VerifyRegisterEmailCodeData {
  /** 인증 성공 여부. 실패 시에는 에러로 응답하므로 항상 true */
  success: boolean
}

/**
 * 회원가입 5단계(이메일 인증) — 발송된 인증번호가 입력한 이메일과 일치하는지 확인한다.
 * 같은 이메일로 24시간 안에 5회 틀리면 24시간 동안 이메일 인증이 제한된다.
 * 회원가입 진행 중(로그인 전)에도 호출되므로 인증 불필요(skipAuth).
 */
export const verifyRegisterEmailCode = (
  body: VerifyRegisterEmailCodeRequest
): Promise<ApiResponse<VerifyRegisterEmailCodeData>> =>
  api.post<VerifyRegisterEmailCodeData>('/v1/user/email/verifyCode', body, { skipAuth: true })
