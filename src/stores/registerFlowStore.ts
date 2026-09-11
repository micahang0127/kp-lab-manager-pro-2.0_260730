import { create } from 'zustand'

import type { VerifyIdentityResult } from '../api/auth'
import type { BusinessRegistrationReviewData } from '../api/file'
import type { InvitedOrg } from '../api/user'

// ─── Types ────────────────────────────────────────────────────────────────────

export type RegisterMethod = 'existing' | 'new'

/** 본인인증이 어디서 완료됐는지 — 2단계(본인인증)를 건너뛸 근거를 판단하는 값.
 *  'register'는 회원가입 2단계에서 직접, 'find-account'는 아이디·비밀번호 찾기에서 완료한 경우다 */
export type IdentityVerifySource = 'register' | 'find-account'

export interface TermsAgreement {
  /** 마케팅 정보 수신 동의(선택) 여부. 필수 약관(이용약관/개인정보 수집·이용)은 모두 동의해야만
   *  다음 단계로 넘어올 수 있어 항상 true이므로 별도로 저장하지 않는다 */
  marketingOptIn: boolean
}

interface RegisterFlowState {
  registerMethod: RegisterMethod | null
  setRegisterMethod: (method: RegisterMethod) => void
  clearRegisterMethod: () => void
  /** 2단계(본인인증) 완료 시 백엔드로부터 받은 확인 결과 — 3단계(가입 여부 안내)에서 사용 */
  identityVerifyResult: VerifyIdentityResult | null
  /** 위 identityVerifyResult를 어디서 받아왔는지. **2단계를 건너뛸 근거는 identityVerifyResult의
   *  존재 여부가 아니라 이 필드다** — 아이디·비밀번호 찾기에서 이미 인증을 마치고 넘어온 경우
   *  ('find-account')에만 2·3단계를 건너뛴다. 정상 플로우에서 2단계를 마친 뒤 "← 이전"으로
   *  1단계까지 되돌아온 경우('register')는 결과가 남아있어도 순서대로 2단계를 다시 거쳐야 하므로,
   *  결과 자체로 스킵을 판단하면 두 경우를 구분할 수 없다.
   *  setIdentityVerifyResult의 두 번째 인자로만 채워져 결과와 항상 함께 갱신된다 */
  identityVerifySource: IdentityVerifySource | null
  setIdentityVerifyResult: (result: VerifyIdentityResult, source: IdentityVerifySource) => void
  clearIdentityVerifyResult: () => void
  /** 2단계(본인인증) 완료 시 PortOne 본인인증 요청에 사용한 인증 키(identityVerificationId) —
   *  최종 회원가입 제출(signUp) API의 verificationCode 파라미터로 그대로 재사용한다 */
  identityVerificationCode: string | null
  setIdentityVerificationCode: (code: string) => void
  clearIdentityVerificationCode: () => void
  /** 4단계(이용약관 동의) 완료 여부 — null이면 아직 동의하지 않은 상태(5단계 라우트 가드에서 사용) */
  termsAgreement: TermsAgreement | null
  setTermsAgreement: (agreement: TermsAgreement) => void
  clearTermsAgreement: () => void
  /** 5단계(이메일 인증) 완료 시 인증된 이메일 — 이후 회원가입 정보 입력 단계에서 사용 */
  registerEmail: string | null
  setRegisterEmail: (email: string) => void
  clearRegisterEmail: () => void
  /** 5단계(이메일 인증) 완료 시 인증에 성공한 6자리 인증코드 — registerEmail과 항상 함께 채워진다.
   *  최종 회원가입 제출(signUp) API의 code 파라미터로 그대로 재사용한다 — 서버가 email+code
   *  조합으로 이메일 인증(SIGNUP 타입) 완료 이력을 다시 확인하므로, 실제로 인증에 성공했던
   *  코드 그대로여야 한다 */
  registerEmailCode: string | null
  setRegisterEmailCode: (code: string) => void
  clearRegisterEmailCode: () => void
  /** 5단계(이메일 인증) 완료 직후 조회한, 내 이메일로 온 초대 조직 목록 — null이면 아직 조회하지
   *  않았거나 조회에 실패한 상태(7단계에서는 빈 배열과 동일하게 "초대 없음"으로 간주한다).
   *  7단계(새 조직 등록/기존 조직 가입 선택)에서 화면 분기와 최종 제출(signUp)에 사용한다 */
  invitedOrgs: InvitedOrg[] | null
  setInvitedOrgs: (invitedOrgs: InvitedOrg[]) => void
  clearInvitedOrgs: () => void
  /** 6단계(비밀번호 설정) 완료 시 입력한 비밀번호 — 최종 회원가입 제출 단계에서 사용 */
  registerPassword: string | null
  setRegisterPassword: (password: string) => void
  clearRegisterPassword: () => void
  /** 7단계(새 조직 등록) 완료 시 업로드한 사업자등록증 PDF 파일 — 최종 회원가입 제출 단계에서 사용.
   *  registerMethod가 'new'일 때만 채워진다 */
  businessRegistrationFile: File | null
  setBusinessRegistrationFile: (file: File) => void
  clearBusinessRegistrationFile: () => void
  /** 7단계 완료 시 사업자등록증 PDF를 분석한 결과(법인명·사업자등록번호 등) — 최종 회원가입
   *  제출 단계에서 조직 정보로 사용 예정 */
  businessRegistrationReview: BusinessRegistrationReviewData | null
  setBusinessRegistrationReview: (review: BusinessRegistrationReviewData) => void
  clearBusinessRegistrationReview: () => void
  /** 7단계 완료 시 이미 S3에 업로드된 사업자등록증 PDF의 키 — 8단계(최종 제출) API가 나오면
   *  파일을 재업로드하지 않고 이 값을 그대로 재사용한다 */
  businessRegistrationS3Key: string | null
  setBusinessRegistrationS3Key: (s3Key: string) => void
  clearBusinessRegistrationS3Key: () => void
  /** 회원가입 플로우의 모든 단계 값을 초기 상태로 되돌린다 — "지금부터 새로 시작하는 회원가입"
   *  진입 지점(로그인 페이지의 "회원가입" 버튼, 아이디·비밀번호 찾기의 "회원가입 계속")과
   *  가입 완료 후처리에서 사용한다. 이 store는 persist하지 않지만 새로고침 없이 화면만 오가면
   *  값이 그대로 남기 때문에, 초기화하지 않으면 이전 시도의 identityVerifySource가 재사용되어
   *  2단계(본인인증)를 건너뛰게 된다 */
  resetRegisterFlow: () => void
}

// ─── Initial State ────────────────────────────────────────────────────────────

/**
 * 각 단계 값의 초기 상태. store 생성 시점과 resetRegisterFlow()가 같은 값을 공유하기 위해
 * 상수로 분리했다 — RegisterFlowState에 새 값을 추가하면 여기에도 추가해야 하며, 빠뜨리면
 * 아래 create<RegisterFlowState>에서 타입 에러가 나므로 초기화 누락이 컴파일 단계에서 잡힌다.
 */
const INITIAL_DATA = {
  registerMethod: null,
  identityVerifyResult: null,
  identityVerifySource: null,
  identityVerificationCode: null,
  termsAgreement: null,
  registerEmail: null,
  registerEmailCode: null,
  invitedOrgs: null,
  registerPassword: null,
  businessRegistrationFile: null,
  businessRegistrationReview: null,
  businessRegistrationS3Key: null,
} satisfies Partial<RegisterFlowState>

// ─── Store ────────────────────────────────────────────────────────────────────

/**
 * 회원가입 1단계(가입 방법 선택) → 2단계(본인인증) → 3단계(가입 여부 안내) →
 * 4단계(이용약관 동의) → 5단계(이메일 인증) → 6단계(비밀번호 설정) → 7단계(새 조직 등록,
 * registerMethod가 'new'인 경우) 사이에서 각 단계의 선택/입력 결과를 전달하는 store.
 * 의도적으로 persist하지 않는다 — 새로고침하면 진행 중인 가입 플로우가 초기화되어
 * 1단계(`/register`)로 돌아가는 것이 기존 로그인 플로우(loginFlowStore)와 동일한 정책이다.
 */
export const useRegisterFlowStore = create<RegisterFlowState>((set) => ({
  ...INITIAL_DATA,
  setRegisterMethod: (method) => set({ registerMethod: method }),
  clearRegisterMethod: () => set({ registerMethod: null }),
  setIdentityVerifyResult: (result, source) =>
    set({ identityVerifyResult: result, identityVerifySource: source }),
  clearIdentityVerifyResult: () => set({ identityVerifyResult: null, identityVerifySource: null }),
  setIdentityVerificationCode: (code) => set({ identityVerificationCode: code }),
  clearIdentityVerificationCode: () => set({ identityVerificationCode: null }),
  setTermsAgreement: (agreement) => set({ termsAgreement: agreement }),
  clearTermsAgreement: () => set({ termsAgreement: null }),
  setRegisterEmail: (email) => set({ registerEmail: email }),
  clearRegisterEmail: () => set({ registerEmail: null }),
  setRegisterEmailCode: (code) => set({ registerEmailCode: code }),
  clearRegisterEmailCode: () => set({ registerEmailCode: null }),
  setInvitedOrgs: (invitedOrgs) => set({ invitedOrgs }),
  clearInvitedOrgs: () => set({ invitedOrgs: null }),
  setRegisterPassword: (password) => set({ registerPassword: password }),
  clearRegisterPassword: () => set({ registerPassword: null }),
  setBusinessRegistrationFile: (file) => set({ businessRegistrationFile: file }),
  clearBusinessRegistrationFile: () => set({ businessRegistrationFile: null }),
  setBusinessRegistrationReview: (review) => set({ businessRegistrationReview: review }),
  clearBusinessRegistrationReview: () => set({ businessRegistrationReview: null }),
  setBusinessRegistrationS3Key: (s3Key) => set({ businessRegistrationS3Key: s3Key }),
  clearBusinessRegistrationS3Key: () => set({ businessRegistrationS3Key: null }),
  resetRegisterFlow: () => set({ ...INITIAL_DATA }),
}))
