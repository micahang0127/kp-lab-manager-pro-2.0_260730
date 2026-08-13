import { Turnstile } from '@marsidev/react-turnstile'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'

import type { ApiResponse } from '../api'
// [TEMP] 26.07.27 백엔드 미연동 — 로그인/OTP API 연동 전까지 주석 처리. 연동 완료 시 주석 해제
// import { DEVICE_TYPE_WEB, login, otpLogin } from '../api/user'
import type { LoginData, OtpLoginData } from '../api/user'
import { FormInput } from '../components/form'
import { useAuthStore } from '../stores/authStore'
import { getFingerprint } from '../utils/fingerprint'
import {
  EMAIL_MAX_LENGTH,
  isValidEmail,
  isValidPassword,
  PASSWORD_RULE_MESSAGE,
  removeHangul,
  sanitizePasswordInput,
} from '../utils/rules/validationRules'

// ─── Types ────────────────────────────────────────────────────────────────────

type LoginStep = { kind: 'credentials' } | { kind: 'otp'; email: string; expiresAt: number }

// ─── Validation ────────────────────────────────────────────────────────────────

const EMAIL_INVALID_MESSAGE = '이메일 형식이 아닙니다.'
const PASSWORD_MISMATCH_MESSAGE = '올바른 비밀번호가 아닙니다.'

// ─── TEMP: 백엔드 미연동 스텁 ────────────────────────────────────────────────────

/**
 * [TEMP] 26.07.27 백엔드 미연동 — requireAuth(JWT 형식 + 만료 검증)를 통과시키기 위한 가짜 토큰 생성.
 * 실제 서버 발급 토큰이 아니므로 연동 완료 시 이 함수와 호출부를 모두 제거할 것
 */
function createTempAccessToken(): string {
  const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }))
  const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 }))
  return `${header}.${payload}.temp-signature`
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function LoginPage() {
  const navigate = useNavigate()
  const setLoggedIn = useAuthStore((s) => s.setLoggedIn)

  // Turnstile 토큰 상태
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [turnstileError, setTurnstileError] = useState<string | null>(null)

  // 로그인 단계 상태
  const [step, setStep] = useState<LoginStep>({ kind: 'credentials' })

  // 자격증명 폼 상태
  const [form, setForm] = useState({ email: '', password: '' })

  // OTP 입력 상태
  const [otpCode, setOtpCode] = useState('')
  const [timeLeft, setTimeLeft] = useState(0)

  // 핑거프린트 (두 mutation 간 공유)
  const fingerprintRef = useRef<string | null>(null)

  // 이메일 입력란 자동 포커스용
  const emailInputRef = useRef<HTMLInputElement>(null)

  // ─── 이메일 자동 포커스 ────────────────────────────────────────────────────────

  useEffect(() => {
    emailInputRef.current?.focus()
  }, [])

  // ─── OTP 타이머 ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (step.kind !== 'otp') return

    const tick = () => {
      const remaining = Math.max(0, Math.floor((step.expiresAt - Date.now()) / 1000))
      setTimeLeft(remaining)
    }

    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [step])

  // ─── Mutations ─────────────────────────────────────────────────────────────────

  // [TEMP] 26.07.27 백엔드 미연동 — 아래 실제 구현 참고용 타입/로직은 주석 처리. 연동 완료 시 주석 해제
  // type LoginRequestWithTurnstile = {
  //   email: string
  //   password: string
  //   deviceType: string
  //   cfTurnstileResponse: string
  // }
  const loginMutation = useMutation({
    mutationFn: async (_vars: { email: string; password: string; cfTurnstileResponse: string }) => {
      const fp = await getFingerprint()
      fingerprintRef.current = fp

      // [TEMP] 26.07.27 백엔드 미연동 — 항상 성공 처리. 연동 완료 시 아래 주석 해제하고 스텁 제거
      // cfTurnstileResponse를 body에 포함 (LoginRequest 타입 확장)
      // const loginBody: LoginRequestWithTurnstile = {
      //   email: vars.email,
      //   password: vars.password,
      //   deviceType: DEVICE_TYPE_WEB,
      //   cfTurnstileResponse: vars.cfTurnstileResponse,
      // }
      // return login(loginBody, fp)
      const stubResponse: ApiResponse<LoginData> = {
        statusCode: 200,
        data: { type: 'T', token: createTempAccessToken() },
        error: [],
      }
      return stubResponse
    },
    onSuccess: (res) => {
      if (res.data.type === 'T' && res.data.token) {
        sessionStorage.setItem('accessToken', res.data.token)
        setLoggedIn(true)
        void navigate({ to: '/main' })
      } else if (res.data.type === 'O') {
        setStep({
          kind: 'otp',
          email: form.email,
          expiresAt: Date.now() + 5 * 60 * 1000,
        })
      }
    },
    onError: (err: unknown) => {
      if (err instanceof Error && err.message.includes('cf-turnstile')) {
        setTurnstileError('로봇 인증에 실패했습니다. 새로고침 후 다시 시도해주세요.')
        return
      }
      alert(PASSWORD_MISMATCH_MESSAGE)
    },
  })

  const otpMutation = useMutation({
    mutationFn: async (_vars: { otpCode: string; email: string }) => {
      // [TEMP] 26.07.27 백엔드 미연동 — 항상 성공 처리. 연동 완료 시 아래 주석 해제하고 스텁 제거
      // return await otpLogin(
      //   { email: vars.email, otpCode: vars.otpCode, deviceType: DEVICE_TYPE_WEB },
      //   fingerprintRef.current
      // )
      const stubResponse: ApiResponse<OtpLoginData> = {
        statusCode: 200,
        data: { token: createTempAccessToken() },
        error: [],
      }
      return await Promise.resolve(stubResponse)
    },
    onSuccess: (res) => {
      sessionStorage.setItem('accessToken', res.data.token)
      setLoggedIn(true)
      void navigate({ to: '/main' })
    },
  })

  // ─── Event Handlers ───────────────────────────────────────────────────────────

  const handleLoginSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setTurnstileError(null)

    if (!isValidEmail(form.email)) {
      alert(EMAIL_INVALID_MESSAGE)
      return
    }
    if (!isValidPassword(form.password)) {
      alert(PASSWORD_RULE_MESSAGE)
      return
    }
    if (!turnstileToken) {
      setTurnstileError('로봇 인증을 완료해주세요.')
      return
    }
    loginMutation.mutate({ ...form, cfTurnstileResponse: turnstileToken })
  }

  const handleOtpSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (step.kind !== 'otp') return
    otpMutation.mutate({ otpCode, email: step.email })
  }

  // ─── Render ───────────────────────────────────────────────────────────────────
  // 자격증명 관련 에러(이메일 형식, 비밀번호 길이, 로그인 실패)는 alert()로 안내하므로
  // 인라인 배너를 별도로 렌더링하지 않는다.

  const otpErrors = otpMutation.error instanceof Error ? [otpMutation.error.message] : []

  const isOtpExpired = timeLeft === 0 && step.kind === 'otp'
  const canSubmitOtp = otpCode.length === 6 && !isOtpExpired && !otpMutation.isPending

  return (
    <section className="mx-auto w-full max-w-sm">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">로그인</h1>

      {step.kind === 'credentials' ? (
        <>
          {/* 자격증명 폼 */}
          {/* noValidate: 브라우저 기본 검증(영문 툴팁 등) 대신 alert()로 안내하는 커스텀 검증만 사용 */}
          <form className="space-y-4" onSubmit={handleLoginSubmit} noValidate>
            <FormInput
              ref={emailInputRef}
              id="email"
              label="이메일"
              type="email"
              required
              hideRequiredMark
              placeholder="이메일을 입력하세요."
              maxLength={EMAIL_MAX_LENGTH}
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: removeHangul(e.target.value) }))}
            />
            <FormInput
              id="password"
              label="비밀번호"
              type="password"
              required
              hideRequiredMark
              placeholder="비밀번호 8자리 이상 입력하세요"
              value={form.password}
              onChange={(e) =>
                setForm((f) => ({ ...f, password: sanitizePasswordInput(e.target.value) }))
              }
            />

            {/* Turnstile 컴포넌트 */}
            <div>
              <Turnstile
                siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY ?? ''}
                onSuccess={(token: string) => {
                  setTurnstileToken(token)
                  setTurnstileError(null)
                }}
                onError={() => {
                  setTurnstileToken(null)
                  setTurnstileError('로봇 인증에 실패했습니다. 새로고침 후 다시 시도해주세요.')
                }}
                onExpire={() => {
                  setTurnstileToken(null)
                  setTurnstileError('로봇 인증이 만료되었습니다. 새로고침 후 다시 시도해주세요.')
                }}
                options={{ theme: 'light', appearance: 'interaction-only' }}
              />
            </div>
            {/* Turnstile 에러 */}
            {turnstileError && (
              <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {turnstileError}
              </div>
            )}

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {loginMutation.isPending ? '로그인 중...' : '로그인'}
            </button>
            {/* 회원가입 페이지 이동 */}
            <button
              type="button"
              onClick={() => {
                void navigate({ to: '/register' })
              }}
              className="w-full rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              회원가입
            </button>
          </form>
        </>
      ) : (
        <>
          {/* OTP 폼 에러 */}
          {otpErrors.length > 0 && (
            <ul className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {otpErrors.map((msg) => (
                <li key={msg}>{msg}</li>
              ))}
            </ul>
          )}

          {/* OTP 만료 알림 */}
          {isOtpExpired && (
            <div className="mb-4 rounded border border-orange-200 bg-orange-50 p-3 text-sm text-orange-600">
              인증 시간이 만료되었습니다. 다시 로그인해주세요.
            </div>
          )}

          {/* OTP 입력 폼 */}
          <form className="space-y-4" onSubmit={handleOtpSubmit}>
            <p className="text-sm text-gray-600">
              {step.email}로 발송된 6자리 인증번호를 입력해주세요.
            </p>

            <FormInput
              id="otp-code"
              label="인증번호"
              inputMode="numeric"
              maxLength={6}
              required
              hideRequiredMark
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              inputClassName="text-center font-mono tracking-widest"
            />

            {/* OTP 타이머 */}
            <div className="text-center text-sm text-gray-600">
              남은 시간:{' '}
              <span className={isOtpExpired ? 'text-red-600' : ''}>
                {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:
                {String(timeLeft % 60).padStart(2, '0')}
              </span>
            </div>

            {/* OTP 제출 버튼 */}
            <button
              type="submit"
              disabled={!canSubmitOtp}
              className="w-full rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {otpMutation.isPending ? 'OTP 확인 중...' : 'OTP 인증'}
            </button>

            {/* 다시 로그인하기 */}
            <button
              type="button"
              onClick={() => {
                setStep({ kind: 'credentials' })
                setOtpCode('')
                setTimeLeft(0)
              }}
              className="w-full rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              처음부터 시작
            </button>
          </form>
        </>
      )}
    </section>
  )
}
