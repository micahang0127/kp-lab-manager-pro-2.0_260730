import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import type { ApiResponse } from '../api'
// [TEMP] 26.07.27 백엔드 미연동 — 이메일 인증 API 연동 전까지 주석 처리. 연동 완료 시 주석 해제
// import { loginWithEmailVerificationCode } from '../api/user'
import type { EmailVerificationLoginData } from '../api/user'
import { FormCheckbox, FormInput } from '../components/form'
import { useAuthStore } from '../stores/authStore'
import { useLoginFlowStore } from '../stores/loginFlowStore'
import { EMAIL_CODE_LENGTH, isValidEmailCode } from '../utils/rules/validationRules'
import { createTempAccessToken } from '../utils/tempAccessToken'

// ─── 기기 신뢰 유효기간 ───────────────────────────────────────────────────────────
// 체크박스 라벨과 백엔드로 전달하는 request data(trustDurationDays)가 항상 같은 값을 쓰도록
// 하나의 상수로 관리한다.

const TRUST_DEVICE_DURATION_DAYS = 30

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * 신규 기기(브라우저) 로그인 시 진행되는 이메일 인증 단계. `/login`에서 자격증명 로그인에
 * 성공했지만 신규 기기로 판단된 경우(`loginMutation`이 `type: 'O'` 응답을 받은 경우)에만
 * `loginFlowStore.pending`이 채워진 상태로 이 라우트(`/login/verify`)에 진입한다.
 */
export function EmailVerificationPage() {
  const navigate = useNavigate()
  const setLoggedIn = useAuthStore((s) => s.setLoggedIn)
  const pending = useLoginFlowStore((s) => s.pending)
  const clearPending = useLoginFlowStore((s) => s.clearPending)

  const [emailCode, setEmailCode] = useState('')
  const [timeLeft, setTimeLeft] = useState(0)
  // 체크 시 백엔드가 TRUST_DEVICE_DURATION_DAYS 기간 동안 유효한 device-trust 쿠키를 발급해,
  // 그 기간 내에는 이 브라우저에서 이메일 인증을 다시 요구하지 않도록 한다
  const [trustDevice, setTrustDevice] = useState(false)

  // ─── 이메일 인증 타이머 ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!pending) return

    const tick = () => {
      const remaining = Math.max(0, Math.floor((pending.expiresAt - Date.now()) / 1000))
      setTimeLeft(remaining)
    }

    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [pending])

  // ─── Mutation ──────────────────────────────────────────────────────────────────

  const emailCodeLoginMutation = useMutation({
    mutationFn: async (_vars: {
      code: string
      email: string
      rememberDevice: boolean
      trustDurationDays: number
    }) => {
      // [TEMP] 26.07.27 백엔드 미연동 — 항상 성공 처리. 연동 완료 시 아래 주석 해제하고 스텁 제거
      // return await loginWithEmailVerificationCode({
      //   email: vars.email,
      //   code: vars.code,
      //   rememberDevice: vars.rememberDevice,
      //   trustDurationDays: vars.trustDurationDays,
      // })
      const stubResponse: ApiResponse<EmailVerificationLoginData> = {
        result: true,
        statusCode: 200,
        data: { token: createTempAccessToken() },
        message: [],
      }
      return await Promise.resolve(stubResponse)
    },
    onSuccess: (res) => {
      if (!res.data) return
      sessionStorage.setItem('accessToken', res.data.token)
      setLoggedIn(true)
      clearPending()
      void navigate({ to: '/main' })
    },
  })

  // ─── Event Handlers ───────────────────────────────────────────────────────────

  const handleEmailCodeSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!pending) return
    emailCodeLoginMutation.mutate({
      code: emailCode,
      email: pending.email,
      rememberDevice: trustDevice,
      trustDurationDays: TRUST_DEVICE_DURATION_DAYS,
    })
  }

  const handleRestart = () => {
    clearPending()
    void navigate({ to: '/login' })
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

  // 라우트 가드(`src/routes/login/verify.tsx`)가 이미 pending 없는 접근을 걸러내지만,
  // 컴포넌트 레벨에서도 방어적으로 처리한다.
  if (!pending) return null

  const emailCodeErrors =
    emailCodeLoginMutation.error instanceof Error ? [emailCodeLoginMutation.error.message] : []

  const isEmailCodeExpired = timeLeft === 0
  const canSubmitEmailCode =
    isValidEmailCode(emailCode) && !isEmailCodeExpired && !emailCodeLoginMutation.isPending

  return (
    <section className="mx-auto w-full max-w-sm">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">이메일 인증</h1>

      {/* 이메일 인증 폼 에러 */}
      {emailCodeErrors.length > 0 && (
        <ul className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {emailCodeErrors.map((msg) => (
            <li key={msg}>{msg}</li>
          ))}
        </ul>
      )}

      {/* 이메일 인증 만료 알림 */}
      {isEmailCodeExpired && (
        <div className="mb-4 rounded border border-orange-200 bg-orange-50 p-3 text-sm text-orange-600">
          인증 시간이 만료되었습니다. 다시 로그인해주세요.
        </div>
      )}

      {/* 이메일 인증 입력 폼 */}
      <form className="space-y-4" onSubmit={handleEmailCodeSubmit}>
        <p className="text-sm text-gray-600">
          {pending.email}로 발송된 6자리 인증번호를 입력해주세요.
        </p>

        <FormInput
          id="email-code"
          label="인증번호"
          inputMode="numeric"
          maxLength={EMAIL_CODE_LENGTH}
          required
          hideRequiredMark
          value={emailCode}
          onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, ''))}
          inputClassName="text-center font-mono tracking-widest"
        />

        {/* 이메일 인증 타이머 */}
        <div className="text-center text-sm text-gray-600">
          남은 시간:{' '}
          <span className={isEmailCodeExpired ? 'text-red-600' : ''}>
            {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:
            {String(timeLeft % 60).padStart(2, '0')}
          </span>
        </div>

        {/* 이 브라우저를 신뢰 기기로 등록 */}
        <FormCheckbox
          id="trust-device"
          label={`이 브라우저를 ${TRUST_DEVICE_DURATION_DAYS}일동안 신뢰`}
          checked={trustDevice}
          onChange={setTrustDevice}
        />

        {/* 이메일 인증 제출 버튼 */}
        <button
          type="submit"
          disabled={!canSubmitEmailCode}
          className="w-full rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {emailCodeLoginMutation.isPending ? '이메일 인증 확인 중...' : '이메일 인증'}
        </button>

        {/* 다시 로그인하기 */}
        <button
          type="button"
          onClick={handleRestart}
          className="w-full rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          처음부터 시작
        </button>
      </form>
    </section>
  )
}
