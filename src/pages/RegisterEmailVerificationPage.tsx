import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'

import { sendRegisterEmailCode, verifyRegisterEmailCode } from '../api/auth'
import checkCircleIcon from '../assets/icons/register/check-circle.svg'
import { EmailVerificationField, useEmailVerification } from '../components/emailVerification'
import { useRegisterFlowStore } from '../stores/registerFlowStore'
import { isValidEmailCode } from '../utils/rules/validationRules'

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * 회원가입 5단계 — 이메일 인증.
 * 4단계(이용약관 동의) 완료 후 진입한다. 그룹 이메일을 입력해 인증번호 전송을 요청하고,
 * 발송된 6자리 인증번호를 입력해 확인하면 registerFlowStore에 인증된 이메일을 저장한다.
 */
export function RegisterEmailVerificationPage() {
  const navigate = useNavigate()
  const setRegisterEmail = useRegisterFlowStore((s) => s.setRegisterEmail)

  const verification = useEmailVerification({
    sendCode: (email) => sendRegisterEmailCode({ email }),
  })
  const { email, emailCode, isCodeSent, isCodeExpired } = verification

  // ─── Mutation ──────────────────────────────────────────────────────────────────

  const verifyCodeMutation = useMutation({
    mutationFn: () => verifyRegisterEmailCode({ email, code: emailCode }),
    onSuccess: (res) => {
      if (!res.data?.success) return
      setRegisterEmail(email)
      // [TEMP] 26.08.25 6단계(회원가입 정보 입력) Figma 디자인이 아직 없어 이동 로직은 보류.
      // 다음 화면 디자인이 나오면 registerEmail을 이용해 가입 정보 입력 폼으로 라우팅을 연결한다.
    },
  })

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
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
