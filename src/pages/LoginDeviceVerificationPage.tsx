import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'

import { loginVerifyDevice, sendEmailVerificationCode } from '../api/auth'
import { AuthCardLayout, MaskedIdentityBox } from '../components/auth'
import { EmailCodeInput, useEmailVerification } from '../components/emailVerification'
import { ErrorMessage } from '../components/error/ErrorMessage'
import { useAuthStore } from '../stores/authStore'
import { useLoginFlowStore } from '../stores/loginFlowStore'
import { formatTimeLeft } from '../utils/formatTimeLeft'
import { maskEmail } from '../utils/maskEmail'
import {
  EMAIL_CODE_LENGTH,
  isValidEmailCode,
  LOGIN_EMAIL_SEND_LIMIT_MAX_ATTEMPTS,
  LOGIN_EMAIL_SEND_LIMIT_WINDOW_MS,
} from '../utils/rules/validationRules'

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * 로그인 2차 인증(신규 브라우저) 화면 (Figma node-id=1103:10704 기준).
 * `/login`에서 자격증명 로그인에 성공했지만 신규(또는 지문이 바뀐) 브라우저로 판단된 경우에만
 * `loginFlowStore.pending`이 채워진 상태로 이 라우트(`/login-verify`)에 진입한다.
 * 이메일은 1차 로그인에서 이미 확정된 값이라 이 화면에서 수정할 수 없다(수정하면 서버가 검증하는
 * email+password 조합이 깨져 인증이 반드시 실패한다). Figma 디자인 기준 이메일 입력칸 없이
 * 마스킹된 이메일만 보여주고, 화면 진입 시 인증번호를 자동으로 발송한다(아래 자동 발송 useEffect
 * 참고).
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
  const {
    emailCode,
    setEmailCode,
    isCodeSent,
    isCodeExpired,
    sendSuccessCount,
    timeLeft,
    sendCode,
    isSending,
    sendCodeError,
    isSendLimitExceeded,
  } = verification

  // 이메일 입력 없이 마스킹된 이메일만 보여주는 화면이라, 이메일 입력칸의 "인증번호 전송" 버튼
  // 대신 화면 진입 시 인증번호를 자동으로 1회 발송한다. sendCode는 verification 훅에서 매
  // 렌더링마다 새로 생성되는 함수라 재렌더링·mutate 참조 변경과 무관하게 마운트당 정확히 1회만
  // 보내기 위한 가드가 필요하다(useFingerprint 참고).
  const hasAutoSentRef = useRef(false)
  useEffect(() => {
    if (hasAutoSentRef.current) return
    hasAutoSentRef.current = true
    sendCode()
  }, [sendCode])

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
    <AuthCardLayout title="보안 인증" align="center" onSubmit={handleSubmit}>
      <div className="flex w-full flex-col items-start gap-8">
        <div className="flex w-full flex-col items-start gap-5">
          <div className="flex w-full flex-col items-start gap-1 text-[#1a1a17]">
            <p className="text-xl font-bold leading-7">새로운 브라우저에서 로그인하고 있습니다.</p>
            <div className="text-sm leading-[18px]">
              <p>계정 보호를 위해 추가 인증이 필요합니다.</p>
              <p>가입한 이메일에서 인증번호를 확인해 주세요.</p>
            </div>
          </div>

          <MaskedIdentityBox maskedIdentity={maskEmail(pending.email)} />

          <div className="flex w-full flex-col items-start gap-1">
            <p className="text-xs font-medium text-[#6b6b66]">인증번호 *</p>
            <div className="flex w-full flex-col items-start gap-3">
              <EmailCodeInput
                length={EMAIL_CODE_LENGTH}
                value={emailCode}
                onChange={setEmailCode}
                disabled={!isCodeSent || isCodeExpired}
                error={Boolean(verifyCodeError)}
                ariaLabel="인증번호"
              />
              <div className="flex w-full items-center justify-between">
                {isCodeSent && (
                  <p className="text-xs font-medium text-[#1a1a17] opacity-50">
                    남은 시간 {formatTimeLeft(timeLeft)}
                  </p>
                )}
                {/* 발송 횟수(5회)를 초과한 상태(로컬에서 미리 감지했든, 실제 서버가 409로
                    거절했든)면 더 이상 재시도할 수 없으므로 재전송 버튼 자체를 없앤다 —
                    disabled로 남겨두면 눌러도 안 되는 이유를 아래 에러 문구까지 읽어야만 알 수
                    있다. 이 화면은 별도의 "인증번호 전송" 버튼이 없어(자동 발송) 이 버튼이
                    유일한 재시도 수단이므로, 초과 상태가 아닌 한(예: 자동 발송이 일시적으로만
                    실패한 경우) isCodeSent 여부와 무관하게 계속 보여준다. */}
                {!isSendLimitExceeded && (
                  <button
                    type="button"
                    disabled={isSending}
                    onClick={sendCode}
                    className="text-xs font-medium text-[#1a1a17] opacity-50 disabled:opacity-30"
                  >
                    인증번호 재전송
                  </button>
                )}
              </div>
            </div>
            {isCodeExpired && (
              <ErrorMessage message="인증 시간이 만료되었습니다. 재전송해 주세요." />
            )}
            <ErrorMessage message={sendCodeError} />
            <ErrorMessage message={verifyCodeError} />
          </div>
        </div>

        <div className="flex w-full items-start gap-1">
          <button
            type="button"
            onClick={handleBackToLogin}
            className="flex h-11 w-[100px] shrink-0 items-center justify-center rounded border border-[#c9c9c4] bg-white text-sm font-medium text-[#1a1a17] hover:bg-gray-50"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={!canSubmitCode}
            className="flex h-11 flex-1 items-center justify-center rounded bg-[#001e43] text-sm font-medium text-white hover:bg-[#00152f] disabled:opacity-50"
          >
            {verifyDeviceMutation.isPending ? '확인 중...' : '확인'}
          </button>
        </div>
      </div>
    </AuthCardLayout>
  )
}
