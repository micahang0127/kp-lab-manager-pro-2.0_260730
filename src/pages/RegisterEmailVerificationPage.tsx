import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

import { sendEmailVerificationCode, verifyRegisterEmailCode } from '../api/auth'
import { checkEmailDuplicate, getInvitedOrgs } from '../api/user'
import { AuthCardLayout, AuthFormActions, CompletedStepBadge } from '../components/auth'
import { EmailVerificationField, useEmailVerification } from '../components/emailVerification'
import { useRegisterFlowStore } from '../stores/registerFlowStore'
import {
  EMAIL_DUPLICATE_MESSAGE,
  EMAIL_SEND_LIMIT_MAX_ATTEMPTS,
  EMAIL_SEND_LIMIT_WINDOW_MS,
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
  const setRegisterEmailCode = useRegisterFlowStore((s) => s.setRegisterEmailCode)
  const setInvitedOrgs = useRegisterFlowStore((s) => s.setInvitedOrgs)

  // 회원가입(authType: '0') 인증코드 발송 API의 필수 파라미터라서 값을 채워 보낸다. 발송
  // 횟수 제한(24시간 5회) 자체는 이메일 계정 기준이라 이 값은 제한 판단에는 쓰이지 않는다
  // (src/api/auth.ts의 sendEmailVerificationCode JSDoc 참고). 쿠키에 없으면 useFingerprint가
  // 마운트 시 자동으로 발급받는다.
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
      // 최종 회원가입 제출(signUp)의 code 파라미터로 그대로 재사용한다 — 서버가 email+code
      // 조합으로 SIGNUP 타입 이메일 인증 완료 이력을 다시 확인하므로, 방금 인증에 성공한
      // 코드 그대로 저장해야 한다.
      setRegisterEmailCode(emailCode)
      invitedOrgsMutation.mutate()
      void navigate({ to: '/register-password' })
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
    isCodeSent && isValidEmailCode(emailCode) && !isCodeExpired && !verifyCodeMutation.isPending

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!canSubmitCode) return
    verifyCodeMutation.mutate()
  }

  const verifyCodeError =
    verifyCodeMutation.error instanceof Error ? verifyCodeMutation.error.message : null

  return (
    <AuthCardLayout title="회원가입" onSubmit={handleSubmit}>
      <div className="flex w-full flex-col items-start gap-[60px]">
        <CompletedStepBadge label="약관 동의 완료" />

        <div className="flex w-full flex-col items-start gap-8">
          <div className="flex w-full flex-col items-start gap-5">
            <p className="w-full text-xl font-bold leading-7 text-[#1a1a17]">
              이메일을 인증해 주세요.
            </p>

            <EmailVerificationField
              emailId="register-email"
              verification={verification}
              codeError={verifyCodeError}
            />
          </div>

          <AuthFormActions
            primaryLabel={verifyCodeMutation.isPending ? '확인 중...' : '인증번호 확인'}
            primaryDisabled={!canSubmitCode}
            secondaryLeft={
              <button
                type="button"
                onClick={() => {
                  void navigate({ to: '/register-terms' })
                }}
                className="opacity-50"
              >
                ← 이전
              </button>
            }
            afterSecondary={
              // [TEMP] 26.09.02 임시 스킵 버튼 — 이메일 인증 없이 다음 단계 확인용. 작업 완료 시 제거
              // /register-password 라우트 가드가 registerEmail이 없으면 이 페이지로 되돌려보내므로,
              // 스킵 시에도 더미 값을 채워 가드를 통과시킨다. registerEmailCode도 최종 회원가입
              // 제출(signUp)의 code 파라미터로 필요하므로 함께 더미 값을 채워둔다.
              <button
                type="button"
                onClick={() => {
                  setRegisterEmail(email || 'temp-skip@example.com')
                  setRegisterEmailCode(emailCode || '000000')
                  void navigate({ to: '/register-password' })
                }}
                className="flex h-11 w-full items-center justify-center rounded border border-dashed border-[#001e43] text-sm font-medium text-[#001e43]"
              >
                (임시) 다음 단계로 건너뛰기
              </button>
            }
          />
        </div>
      </div>
    </AuthCardLayout>
  )
}
