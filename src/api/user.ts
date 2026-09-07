import type { TurnstileServerValidationErrorCode } from '@marsidev/react-turnstile'

import type { ApiResponse } from '.'
import { api } from '.'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginData {
  type: 'T' | 'O'
  token?: string
}

export interface EmailVerificationLoginRequest {
  email: string
  code: string
}

export interface EmailVerificationLoginData {
  token: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
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

export interface FingerprintData {
  /** 브라우저 식별용 핑거프린트 코드 */
  fingerprintCode: string
}

export interface SignUpRequest {
  /** 가입할 이메일 주소 — 회원가입 5단계(이메일 인증)에서 인증 완료한 이메일 */
  email: string
  /** 로그인 비밀번호. 최소 8자리 이상, 영문과 숫자를 모두 포함해야 하며 작은따옴표(')는 사용 불가 */
  password: string
  /** 포트원 본인인증 요청 시 발급된 인증 키(identityVerificationId) */
  verificationCode: string
  /** 가입할 회사 아이디 — "기존 조직에 가입"일 때 사용. regFile과 정확히 하나만 입력해야 함(XOR) */
  orgIdx?: number
  /** 가입할 초대 아이디 — orgIdx로 가입할 때(기존 조직에 가입) 반드시 함께 입력해야 함 */
  invitedIdx?: number
  /** 사업자 등록증 파일 S3 키 — "새 조직 만들기"일 때 사용. orgIdx와 정확히 하나만 입력해야 함(XOR) */
  regFile?: string
  /** 사업자명(회사명) — regFile과 함께 사용 */
  orgName?: string
  /** 사업자 등록 번호 — regFile과 함께 사용 */
  regNo?: string
  /** 대표자명 — regFile과 함께 사용 */
  ceoName?: string
  /** 사업장 주소 — regFile과 함께 사용 */
  address?: string
  /** 업종 — regFile과 함께 사용 */
  bizItem?: string
  /** 업태 — regFile과 함께 사용 */
  bizType?: string
}

export interface SignUpData {
  /** 생성된 회원 아이디 */
  userIdx: string
  /** 가입한 이메일 주소 */
  email: string
}

export interface CheckEmailDuplicateRequest {
  /** 중복 확인할 이메일 주소 */
  email: string
}

export interface CheckEmailDuplicateData {
  /** 이메일 중복 여부. true면 이미 가입된 이메일 */
  isDuplicated: boolean
}

export interface InvitedOrg {
  /** 초대 아이디 — "기존 조직에 가입" 최종 제출(signUp)의 invitedIdx로 그대로 전달한다 */
  invitedIdx: string
  /** 초대받은 조직 아이디 — "기존 조직에 가입" 최종 제출(signUp)의 orgIdx로 그대로 전달한다 */
  orgIdx: string
  /** 초대받은 조직명 */
  orgName: string
  /** 초대받은 조직 내 등급(백엔드 UserGrade enum 값, 예: 'MEMBER') */
  orgGrade: string
  /** 초대 일시 (ISO 8601, UTC) */
  invitedAt: string
}

export interface GetInvitedOrgsRequest {
  /** 이메일 인증(verifyRegisterEmailCode)에 사용한 이메일과 동일해야 한다 */
  email: string
  /** 이메일 인증에 사용한 6자리 인증코드 — 서버가 이 email+code 조합으로 인증 완료 이력을 확인한다 */
  code: string
}

export interface GetInvitedOrgsData {
  /** 내 이메일로 온 대기중인(PENDING) 초대 목록. 없으면 빈 배열 */
  invites: InvitedOrg[]
}

// ─── API ─────────────────────────────────────────────────────────────────────

/**
 * 로그인 — 인증 불필요(skipAuth). Turnstile 검증은 `verifyTurnstile`로 로그인 전에 별도 처리하므로
 * body에는 이메일/비밀번호만 포함한다. 신규 기기(브라우저) + 신규 이메일 조합으로 판단되면 응답
 * `type: 'O'`가 내려오며, 이 경우 이메일 2차 인증 단계로 진행한다.
 */
export const login = (body: LoginRequest): Promise<ApiResponse<LoginData>> =>
  api.post<LoginData>('/user/login', body, { skipAuth: true })

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

/** 이메일 인증번호 로그인 — 인증 불필요(skipAuth) */
export const loginWithEmailVerificationCode = (
  body: EmailVerificationLoginRequest
): Promise<ApiResponse<EmailVerificationLoginData>> =>
  api.post<EmailVerificationLoginData>('/user/email-verification-login', body, {
    skipAuth: true,
  })

/** 회원탈퇴 */
export const withdraw = (): Promise<ApiResponse<boolean>> => api.delete('/auth/withdraw')

/** 비밀번호 변경 */
export const changePassword = (body: ChangePasswordRequest): Promise<ApiResponse<boolean>> =>
  api.patch('/auth/password', body)

/**
 * 브라우저 핑거프린트 발급 — 인증 불필요(skipAuth). 새 브라우저를 식별하기 위한 코드를
 * 백엔드에서 발급받는다(서버는 발급만 하고 저장하지 않으므로 클라이언트가 직접 보관해야 함).
 * 발급된 코드는 쿠키에 저장해 재사용하며(`useFingerprint` 참고), 회원가입 이메일 인증 발송
 * 횟수 제한·로그인 신규 기기 판단에 사용한다.
 */
export const issueFingerprint = (): Promise<ApiResponse<FingerprintData>> =>
  api.get<FingerprintData>('/v1/user/fingerprint', { skipAuth: true })

/**
 * 이메일 중복 확인 — 입력한 이메일이 이미 가입된 이메일인지 확인한다. 회원가입 5단계
 * (이메일 인증)에서 인증번호 전송 요청 전에 먼저 호출해, 이미 가입된 이메일이면 인증번호를
 * 보내지 않고 바로 안내한다. 회원가입 진행 중(로그인 전)에도 호출되므로 인증 불필요(skipAuth).
 * 이미 가입된 이메일이어도 요청 자체는 성공(2xx, result: true)으로 응답하며 isDuplicated로만
 * 결과를 구분한다 — 성공 응답의 message는 항상 빈 배열이라 서버가 안내 문구를 별도로 내려주지
 * 않으므로, 중복 시 보여줄 문구는 호출 측에서 직접 구성해야 한다.
 * 400 (ValidationPipe/DTO 검증 실패): email 형식 오류 등 필드별 메시지
 */
export const checkEmailDuplicate = (
  body: CheckEmailDuplicateRequest
): Promise<ApiResponse<CheckEmailDuplicateData>> =>
  api.post<CheckEmailDuplicateData>('/v1/user/email/duplicate', body, { skipAuth: true })

/**
 * 내 이메일로 온 초대 조직 조회 — 회원가입 5단계(이메일 인증) 성공 직후 호출한다. 전달한
 * email+code 조합으로 서버가 이메일 인증 완료 이력을 다시 확인하므로, 반드시 방금 성공한
 * verifyRegisterEmailCode 호출에 쓴 값을 그대로 전달해야 한다. 회원가입 진행 중(로그인 전)에도
 * 호출되므로 인증 불필요(skipAuth). `@Post()`의 Nest 기본 상태코드라 성공 시에도 201로 응답한다.
 * 대기중(PENDING)인 초대가 없으면 invites는 빈 배열로 내려온다.
 *
 * 실패 시 `request()`가 message 형태를 통일해 첫 메시지를 `ApiError.message`에 담아준다:
 * - 400 (ValidationPipe/DTO 검증 실패, message는 `{ 필드명: [메시지] }` 객체): email/code 누락·형식 오류
 * - 401 (서비스 로직이 직접 던짐, message는 문자열 배열): 해당 email+code 조합으로 이메일 인증을
 *   완료한 이력이 없음 → '이메일 인증을 먼저 완료해주세요'
 * - 500: 예상치 못한 서버 오류 → '서버 오류가 발생했습니다'
 */
export const getInvitedOrgs = (
  body: GetInvitedOrgsRequest
): Promise<ApiResponse<GetInvitedOrgsData>> =>
  api.post<GetInvitedOrgsData>('/v1/user/invite/me', body, { skipAuth: true })

/**
 * signUp 요청의 조직 선택 조합을 검증한다 — orgIdx(기존 조직에 가입)와 regFile(새 조직 만들기)은
 * 정확히 하나만 입력해야 하며(XOR), orgIdx로 가입할 때는 invitedIdx를 반드시 함께 입력해야 한다.
 * 서버도 동일 규칙을 400으로 검증하지만, 잘못된 조합을 네트워크 요청 전에 즉시 잡아 개발 단계에서
 * 빠르게 드러나도록 클라이언트에서도 가드한다. 위반 시 사유를 담은 Error를, 정상이면 null을 반환한다.
 */
const validateOrgSelection = (body: SignUpRequest): Error | null => {
  const hasOrgIdx = body.orgIdx !== undefined
  const hasRegFile = body.regFile !== undefined
  if (hasOrgIdx === hasRegFile) {
    return new Error(
      'orgIdx(기존 조직에 가입)와 regFile(새 조직 만들기) 중 정확히 하나만 입력해야 합니다.'
    )
  }

  const hasInvitedIdx = body.invitedIdx !== undefined
  if (hasOrgIdx !== hasInvitedIdx) {
    return new Error('orgIdx로 가입할 때는 invitedIdx를 반드시 함께 입력해야 합니다.')
  }

  return null
}

/**
 * 회원가입 최종 제출 — 인증 불필요(skipAuth). 회원가입 플로우 전 단계(본인인증·이메일 인증·
 * 비밀번호 설정·조직 정보)에서 모은 값을 한 번에 제출해 계정을 생성한다.
 * orgIdx(기존 조직에 가입)와 regFile(새 조직 만들기)은 정확히 하나만 보내야 하며(XOR),
 * orgIdx로 가입할 때는 invitedIdx를 함께 보내야 한다 — 잘못된 조합은 요청 전 클라이언트에서
 * 먼저 걸러지며(validateOrgSelection), 이를 통과해도 서버가 다시 한번 검증한다.
 * 성공해도 토큰은 내려주지 않으므로, 가입 완료 후에는 로그인 페이지로 이동해 별도로 로그인해야 한다.
 *
 * 실패 시 회원은 생성되지 않으며(data는 세 경우 모두 null), `request()`가 message 형태를
 * 통일해 첫 메시지를 `ApiError.message`에 담아주므로 호출 측은 `err.message`만 쓰면 된다:
 * - 400 (ValidationPipe/DTO 검증 실패, message는 `{ 필드명: [메시지] }` 객체): email/password/
 *   verificationCode 누락·형식 오류, orgIdx/invitedIdx가 정수가 아님 등 — 어긴 필드만 담겨온다
 * - 409 (ConflictException, message는 문자열 배열 — 아래 표의 메시지 중 하나):
 *   - orgIdx·regFile 둘 다 입력 또는 둘 다 미입력(XOR 위반) → '회사 아이디와 사업자 등록증 파일
 *     키 중 하나만 입력해주세요'
 *   - regFile은 입력했는데 orgName/ceoName/regNo 중 하나라도 빠짐 → '파일 키를 입력하면
 *     사업자명, 대표자명, 사업자 등록 번호를 모두 입력해야 합니다'
 *   - orgIdx는 입력했는데 invitedIdx가 없음 → '가입할 초대 아이디를 입력해주세요'
 *   - 포트원 본인인증 결과가 VERIFIED가 아님 → '본인인증에 실패했습니다'
 *   - 이미 같은 이메일 또는 같은 CI로 가입된 사용자가 있음 → '이미 가입된 사용자입니다'
 *   - invitedIdx+orgIdx+email 조합으로 대기중(PENDING) 초대를 찾지 못함(초대 도용 포함) →
 *     '유효하지 않은 초대입니다' 계열 메시지
 *   - 초대는 유효하지만 해당 orgIdx의 회사를 찾을 수 없음 → '존재하지 않는 회사입니다'
 * - 500: 포트원 본인인증 조회(axios) 실패 등 예상하지 못한 런타임 예외 — 원인은 서버 로그에만
 *   남고 고정 메시지만 내려온다 → '서버 오류가 발생했습니다'
 */
export const signUp = (body: SignUpRequest): Promise<ApiResponse<SignUpData>> => {
  // 다른 실패 경로(400 등)와 동일하게 항상 rejected Promise로 알려주기 위해, 동기 throw 대신
  // Promise.reject로 감싼다 — 호출 측이 try/catch 없이 .catch()/await만으로 일관되게 처리 가능.
  const orgSelectionError = validateOrgSelection(body)
  if (orgSelectionError) {
    return Promise.reject(orgSelectionError)
  }
  return api.post<SignUpData>('/v1/user/signUp', body, { skipAuth: true })
}
