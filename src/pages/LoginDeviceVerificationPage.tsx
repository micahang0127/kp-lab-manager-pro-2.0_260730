import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

import { loginVerifyDevice, sendEmailVerificationCode } from '../api/auth'
import { AuthCardLayout, AuthFormActions } from '../components/auth'
import { EmailVerificationField, useEmailVerification } from '../components/emailVerification'
import { useAuthStore } from '../stores/authStore'
import { useLoginFlowStore } from '../stores/loginFlowStore'
import {
  isValidEmailCode,
  LOGIN_EMAIL_SEND_LIMIT_MAX_ATTEMPTS,
  LOGIN_EMAIL_SEND_LIMIT_WINDOW_MS,
} from '../utils/rules/validationRules'

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * 로그인 2차 인증(신규 브라우저) 화면 (Figma node-id=299:1753 기준).
 * `/login`에서 자격증명 로그인에 성공했지만 신규(또는 지문이 바뀐) 브라우저로 판단된 경우에만
 * `loginFlowStore.pending`이 채워진 상태로 이 라우트(`/login-verify`)에 진입한다.
 * 이메일은 1차 로그인에서 이미 확정된 값이라 이 화면에서 수정할 수 없다(수정하면 서버가 검증하는
 * email+password 조합이 깨져 인증이 반드시 실패한다).
 */
export function LoginDeviceVerificationPage() {
  const navigate = useNavigate()
  const pending = useLoginFlowStore((s) => s.pending)
  const clearPending = useLoginFlowStore((s) => s.clearPending)
  const authLogin = useAuthStore((s) => s.login)

  const verification = useEmailVerification({
    initialEmail: pending?.email ?? '',
    // 로그인 2차 인증(authType: '1')은 fingerprintCode가 필요 없다(이메일 기준으로만 제한).
    sendCode: (email) => sendEmailVerificationCode({ email, authType: '1' }),
    sendLimit: {
      purpose: 'login-send',
      maxAttempts: LOGIN_EMAIL_SEND_LIMIT_MAX_ATTEMPTS,
      windowMs: LOGIN_EMAIL_SEND_LIMIT_WINDOW_MS,
    },
  })
  const { emailCode, isCodeSent, isCodeExpired, sendSuccessCount } = verification

  // ─── Mutation ──────────────────────────────────────────────────────────────────

  const verifyDeviceMutation = useMutation({
    mutationFn: () => {
      if (!pending) return Promise.reject(new Error('로그인 정보가 없습니다.'))
      return loginVerifyDevice({
        email: pending.email,
        password: pending.password,
        code: emailCode,
        fingerprintCode: pending.fingerprintCode,
        device: pending.device,
      })
    },
    onSuccess: (res) => {
      if (!res.data) return
      const { accessToken, ...session } = res.data
      authLogin(accessToken, session)
      clearPending()
      void navigate({ to: '/main' })
    },
  })

  // 이전 확인 실패 상태가 그대로 남아있던 문제를 막기 위해, 인증번호를 다시 보내거나(재전송)
  // 다시 입력하기 시작하면 이전 검증 실패 상태를 초기화한다
  const { reset: resetVerifyDevice } = verifyDeviceMutation
  useEffect(() => {
    resetVerifyDevice()
  }, [sendSuccessCount, emailCode, resetVerifyDevice])

  // ─── Event Handlers ───────────────────────────────────────────────────────────

  const canSubmitCode =
    isCodeSent && isValidEmailCode(emailCode) && !isCodeExpired && !verifyDeviceMutation.isPending

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!canSubmitCode) return
    verifyDeviceMutation.mutate()
  }

  const handleBackToLogin = () => {
    clearPending()
    void navigate({ to: '/login' })
  }

  // 라우트 가드(`src/routes/login-verify.tsx`)가 이미 pending 없는 접근을 걸러내지만,
  // 컴포넌트 레벨에서도 방어적으로 처리한다.
  if (!pending) return null

  const verifyCodeError =
    verifyDeviceMutation.error instanceof Error ? verifyDeviceMutation.error.message : null

  return (
    <AuthCardLayout title="보안 로그인" align="center" onSubmit={handleSubmit}>
      <div className="flex w-full flex-col items-start gap-8">
        <div className="flex w-full flex-col items-start gap-5">
          <div className="flex w-full flex-col items-start gap-1 text-[#1a1a17]">
            <p className="text-xl font-bold leading-7">새로운 브라우저에서 로그인하고 있습니다.</p>
            <p className="text-sm leading-[18px]">
              안전한 로그인을 위해 이메일 인증을 진행해 주세요.
            </p>
          </div>

          <EmailVerificationField
            emailId="login-verify-email"
            emailDisabled
            verification={verification}
            codeError={verifyCodeError}
          />
        </div>

        <AuthFormActions
          primaryLabel={verifyDeviceMutation.isPending ? '확인 중...' : '확인'}
          primaryDisabled={!canSubmitCode}
          secondaryLeft={
            <button type="button" onClick={handleBackToLogin} className="opacity-50">
              ← 로그인으로 돌아가기
            </button>
          }
        />
      </div>
    </AuthCardLayout>
  )
}
