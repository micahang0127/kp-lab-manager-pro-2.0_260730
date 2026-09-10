import type { TurnstileInstance } from '@marsidev/react-turnstile'
import { Turnstile } from '@marsidev/react-turnstile'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'

import { ApiError } from '../api'
import { login, verifyTurnstile } from '../api/auth'
import { AuthCardLayout, AuthFormActions } from '../components/auth'
import { ErrorToast } from '../components/error/ErrorToast'
import { ServerErrorBanner } from '../components/error/ServerErrorBanner'
import { FormCheckbox, FormInput } from '../components/form'
import { PasswordField } from '../components/password'
import { useAuthStore } from '../stores/authStore'
import { useFindAccountFlowStore } from '../stores/findAccountFlowStore'
import { useLoginFlowStore } from '../stores/loginFlowStore'
import { useRegisterFlowStore } from '../stores/registerFlowStore'
import { useSavedEmailStore } from '../stores/savedEmailStore'
import { getLoginDevice } from '../utils/device'
import {
  EMAIL_MAX_LENGTH,
  EMAIL_RULE_MESSAGE,
  HANGUL_INPUT_MESSAGE,
  isValidEmail,
} from '../utils/rules/validationRules'
import { useFingerprint } from '../utils/useFingerprint'
import { useHangulGuardedInput } from '../utils/useHangulGuardedInput'

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * 로그인 페이지 (Figma node-id=286:1751 기준).
 * 봇 차단(Turnstile) → 자격증명 로그인 → 신규 브라우저면 2차 인증(/login-verify)으로 이동,
 * 신뢰된 브라우저면 바로 로그인 완료까지 처리한다.
 */
export function LoginPage() {
  const navigate = useNavigate()
  const saveEmail = useSavedEmailStore((s) => s.saveEmail)
  const clearSavedEmail = useSavedEmailStore((s) => s.clearSavedEmail)
  const authLogin = useAuthStore((s) => s.login)
  const setPending = useLoginFlowStore((s) => s.setPending)
  const clearVerifiedIdentity = useFindAccountFlowStore((s) => s.clearVerifiedIdentity)
  const resetRegisterFlow = useRegisterFlowStore((s) => s.resetRegisterFlow)

  // 브라우저 식별 코드 — 쿠키에 이미 있으면 재사용하고, 없으면 마운트 시 자동 발급받는다.
  // 발급 전/실패 시 null이며, 이 경우 로그인 제출을 막는다(아래 handleSubmit 참고).
  const fingerprintCode = useFingerprint()

  // 자격증명 폼 상태 (아이디 저장 기능으로 저장된 이메일이 있으면 초기값으로 채움).
  // lazy initializer: 마운트 시 1회만 쿠키(스토어 경유)를 읽기 위함
  const [email, setEmail] = useState(() => useSavedEmailStore.getState().savedEmail ?? '')
  const [password, setPassword] = useState('')

  // 아이디 저장 체크박스 상태
  const [rememberEmail, setRememberEmail] = useState(
    () => !!useSavedEmailStore.getState().savedEmail
  )

  // Turnstile 검증 상태 — 서버(verifyTurnstile)가 위젯 토큰을 실제로 검증 완료했는지 여부
  // (로그인 제출 허용 기준). turnstileError는 로그인 API 호출 전 단계(로봇 인증 미완료,
  // 브라우저 확인 중)에서 제출을 막을 때의 안내 문구도 함께 담는다.
  const [turnstileVerified, setTurnstileVerified] = useState(false)
  const [turnstileError, setTurnstileError] = useState<string | null>(null)
  const turnstileRef = useRef<TurnstileInstance | null>(null)

  // 이메일 입력 — 한글(IME) 조합 중에는 값을 건드리지 않다가 조합이 끝난 시점에만 한글을
  // 제거해 반영한다(그렇지 않으면 조합이 깨지면서 엉뚱한 영문자가 입력되는 문제가 있음)
  const {
    hasHangulInput: emailHangulAttempted,
    handleChange: handleEmailChange,
    handleCompositionStart: handleEmailCompositionStart,
    handleCompositionEnd: handleEmailCompositionEnd,
  } = useHangulGuardedInput({ onChange: setEmail })

  // 이메일 입력란 자동 포커스
  const emailInputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    emailInputRef.current?.focus()
  }, [])

  // "아이디 저장" 체크 시에만 현재 이메일을 쿠키에 반영하고, 체크 해제 시 즉시 제거한다.
  // savedEmail을 구독하지 않는 이유는, 이 effect 자체가 store를 갱신하는 쪽이라 구독하면
  // 순환이 생기기 때문 — rememberEmail/email 변화만으로 충분하다.
  useEffect(() => {
    if (rememberEmail && email) {
      saveEmail(email)
    } else if (!rememberEmail) {
      clearSavedEmail()
    }
  }, [rememberEmail, email, saveEmail, clearSavedEmail])

  const isEmailFormatInvalid = email.length > 0 && !emailHangulAttempted && !isValidEmail(email)
  const emailMessage = emailHangulAttempted
    ? HANGUL_INPUT_MESSAGE
    : isEmailFormatInvalid
      ? EMAIL_RULE_MESSAGE
      : undefined

  // ─── Mutations ─────────────────────────────────────────────────────────────────

  // Turnstile 위젯이 토큰을 발급하는 즉시(onSuccess) 호출 — 토큰은 일회용·300초 만료이므로
  // 로그인 폼 제출을 기다리지 않고 최대한 빨리 서버 검증을 받아 실패를 미리 감지한다.
  //
  // 주의: 실패했다고 여기서 turnstileRef.current?.reset()을 자동 호출하면 안 된다 — 위젯은
  // reset() 직후 사용자 개입 없이 스스로 새 토큰을 발급하고(appearance: interaction-only),
  // 그 토큰이 다시 onSuccess → 이 mutation을 트리거한다. 서버 검증이 계속 실패하는 상황(예:
  // 서버 장애)이면 reset→발급→실패→reset…이 무한 루프로 이어진다. 실패 시에는 에러만 보여주고,
  // 재시도는 아래 배너의 "다시 시도" 버튼으로 사용자가 직접 트리거하게 한다.
  const verifyTurnstileMutation = useMutation({
    mutationFn: (token: string) => verifyTurnstile({ token }),
    onSuccess: (res) => {
      if (res.data?.isVerified) {
        setTurnstileVerified(true)
        setTurnstileError(null)
        return
      }
      setTurnstileVerified(false)
      setTurnstileError('로봇 인증에 실패했습니다. 다시 시도해주세요.')
    },
    onError: () => {
      setTurnstileVerified(false)
      setTurnstileError('로봇 인증 확인 중 오류가 발생했습니다. 다시 시도해주세요.')
    },
  })

  const loginMutation = useMutation({
    mutationFn: (vars: {
      email: string
      password: string
      fingerprintCode: string
      device: ReturnType<typeof getLoginDevice>
    }) => login(vars),
    onSuccess: (res, vars) => {
      if (!res.data) return

      if (res.data.isNewDevice) {
        setPending({
          email: vars.email,
          password: vars.password,
          fingerprintCode: vars.fingerprintCode,
          device: vars.device,
        })
        void navigate({ to: '/login-verify' })
        return
      }

      const { accessToken, userIdx, userName, orgIdx, orgName, userGrade } = res.data
      // isNewDevice: false인데 토큰이 없는 비정상 응답 방어
      if (!accessToken) return

      authLogin(accessToken, {
        userIdx: userIdx ?? '',
        userName: userName ?? '',
        orgIdx: orgIdx ?? '',
        orgName: orgName ?? '',
        userGrade: userGrade ?? 0,
      })
      void navigate({ to: '/main' })
    },
  })

  // ─── Event Handlers ───────────────────────────────────────────────────────────

  const canSubmit = isValidEmail(email) && password.length > 0 && !loginMutation.isPending

  // 아이디·비밀번호 찾기 / 회원가입은 이 버튼을 누른 시점부터 "새로 시작하는" 플로우다.
  // 두 플로우 store는 persist하지 않지만 새로고침 없이 화면만 오가면 값이 그대로 남아,
  // 초기화하지 않으면 이전에 마쳤던 본인인증 결과가 재사용되면서 본인인증 단계를 건너뛴다
  // (예: 찾기 → 본인인증 → 결과 → 로그인 → 다시 찾기 시 이전 결과 화면이 그대로 보임).
  // 진입 지점에서 한 번만 비우면 되므로 각 화면의 이탈 버튼에서는 따로 비우지 않는다.
  const handleGoFindAccount = () => {
    clearVerifiedIdentity()
    void navigate({ to: '/find-account' })
  }

  const handleGoRegister = () => {
    resetRegisterFlow()
    void navigate({ to: '/register' })
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!canSubmit) return

    if (!turnstileVerified) {
      setTurnstileError('로봇 인증을 완료해주세요.')
      return
    }
    if (!fingerprintCode) {
      setTurnstileError('브라우저 확인 중입니다. 잠시 후 다시 시도해주세요.')
      return
    }

    loginMutation.mutate({ email, password, fingerprintCode, device: getLoginDevice() })
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

  const serverErrorMessage =
    loginMutation.error instanceof Error ? loginMutation.error.message : null
  const isLockedOrInvalidCredentials =
    loginMutation.error instanceof ApiError && loginMutation.error.statusCode === 401

  return (
    <AuthCardLayout title="로그인" align="center" onSubmit={handleSubmit}>
      {/* [TEMP] 26.09.07 로고 자산 미확정 — Figma 원본도 벡터 없는 빈 placeholder다.
          자산 확정 시 이미지로 교체할 것 */}
      <div aria-hidden className="size-20 bg-[#e0e0e0]" />

      <div className="flex w-full flex-col items-start gap-5">
        <FormInput
          ref={emailInputRef}
          id="login-email"
          label="이메일 *"
          type="email"
          required
          hideRequiredMark
          maxLength={EMAIL_MAX_LENGTH}
          placeholder="이메일을 입력해 주세요"
          value={email}
          onChange={handleEmailChange}
          onCompositionStart={handleEmailCompositionStart}
          onCompositionEnd={handleEmailCompositionEnd}
          message={emailMessage}
        />
        <div className="flex w-full flex-col items-start gap-3">
          <PasswordField
            id="login-password"
            label="비밀번호 *"
            value={password}
            onChange={setPassword}
          />
          <div className="flex w-full items-center justify-between">
            <FormCheckbox
              id="login-remember-email"
              label="아이디 저장"
              checked={rememberEmail}
              onChange={setRememberEmail}
            />
            <button
              type="button"
              onClick={handleGoFindAccount}
              className="text-xs font-medium text-[#1a1a17] opacity-50"
            >
              아이디 · 비밀번호 찾기
            </button>
          </div>
        </div>
      </div>

      {serverErrorMessage && (
        <ErrorToast message={serverErrorMessage}>
          {isLockedOrInvalidCredentials && (
            <button
              type="button"
              onClick={handleGoFindAccount}
              className="text-left text-[10px] underline"
            >
              비밀번호 찾기
            </button>
          )}
        </ErrorToast>
      )}

      <AuthFormActions
        primaryLabel={loginMutation.isPending ? '로그인 중...' : '로그인'}
        primaryDisabled={!canSubmit}
        beforePrimary={
          <>
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

            {/* 로봇 인증 관련 안내는 위젯 바로 아래에 표시한다 — 로그인 실패 토스트
                (serverErrorMessage)와는 별도로, 어떤 단계에서 실패했는지 위젯과 붙여서
                보여주기 위함 */}
            {turnstileError && (
              <ServerErrorBanner message={turnstileError}>
                {/* 로봇 인증 실패 시 재시도는 사용자가 직접 트리거한다 — 자동 reset()은 서버
                    검증이 계속 실패할 때 무한 루프를 유발하므로 사용하지 않는다(위 mutation 주석 참고) */}
                <button
                  type="button"
                  onClick={() => {
                    setTurnstileError(null)
                    turnstileRef.current?.reset()
                  }}
                  className="text-left underline"
                >
                  다시 시도
                </button>
              </ServerErrorBanner>
            )}
          </>
        }
        secondaryLeft={<span className="opacity-50">QR 로그인(예정)</span>}
        secondaryRight={
          <button type="button" onClick={handleGoRegister}>
            회원가입
          </button>
        }
      />
    </AuthCardLayout>
  )
}
