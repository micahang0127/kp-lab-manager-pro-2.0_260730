import { Turnstile } from '@marsidev/react-turnstile'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'

import type { ApiResponse } from '../api'
// [TEMP] 26.07.27 백엔드 미연동 — 로그인 API 연동 전까지 주석 처리. 연동 완료 시 주석 해제
// import { login } from '../api/user'
import type { LoginData } from '../api/user'
import { FormCheckbox, FormInput } from '../components/form'
import { useAuthStore } from '../stores/authStore'
import { useLoginFlowStore } from '../stores/loginFlowStore'
import { useSavedEmailStore } from '../stores/savedEmailStore'
import {
  containsHangul,
  EMAIL_MAX_LENGTH,
  isValidEmail,
  isValidPassword,
  removeHangul,
  sanitizePasswordInput,
} from '../utils/rules/validationRules'
import { createTempAccessToken } from '../utils/tempAccessToken'

// ─── Validation ────────────────────────────────────────────────────────────────
// 이메일/비밀번호 형식 오류는 alert가 아니라 입력란 하단 인라인 메시지로만 안내한다.

const EMAIL_HANGUL_MESSAGE = '한글은 입력불가합니다.'
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

  // Turnstile 토큰 상태
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [turnstileError, setTurnstileError] = useState<string | null>(null)

  // 자격증명 폼 상태 (아이디 저장 기능으로 저장된 이메일이 있으면 초기값으로 채움)
  // lazy initializer: 마운트 시 1회만 sessionStorage(스토어 경유)를 읽기 위함
  const [form, setForm] = useState(() => ({
    email: useSavedEmailStore.getState().savedEmail ?? '',
    password: '',
  }))

  // 아이디 저장 체크박스 상태
  const [rememberId, setRememberId] = useState(() => !!useSavedEmailStore.getState().savedEmail)

  // 이메일 입력 중 한글(한글 키보드) 입력을 시도했는지 여부 — removeHangul로 즉시 제거되므로
  // form.email 값만으로는 판별 불가하여 별도 상태로 추적한다
  const [emailHangulAttempted, setEmailHangulAttempted] = useState(false)

  // 로그인 실패 횟수 (성공 시에만 0으로 리셋)
  const [loginFailCount, setLoginFailCount] = useState(0)

  // 이메일 입력란 자동 포커스용
  const emailInputRef = useRef<HTMLInputElement>(null)

  // ─── 이메일 자동 포커스 ────────────────────────────────────────────────────────

  useEffect(() => {
    emailInputRef.current?.focus()
  }, [])

  // ─── Mutations ─────────────────────────────────────────────────────────────────

  // [TEMP] 26.07.27 백엔드 미연동 — 아래 실제 구현 참고용 타입/로직은 주석 처리. 연동 완료 시 주석 해제
  // import type { LoginRequest } from '../api/user'
  const loginMutation = useMutation({
    mutationFn: (_vars: { email: string; password: string; cfTurnstileResponse: string }) => {
      // [TEMP] 26.07.27 백엔드 미연동 — 항상 성공 처리. 연동 완료 시 아래 주석 해제하고 스텁 제거
      // const loginBody: LoginRequest = {
      //   email: vars.email,
      //   password: vars.password,
      //   deviceType: DEVICE_TYPE_WEB,
      //   cfTurnstileResponse: vars.cfTurnstileResponse,
      // }
      // return login(loginBody)
      const stubResponse: ApiResponse<LoginData> = {
        result: true,
        statusCode: 200,
        data: { type: 'T', token: createTempAccessToken() },
        message: [],
      }
      return Promise.resolve(stubResponse)
    },
    onSuccess: (res) => {
      setLoginFailCount(0)
      if (res.data?.type === 'T' && res.data.token) {
        sessionStorage.setItem('accessToken', res.data.token)
        setLoggedIn(true)
        void navigate({ to: '/main' })
      } else if (res.data?.type === 'O') {
        // 신규 기기(브라우저)로 판단됨 — 이메일 인증 단계로 이동. 신뢰 판단은 백엔드가
        // device-trust 쿠키로 하므로 프론트는 별도 식별값을 계산해 보내지 않는다.
        setPendingVerification({
          email: form.email,
          expiresAt: Date.now() + EMAIL_VERIFICATION_DURATION_MS,
        })
        void navigate({ to: '/login/verify' })
      }
    },
    onError: (err: unknown) => {
      if (err instanceof Error && err.message.includes('cf-turnstile')) {
        setTurnstileError('로봇 인증에 실패했습니다. 새로고침 후 다시 시도해주세요.')
        return
      }
      setLoginFailCount((prev) => {
        const next = Math.min(prev + 1, LOGIN_FAIL_LIMIT)
        if (next >= LOGIN_FAIL_LIMIT) {
          alert(LOGIN_LOCKED_MESSAGE)
        }
        return next
      })
    },
  })

  // ─── Event Handlers ───────────────────────────────────────────────────────────

  const handleLoginSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setTurnstileError(null)

    // 이메일/비밀번호 형식 오류는 입력란 하단 인라인 메시지로 이미 실시간 안내되므로 별도 alert
    // 없이 제출만 막는다.
    if (!isValidEmail(form.email)) {
      return
    }
    if (!isValidPassword(form.password)) {
      return
    }
    if (!turnstileToken) {
      setTurnstileError('로봇 인증을 완료해주세요.')
      return
    }

    if (rememberId) {
      saveEmail(form.email)
    } else {
      clearSavedEmail()
    }

    loginMutation.mutate({ ...form, cfTurnstileResponse: turnstileToken })
  }

  // ─── Render ───────────────────────────────────────────────────────────────────
  // 이메일/비밀번호 형식 오류는 입력란 하단에 실시간으로 안내한다. 로그인 실패(이메일/비밀번호
  // 불일치 등 서버 응답 기반 에러)도 비밀번호 입력란 하단에 실패 횟수와 함께 안내하며, 5회에
  // 도달하면 alert로 한 번 더 안내한다(위 loginMutation.onError 참고). 형식 오류가 있을 때는
  // 형식 오류 메시지를 우선 표시한다.

  const isEmailFormatInvalid = form.email.length > 0 && !isValidEmail(form.email)
  const emailMessage = emailHangulAttempted
    ? EMAIL_HANGUL_MESSAGE
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
          onChange={(e) => {
            const rawValue = e.target.value
            setEmailHangulAttempted(containsHangul(rawValue))
            setForm((f) => ({ ...f, email: removeHangul(rawValue) }))
          }}
          message={emailMessage}
        />
        <FormInput
          id="password"
          label="비밀번호"
          type="password"
          required
          placeholder="비밀번호를 입력해 주세요"
          value={form.password}
          onChange={(e) =>
            setForm((f) => ({ ...f, password: sanitizePasswordInput(e.target.value) }))
          }
          message={passwordMessage}
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
