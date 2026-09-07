import type { TurnstileInstance } from '@marsidev/react-turnstile'
import { Turnstile } from '@marsidev/react-turnstile'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'

import { ApiError } from '../api'
import { login, verifyTurnstile } from '../api/user'
import { FormCheckbox, FormInput } from '../components/form'
import { PasswordField } from '../components/password'
import { useAuthStore } from '../stores/authStore'
import { useLoginFlowStore } from '../stores/loginFlowStore'
import { useSavedEmailStore } from '../stores/savedEmailStore'
import {
  EMAIL_MAX_LENGTH,
  HANGUL_INPUT_MESSAGE,
  isValidEmail,
  isValidPassword,
} from '../utils/rules/validationRules'
import { useFingerprint } from '../utils/useFingerprint'
import { useHangulGuardedInput } from '../utils/useHangulGuardedInput'

// ─── Validation ────────────────────────────────────────────────────────────────
// 이메일/비밀번호 형식 오류는 alert가 아니라 입력란 하단 인라인 메시지로만 안내한다.

const EMAIL_FORMAT_MESSAGE = '이메일 형식에 맞지 않습니다.'
const PASSWORD_FORMAT_MESSAGE = '비밀번호 형식에 맞지 않습니다.'

// ─── 로그인 실패 카운트 ───────────────────────────────────────────────────────────
// 서버가 이메일/비밀번호 불일치로 로그인을 거부할 때마다(Turnstile 오류 제외) 카운트를 올리고,
// 로그인 성공 시에만 0으로 리셋한다. 즉 이메일을 바꾸거나 페이지를 새로고침해도(컴포넌트 state가
// 초기화되므로) 카운트는 유지되지 않지만, 같은 세션에서 계속 실패하는 한 5회까지 계속 누적된다.
// ⚠️ 프런트엔드 단독 카운트이므로 새로고침·시크릿창 등으로 쉽게 우회 가능한 UX 안내용일 뿐이며,
// 실질적인 브루트포스 방어(계정/IP 단위 잠금)는 반드시 백엔드에서 처리해야 한다.
const LOGIN_FAIL_LIMIT = 5
const LOGIN_LOCKED_MESSAGE = '로그인이 일시적으로 제한되었습니다.'

/** 로그인 실패 횟수에 따른 안내 문구를 생성한다 (비밀번호 입력란 하단에 실시간으로 표시) */
function getLoginFailMessage(count: number): string {
  return `이메일 또는 비밀번호를 확인해 주세요. (실패 ${count}/${LOGIN_FAIL_LIMIT})`
}

// ─── 이메일 인증 유효 시간 ────────────────────────────────────────────────────────

const EMAIL_VERIFICATION_DURATION_MS = 5 * 60 * 1000

// ─── Component ─────────────────────────────────────────────────────────────────

export function LoginPage() {
  const navigate = useNavigate()
  const setLoggedIn = useAuthStore((s) => s.setLoggedIn)
  const setPendingVerification = useLoginFlowStore((s) => s.setPending)
  const saveEmail = useSavedEmailStore((s) => s.saveEmail)
  const clearSavedEmail = useSavedEmailStore((s) => s.clearSavedEmail)

  // Turnstile 검증 상태 — 서버(verifyTurnstile)가 위젯 토큰을 실제로 검증 완료했는지 여부
  // (로그인 제출 허용 기준)
  const [turnstileVerified, setTurnstileVerified] = useState(false)
  const [turnstileError, setTurnstileError] = useState<string | null>(null)
  const turnstileRef = useRef<TurnstileInstance | null>(null)

  // 자격증명 폼 상태 (아이디 저장 기능으로 저장된 이메일이 있으면 초기값으로 채움)
  // lazy initializer: 마운트 시 1회만 sessionStorage(스토어 경유)를 읽기 위함
  const [form, setForm] = useState(() => ({
    email: useSavedEmailStore.getState().savedEmail ?? '',
    password: '',
  }))

  // 아이디 저장 체크박스 상태
  const [rememberId, setRememberId] = useState(() => !!useSavedEmailStore.getState().savedEmail)

  // 이메일 입력 — 한글(IME) 조합 중에는 값을 건드리지 않다가 조합이 끝난 시점에만 한글을
  // 제거해 반영한다(그렇지 않으면 조합이 깨지면서 엉뚱한 영문자가 입력되는 문제가 있음)
  const {
    hasHangulInput: emailHangulAttempted,
    handleChange: handleEmailChange,
    handleCompositionStart: handleEmailCompositionStart,
    handleCompositionEnd: handleEmailCompositionEnd,
  } = useHangulGuardedInput({
    onChange: (value) => setForm((f) => ({ ...f, email: value })),
  })

  // 로그인 실패 횟수 (성공 시에만 0으로 리셋) — 자격증명 불일치(401)일 때만 증가한다
  const [loginFailCount, setLoginFailCount] = useState(0)

  // 자격증명 문제가 아닌 로그인 오류(네트워크 단절·타임아웃·서버 오류 등) 안내 메시지.
  // 이 경우는 사용자가 이메일/비밀번호를 잘못 입력한 게 아니므로 실패 카운트에는 반영하지 않는다.
  const [loginErrorMessage, setLoginErrorMessage] = useState<string | null>(null)

  // 이메일 입력란 자동 포커스용
  const emailInputRef = useRef<HTMLInputElement>(null)

  // ─── 이메일 자동 포커스 ────────────────────────────────────────────────────────

  useEffect(() => {
    emailInputRef.current?.focus()
  }, [])

  // 이 브라우저의 fingerprintCode를 확보해둔다 — 쿠키에 이미 있으면 재사용하고, 없으면(이
  // 브라우저에서의 최초 로그인 시도 등) 여기서 발급받아 쿠키에 저장한다. 신규 기기+신규 이메일
  // 조합 판단에 사용할 예정이며, 로그인 요청에 실어 보내는 구체적인 연동은 백엔드 요청 스펙
  // 확정 후 별도로 진행한다.
  useFingerprint()

  // ─── Mutations ─────────────────────────────────────────────────────────────────

  // Turnstile 위젯이 토큰을 발급하는 즉시(onSuccess) 호출 — 토큰은 일회용·300초 만료이므로
  // 로그인 폼 제출을 기다리지 않고 최대한 빨리 서버 검증을 받아 실패를 미리 감지한다.
  const verifyTurnstileMutation = useMutation({
    mutationFn: (token: string) => verifyTurnstile({ token }),
    onSuccess: (res) => {
      if (res.data?.isVerified) {
        setTurnstileVerified(true)
        setTurnstileError(null)
        return
      }
      setTurnstileVerified(false)
      setTurnstileError('로봇 인증에 실패했습니다. 새로고침 후 다시 시도해주세요.')
      turnstileRef.current?.reset()
    },
    onError: () => {
      setTurnstileVerified(false)
      setTurnstileError('로봇 인증 확인 중 오류가 발생했습니다. 새로고침 후 다시 시도해주세요.')
      turnstileRef.current?.reset()
    },
  })

  const loginMutation = useMutation({
    mutationFn: (vars: { email: string; password: string }) => login(vars),
    onSuccess: (res) => {
      setLoginFailCount(0)
      if (res.data?.type === 'T' && res.data.token) {
        sessionStorage.setItem('accessToken', res.data.token)
        setLoggedIn(true)
        void navigate({ to: '/main' })
      } else if (res.data?.type === 'O') {
        // 신규 기기(브라우저) + 신규 이메일 조합으로 판단됨 — 이메일 2차 인증 단계로 이동
        setPendingVerification({
          email: form.email,
          expiresAt: Date.now() + EMAIL_VERIFICATION_DURATION_MS,
        })
        void navigate({ to: '/login/verify' })
      }
    },
    onError: (err) => {
      // 401(자격증명 불일치)만 실패 카운트에 반영한다. 네트워크 단절·타임아웃·서버 오류(5xx) 등
      // 다른 원인까지 "이메일/비밀번호 확인" 문구로 안내하면 사용자가 잘못된 원인으로 오인하고,
      // 반복되는 일시적 오류만으로도 로컬 잠금(LOGIN_FAIL_LIMIT)에 도달할 수 있기 때문이다.
      if (err instanceof ApiError && err.statusCode === 401) {
        setLoginErrorMessage(null)
        setLoginFailCount((prev) => {
          const next = Math.min(prev + 1, LOGIN_FAIL_LIMIT)
          if (next >= LOGIN_FAIL_LIMIT) {
            alert(LOGIN_LOCKED_MESSAGE)
          }
          return next
        })
        return
      }

      setLoginErrorMessage(
        err instanceof Error
          ? err.message
          : '로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
      )
    },
  })

  // ─── Event Handlers ───────────────────────────────────────────────────────────

  const handleLoginSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setTurnstileError(null)
    setLoginErrorMessage(null)

    // 이메일/비밀번호 형식 오류는 입력란 하단 인라인 메시지로 이미 실시간 안내되므로 별도 alert
    // 없이 제출만 막는다.
    if (!isValidEmail(form.email)) {
      return
    }
    if (!isValidPassword(form.password)) {
      return
    }
    if (!turnstileVerified) {
      setTurnstileError('로봇 인증을 완료해주세요.')
      return
    }

    if (rememberId) {
      saveEmail(form.email)
    } else {
      clearSavedEmail()
    }

    loginMutation.mutate(form)
  }

  // ─── Render ───────────────────────────────────────────────────────────────────
  // 이메일/비밀번호 형식 오류는 입력란 하단에 실시간으로 안내한다. 로그인 실패(이메일/비밀번호
  // 불일치 등 서버 응답 기반 에러)도 비밀번호 입력란 하단에 실패 횟수와 함께 안내하며, 5회에
  // 도달하면 alert로 한 번 더 안내한다(위 loginMutation.onError 참고). 형식 오류가 있을 때는
  // 형식 오류 메시지를 우선 표시한다.

  const isEmailFormatInvalid = form.email.length > 0 && !isValidEmail(form.email)
  const emailMessage = emailHangulAttempted
    ? HANGUL_INPUT_MESSAGE
    : isEmailFormatInvalid
      ? EMAIL_FORMAT_MESSAGE
      : undefined

  const isPasswordFormatInvalid = form.password.length > 0 && !isValidPassword(form.password)
  const passwordMessage = isPasswordFormatInvalid
    ? PASSWORD_FORMAT_MESSAGE
    : loginFailCount > 0
      ? getLoginFailMessage(loginFailCount)
      : undefined

  return (
    <section className="mx-auto w-full max-w-sm">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">로그인</h1>

      {/* noValidate: 브라우저 기본 검증(영문 툴팁 등) 대신 alert()로 안내하는 커스텀 검증만 사용 */}
      <form className="space-y-4" onSubmit={handleLoginSubmit} noValidate>
        <FormInput
          ref={emailInputRef}
          id="email"
          label="이메일"
          type="email"
          required
          placeholder="이메일을 입력해 주세요"
          maxLength={EMAIL_MAX_LENGTH}
          value={form.email}
          onChange={handleEmailChange}
          onCompositionStart={handleEmailCompositionStart}
          onCompositionEnd={handleEmailCompositionEnd}
          message={emailMessage}
        />
        <PasswordField
          id="password"
          label="비밀번호"
          required
          value={form.password}
          onChange={(value) => setForm((f) => ({ ...f, password: value }))}
          error={passwordMessage}
        />

        {/* 아이디 저장 */}
        <FormCheckbox
          id="remember-id"
          label="아이디 저장"
          checked={rememberId}
          onChange={setRememberId}
        />

        {/* Turnstile 컴포넌트 */}
        <div>
          <Turnstile
            ref={turnstileRef}
            siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY ?? ''}
            onSuccess={(token: string) => {
              setTurnstileError(null)
              verifyTurnstileMutation.mutate(token)
            }}
            onError={() => {
              setTurnstileVerified(false)
              setTurnstileError('로봇 인증에 실패했습니다. 새로고침 후 다시 시도해주세요.')
            }}
            onExpire={() => {
              setTurnstileVerified(false)
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

        {/* 자격증명 불일치가 아닌 로그인 오류(네트워크·서버 오류 등) */}
        {loginErrorMessage && (
          <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {loginErrorMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={loginMutation.isPending || verifyTurnstileMutation.isPending}
          className="w-full rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loginMutation.isPending ? '로그인 중...' : '로그인'}
        </button>

        {/* 아이디/비밀번호 찾기 · 회원가입 */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              void navigate({ to: '/find-account' })
            }}
            className="flex-1 rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            아이디/비밀번호 찾기
          </button>
          <button
            type="button"
            onClick={() => {
              void navigate({ to: '/register' })
            }}
            className="flex-1 rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            회원가입
          </button>
        </div>
      </form>
    </section>
  )
}
