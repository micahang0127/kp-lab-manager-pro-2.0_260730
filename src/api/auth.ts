import type { TurnstileServerValidationErrorCode } from '@marsidev/react-turnstile'

import type { ApiResponse } from '.'
import { api } from '.'

// ─── Types ────────────────────────────────────────────────────────────────────

/** 로그인 요청을 보낸 실행 환경. 'W': 웹(PC), 'M': 모바일, 'T': 태블릿.
 *  로그인(login)과 2차 인증(loginVerifyDevice) 두 요청에 반드시 같은 값을 보내야 한다 */
export type LoginDevice = 'W' | 'M' | 'T'

export interface LoginRequest {
  email: string
  password: string
  /** 브라우저 식별 코드(useFingerprint) — 서버가 이 값으로 신규 브라우저 여부를 판단한다 */
  fingerprintCode: string
  device: LoginDevice
}

export interface LoginData {
  /** true면 신규(또는 지문이 바뀐) 브라우저 — accessToken 이하 필드는 내려오지 않으며, 이어서
   *  sendEmailVerificationCode(authType: '1') → loginVerifyDevice로 2차 인증을 진행해야 한다 */
  isNewDevice: boolean
  /** isNewDevice가 false일 때만 내려온다 */
  accessToken?: string
  userIdx?: string
  userName?: string
  orgIdx?: string
  orgName?: string
  userGrade?: number
}

export interface LoginVerifyDeviceRequest {
  email: string
  /** 1차 로그인에 사용한 비밀번호를 그대로 재전송한다 — 서버가 인증코드만으로 토큰을 발급하지
   *  않도록(코드 재사용 공격 방지) 비밀번호를 다시 검증한다 */
  password: string
  /** 이메일로 받은 6자리 인증코드 */
  code: string
  /** login 요청에 사용한 값과 동일해야 한다 */
  fingerprintCode: string
  device: LoginDevice
}

export interface LoginVerifyDeviceData {
  accessToken: string
  userIdx: string
  userName: string
  orgIdx: string
  orgName: string
  userGrade: number
}

export interface VerifyTurnstileRequest {
  /** Turnstile 위젯이 발급한 응답 토큰 (cf-turnstile-response) */
  token: string
}

export interface VerifyTurnstileResult {
  /** Cloudflare 서버 검증 성공 여부. 토큰 만료(발급 후 300초 경과) 또는 재사용(일회용) 시 false */
  isVerified: boolean
  /** isVerified가 false일 때 원인 코드 목록. Cloudflare siteverify 표준 에러 코드
   *  (@marsidev/react-turnstile의 TurnstileServerValidationErrorCode 참고) */
  errorCodes?: TurnstileServerValidationErrorCode[]
}

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
 * 로그인 — 이메일+비밀번호 1차 로그인. 인증 불필요(skipAuth). Turnstile 검증은 `verifyTurnstile`로
 * 로그인 전에 별도 처리하므로 body에는 포함하지 않는다. 신규(또는 지문이 바뀐) 브라우저로
 * 판단되면 `isNewDevice: true`만 내려오고(accessToken 등 나머지 필드 없음), 이 경우
 * 이메일 2차 인증(`sendEmailVerificationCode` → `loginVerifyDevice`) 단계로 진행해야 한다.
 * 등록된(신뢰) 브라우저면 `isNewDevice: false`와 함께 accessToken 등이 바로 내려온다.
 *
 * 실패 시 `request()`가 message 형태를 통일해 첫 메시지를 `ApiError.message`에 담아준다:
 * - 400 (ValidationPipe/DTO 검증 실패, message는 `{ 필드명: [메시지] }` 객체): email 미입력/형식
 *   오류, password 미입력/8자 미만/허용 문자 외 포함, fingerprintCode 미입력, device가
 *   W/M/T 외의 값
 * - 401 (서비스 로직이 직접 던짐, message는 문자열 배열):
 *   - 이미 잠긴 계정 → '로그인 실패 횟수를 초과하여 계정이 잠겨 있습니다. 잠금이 풀린 뒤 다시
 *     시도하거나 비밀번호 찾기로 재설정해주세요'
 *   - 존재하지 않는 이메일 → '이메일 또는 비밀번호가 올바르지 않습니다' (실패 카운트 누적 없음)
 *   - 비밀번호 불일치(잠금 전) → '이메일 또는 비밀번호가 올바르지 않습니다. 5회 연속 틀리면
 *     계정이 15분 잠깁니다 (남은 시도 N회). 비밀번호가 기억나지 않으면 비밀번호 찾기를
 *     이용해주세요'
 *   - 비밀번호 불일치로 이번 시도에 5회 도달(신규 잠김) → '로그인 실패 횟수를 초과하여 계정이
 *     15분 동안 잠겼습니다. 비밀번호 찾기로 비밀번호를 재설정해주세요'
 *   - 탈퇴한 회원 → '탈퇴한 회원입니다'
 *   - 신뢰 기기지만 소속 회사가 없거나 비활성화됨 → '소속된 회사가 없거나 비활성화된 계정입니다'
 */
export const login = (body: LoginRequest): Promise<ApiResponse<LoginData>> =>
  api.post<LoginData>('/v1/user/login', body, { skipAuth: true })

/**
 * 로그인 2차 인증(신규 브라우저) — 인증코드 검증 + 토큰 발급. 인증 불필요(skipAuth). 비밀번호를
 * 다시 요구하는 이유는 인증코드만으로 토큰이 발급되는 것을 막기 위함이다(코드 재사용 공격 방지).
 * login과 달리 이 API는 항상 토큰까지 발급되는 경우만 성공으로 응답한다(isNewDevice 필드 없음).
 *
 * 실패 시 `request()`가 message 형태를 통일해 첫 메시지를 `ApiError.message`에 담아준다:
 * - 400 (ValidationPipe/DTO 검증 실패, message는 `{ 필드명: [메시지] }` 객체): email 미입력/형식
 *   오류, password 미입력/8자 미만/허용 문자 외 포함, code 미입력/문자열 아님, fingerprintCode
 *   미입력, device가 W/M/T 외의 값
 * - 401 — 비밀번호 검증 단계(login과 완전히 동일한 실패 카운터 공유): 이미 잠긴 계정 / 존재하지
 *   않는 이메일 / 비밀번호 불일치(잠금 전, 남은 시도 N회) / 비밀번호 불일치로 신규 잠김 /
 *   탈퇴한 회원 — 문구는 login의 401 목록과 동일
 * - 401 — 인증코드 검증 단계(비밀번호는 통과한 뒤):
 *   - 유효한(미사용) 인증코드 자체가 없음 → '인증코드를 다시 요청해주세요'
 *   - 발급 후 30분 경과(만료) → '인증코드가 만료되었습니다. 인증코드를 다시 요청해주세요'
 *   - 이 코드에 대한 오입력이 이미 5회 도달 / 이번 오입력으로 5회 도달 →
 *     '인증코드를 5회 잘못 입력했습니다. 인증코드를 다시 요청해주세요'
 *   - 코드 불일치, 아직 여유 있음 → '인증코드가 올바르지 않습니다 (남은 시도 N회)'
 * - 401 — 토큰 발급 단계: 비밀번호·인증코드 모두 통과했지만 소속 회사가 없거나 비활성화됨 →
 *   '소속된 회사가 없거나 비활성화된 계정입니다'
 */
export const loginVerifyDevice = (
  body: LoginVerifyDeviceRequest
): Promise<ApiResponse<LoginVerifyDeviceData>> =>
  api.post<LoginVerifyDeviceData>('/v1/user/login/verify-device', body, { skipAuth: true })

/**
 * Turnstile 토큰 검증 — 클라이언트가 위젯에서 발급받은 토큰(cf-turnstile-response)을 서버가
 * Cloudflare에 검증한다. 로그인 전에 호출하므로 인증 불필요(skipAuth). 토큰은 일회용이며 발급 후
 * 300초가 지나면 만료되고, 만료/재사용 시 isVerified가 false로 내려온다. Cloudflare와 통신 자체가
 * 실패하면 502 에러가 발생한다 (공통 api 클라이언트가 ApiError로 throw).
 */
export const verifyTurnstile = (
  body: VerifyTurnstileRequest
): Promise<ApiResponse<VerifyTurnstileResult>> =>
  api.post<VerifyTurnstileResult>('/v1/user/turnstile/verify', body, { skipAuth: true })

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
  /** 인증코드 발송 목적. '0': 회원가입, '1': 로그인 2차 인증. 목적에 따라 메일 제목·템플릿이
   *  달라진다. 발송 횟수 제한(24시간 5회)은 이메일 계정 기준으로 두 목적 모두 동일하다.
   *  백엔드 DTO가 문자열 enum이라 숫자로 보내면 400(유효성 검증 실패)이 나므로 반드시 문자열로
   *  전달할 것 */
  authType: '0' | '1'
  /** 브라우저 핑거프린트 코드. 회원가입(authType: '0') 발송일 때만 필수 파라미터다(누락 시 400).
   *  다만 발송 횟수 제한은 이메일 계정 기준(기기/브라우저 무관)이라 이 값 자체가 제한 판단에
   *  쓰이지는 않는다. 로그인 2차 인증(authType: '1') 발송에는 필요하지 않다 */
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
 * - 회원가입(authType: '0'): fingerprintCode가 요청 파라미터로 필수다(누락 시 400). 발송 횟수
 *   제한 자체는 같은 이메일 계정 기준(기기/브라우저 무관)으로 마지막 발송 후 24시간 안에 5회를
 *   초과하면 실패한다.
 * - 로그인 2차 인증(authType: '1'): 같은 이메일 계정 기준으로 마지막 발송 후 24시간 안에 5회를
 *   초과하면 실패한다(fingerprintCode 불필요).
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
 *   24시간이 지나면 다시 요청할 수 있습니다' (회원가입/로그인 2차 인증 모두 동일한 문구)
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
