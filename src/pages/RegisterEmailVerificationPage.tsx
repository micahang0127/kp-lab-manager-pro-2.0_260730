import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'

import { ApiError } from '../api'
import { sendEmailVerificationCode, verifyRegisterEmailCode } from '../api/auth'
import { checkEmailDuplicate, getInvitedOrgs } from '../api/user'
import checkCircleIcon from '../assets/icons/register/check-circle.svg'
import { EmailVerificationField, useEmailVerification } from '../components/emailVerification'
import {
  formatLimitWindowHours,
  isAttemptLimitExceeded,
  useEmailVerificationLimitStore,
} from '../stores/emailVerificationLimitStore'
import { useRegisterFlowStore } from '../stores/registerFlowStore'
import {
  EMAIL_DUPLICATE_MESSAGE,
  EMAIL_SEND_LIMIT_MAX_ATTEMPTS,
  EMAIL_SEND_LIMIT_WINDOW_MS,
  EMAIL_VERIFY_FAIL_LIMIT_MAX_ATTEMPTS,
  EMAIL_VERIFY_FAIL_LIMIT_WINDOW_MS,
  isValidEmailCode,
} from '../utils/rules/validationRules'
import { useFingerprint } from '../utils/useFingerprint'

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * 회원가입 5단계 — 이메일 인증.
 * 4단계(이용약관 동의) 완료 후 진입한다. 이메일을 입력해 인증번호 전송을 요청하고,
 * 발송된 6자리 인증번호를 입력해 확인하면 registerFlowStore에 인증된 이메일을 저장하고
 * 6단계(비밀번호 설정)로 이동한다. 인증 성공 직후에는 내 이메일로 온 초대 조직도 함께 조회해
 * registerFlowStore에 저장한다(7단계 화면 분기에 사용).
 */
export function RegisterEmailVerificationPage() {
  const navigate = useNavigate()
  const registerEmailInStore = useRegisterFlowStore((s) => s.registerEmail)
  const setRegisterEmail = useRegisterFlowStore((s) => s.setRegisterEmail)
  const setInvitedOrgs = useRegisterFlowStore((s) => s.setInvitedOrgs)

  // 회원가입(authType: '0') 인증코드 발송은 이 값+이메일 조합으로 발송 횟수(24시간 5회)를
  // 제한하므로 필수다. 쿠키에 없으면 useFingerprint가 마운트 시 자동으로 발급받는다.
  const fingerprintCode = useFingerprint()

  const verification = useEmailVerification({
    // '이전' 버튼으로 되돌아온 경우, 이미 인증에 성공해 store에 저장된 이메일이 있으면 입력칸에
    // 복원한다. 인증번호는 시간 제한이 있는 1회용 값이라 복원하지 않으며, 재전송 후 다시
    // 입력해야 한다
    initialEmail: registerEmailInStore ?? '',
    // 인증번호 발송 전에 이메일 중복 여부를 먼저 확인한다 — 이미 가입된 이메일이면 인증번호를
    // 보내지 않고 바로 안내한다. checkEmailDuplicate는 중복이어도 요청 자체는 성공(2xx)으로
    // 응답하고 서버가 안내 문구를 내려주지 않으므로(성공 응답의 message는 항상 빈 배열),
    // EMAIL_DUPLICATE_MESSAGE로 직접 에러를 만들어 던진다 — useEmailVerification 훅이 이를
    // sendCodeError로 잡아 이메일 입력칸 아래에 표시한다.
    sendCode: async (email) => {
      const { data } = await checkEmailDuplicate({ email })
      if (data?.isDuplicated) {
        throw new Error(EMAIL_DUPLICATE_MESSAGE)
      }
      return sendEmailVerificationCode({
        email,
        authType: '0',
        fingerprintCode: fingerprintCode ?? undefined,
      })
    },
    sendLimit: {
      purpose: 'register-send',
      maxAttempts: EMAIL_SEND_LIMIT_MAX_ATTEMPTS,
      windowMs: EMAIL_SEND_LIMIT_WINDOW_MS,
    },
  })
  const { email, emailCode, isCodeSent, isCodeExpired, sendSuccessCount } = verification

  // 인증번호 확인(검증) 실패 5회 제한 — 실제 방어는 서버가 담당하며(24시간 5회 초과 시 이메일
  // 인증 자체가 제한됨, src/api/auth.ts 참고), 이건 서버가 잔여 횟수를 응답으로 내려주지 않는
  // 상황에서 프론트가 로컬로 추정해 한도 초과가 확실한 시도를 API 호출 전에 막는 보조 가드다.
  const limitRecords = useEmailVerificationLimitStore((s) => s.records)
  const recordVerifyFailAttempt = useEmailVerificationLimitStore((s) => s.recordAttempt)
  const resetVerifyFailAttemptsForNewCode = useEmailVerificationLimitStore(
    (s) => s.resetAttemptsForNewCode
  )
  // 인증번호가 실제로 발송되어 "현재 활성화된 인증번호"가 있을 때만 잠금 여부를 검사한다.
  // isCodeSent 이전(예: 재전송을 아직 누르지 않은 새 화면, 또는 이메일을 막 입력한 시점)에는
  // 아직 검증을 시도할 대상 코드 자체가 없으므로, 예전에 잠겼던 기록이 쿠키에 남아있더라도
  // 이 단계에서는 보여주지 않는다 — 그렇지 않으면 재전송으로 잠금이 풀리기 전에 이메일만
  // 입력해도 잠깐 초과 문구가 먼저 떠 보이는 문제가 생긴다.
  const isVerifyLimitExceeded =
    isCodeSent &&
    isAttemptLimitExceeded(
      limitRecords,
      'register-verify-fail',
      email,
      EMAIL_VERIFY_FAIL_LIMIT_MAX_ATTEMPTS,
      EMAIL_VERIFY_FAIL_LIMIT_WINDOW_MS
    )

  // 인증 실패 카운트는 "현재 발급된 인증번호" 단위로만 관리된다 — 새 인증번호가 발급될
  // 때마다(최초 전송/재전송 모두 sendSuccessCount 증가) 이전 인증번호에 대한 실패 기록은
  // 무조건 지우고 다시 처음부터 셀 수 있다. 이 effect는 반드시 "새 인증번호가 실제로
  // 발급된 시점"(sendSuccessCount 증가)에만 반응해야 하며, 이메일을 입력/수정하는 것만으로는
  // 리셋되면 안 되므로 email은 의존성 배열에 넣지 않고 ref로 최신 값만 읽는다(넣으면 아직
  // 재전송하지 않았는데도 이전에 잠긴 이메일을 다시 입력하는 것만으로 잠금이 풀려버린다).
  const emailRef = useRef(email)
  useEffect(() => {
    emailRef.current = email
  }, [email])

  useEffect(() => {
    resetVerifyFailAttemptsForNewCode('register-verify-fail', emailRef.current)
  }, [sendSuccessCount, resetVerifyFailAttemptsForNewCode])

  // ─── Mutation ──────────────────────────────────────────────────────────────────

  // 인증번호 확인 성공 직후 내 이메일로 온 초대 조직을 조회해 registerFlowStore에 저장한다.
  // 7단계(새 조직 등록/기존 조직 가입)에서 이 값으로 화면을 분기하지만, 사용자가 그 화면에
  // 도달하기까지 비밀번호 설정 등 여러 단계를 더 거치므로 여기서는 navigate를 막지 않고
  // 백그라운드로만 호출한다. 조회에 실패해도(네트워크 오류 등) registerFlowStore.invitedOrgs는
  // null로 남아 7단계에서 빈 배열과 동일하게 "초대 없음"으로 처리되므로 회원가입 자체를 막지 않는다.
  const invitedOrgsMutation = useMutation({
    mutationFn: () => getInvitedOrgs({ email, code: emailCode }),
    onSuccess: (res) => {
      setInvitedOrgs(res.data?.invites ?? [])
    },
  })

  const verifyCodeMutation = useMutation({
    mutationFn: () => verifyRegisterEmailCode({ email, code: emailCode }),
    onSuccess: (res) => {
      if (!res.data?.success) return
      setRegisterEmail(email)
      invitedOrgsMutation.mutate()
      void navigate({ to: '/register-password' })
    },
    onError: (err) => {
      // 서버가 실제로 인증번호를 거부한 경우(ApiError)만 실패 횟수에 반영한다. 네트워크
      // 단절·타임아웃(ApiError가 아닌 일반 Error)까지 카운트하면, 코드를 맞게 입력했는데도
      // 일시적 오류가 반복되는 것만으로 24시간 잠금(EMAIL_VERIFY_FAIL_LIMIT_MAX_ATTEMPTS)에
      // 도달할 수 있기 때문이다.
      if (err instanceof ApiError) {
        recordVerifyFailAttempt('register-verify-fail', email, EMAIL_VERIFY_FAIL_LIMIT_WINDOW_MS)
      }
    },
  })

  // 이전 확인 실패 상태(에러 메시지 + 입력칸 빨간 강조)가 그대로 남아있던 문제를 막기 위해,
  // 아래 두 경우 모두 이전 검증 실패 상태를 초기화한다
  // 1) 인증번호를 다시 보냄 (이메일을 새로 입력해 최초 전송하거나 "재전송" 버튼을 누르거나)
  // 2) 인증번호를 다시 입력하기 시작함 (틀린 코드를 지우고 새로 입력)
  const { reset: resetVerifyCode } = verifyCodeMutation
  useEffect(() => {
    resetVerifyCode()
  }, [sendSuccessCount, emailCode, resetVerifyCode])

  // ─── Event Handlers ───────────────────────────────────────────────────────────

  const canSubmitCode =
    isCodeSent &&
    isValidEmailCode(emailCode) &&
    !isCodeExpired &&
    !isVerifyLimitExceeded &&
    !verifyCodeMutation.isPending

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!canSubmitCode) return
    verifyCodeMutation.mutate()
  }

  const verifyCodeError = isVerifyLimitExceeded
    ? `이메일 인증 실패 횟수(${EMAIL_VERIFY_FAIL_LIMIT_MAX_ATTEMPTS}회)를 초과했습니다. ${formatLimitWindowHours(EMAIL_VERIFY_FAIL_LIMIT_WINDOW_MS)}이 지나면 다시 시도할 수 있습니다.`
    : verifyCodeMutation.error instanceof Error
      ? verifyCodeMutation.error.message
      : null

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-[336px] rounded-xl border border-[#e0e0db] bg-white px-8 py-10">
        <form onSubmit={handleSubmit} className="flex w-full flex-col items-start gap-8">
          <h1 className="w-full text-center text-xl font-bold text-[#1a1a17]">회원가입</h1>

          <div className="flex w-full flex-col items-start gap-[60px]">
            <div className="flex w-full items-center gap-2">
              <img src={checkCircleIcon} alt="" aria-hidden className="size-4 shrink-0" />
              <p className="text-xs text-[#1a1a17]">약관 동의 완료</p>
            </div>

            <div className="flex w-full flex-col items-start gap-8">
              <div className="flex w-full flex-col items-start gap-5">
                <p className="w-full text-xl font-bold leading-7 text-[#1a1a17]">
                  이메일을 인증해 주세요.
                </p>

                <EmailVerificationField
                  emailId="register-email"
                  verification={verification}
                  codeError={verifyCodeError}
                  codeDisabled={isVerifyLimitExceeded}
                />
              </div>

              <div className="flex w-full flex-col items-start gap-5">
                <button
                  type="submit"
                  disabled={!canSubmitCode}
                  className="flex h-11 w-full items-center justify-center rounded bg-[#001e43] text-sm font-medium text-white hover:bg-[#00152f] disabled:opacity-50"
                >
                  {verifyCodeMutation.isPending ? '확인 중...' : '인증번호 확인'}
                </button>

                <div className="flex w-full items-center justify-between text-xs font-medium text-[#1a1a17]">
                  <button
                    type="button"
                    onClick={() => {
                      void navigate({ to: '/register-terms' })
                    }}
                    className="opacity-50"
                  >
                    ← 이전
                  </button>
                </div>

                {/* [TEMP] 26.09.02 임시 스킵 버튼 — 이메일 인증 없이 다음 단계 확인용. 작업 완료 시 제거
                    /register-password 라우트 가드가 registerEmail이 없으면 이 페이지로 되돌려보내므로,
                    스킵 시에도 더미 값을 채워 가드를 통과시킨다. */}
                <button
                  type="button"
                  onClick={() => {
                    setRegisterEmail(email || 'temp-skip@example.com')
                    void navigate({ to: '/register-password' })
                  }}
                  className="flex h-11 w-full items-center justify-center rounded border border-dashed border-[#001e43] text-sm font-medium text-[#001e43]"
                >
                  (임시) 다음 단계로 건너뛰기
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
