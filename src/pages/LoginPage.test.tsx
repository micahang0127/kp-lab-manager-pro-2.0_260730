import { useNavigate } from '@tanstack/react-router'
import { cleanup, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import type { ReactNode, Ref } from 'react'
import { forwardRef, useImperativeHandle } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useAuthStore } from '../stores/authStore'
import { useFindAccountFlowStore } from '../stores/findAccountFlowStore'
import { useFingerprintStore } from '../stores/fingerprintStore'
import { useLoginFlowStore } from '../stores/loginFlowStore'
import { useRegisterFlowStore } from '../stores/registerFlowStore'
import { useSavedEmailStore } from '../stores/savedEmailStore'
import { server } from '../test/mocks/server'
import { render, screen } from '../test/test-utils'
import { getCookie } from '../utils/cookie'
import { EMAIL_RULE_MESSAGE, HANGUL_INPUT_MESSAGE } from '../utils/rules/validationRules'
import { LoginPage } from './LoginPage'

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: vi.fn(),
}))

// Turnstile 컴포넌트 mock (jsdom 환경에서 실제 렌더 불가). LoginPage가 검증 실패 시
// ref.reset()을 호출하므로 useImperativeHandle로 최소 구현을 제공한다.
interface MockTurnstileProps {
  onSuccess?: (token: string) => void
  onError?: () => void
  onExpire?: () => void
}

vi.mock('@marsidev/react-turnstile', () => ({
  Turnstile: forwardRef(function MockTurnstile(
    { onSuccess, onError, onExpire }: MockTurnstileProps,
    ref: Ref<{ reset: () => void }>
  ): ReactNode {
    useImperativeHandle(ref, () => ({ reset: vi.fn() }))
    return (
      <div>
        <button type="button" onClick={() => onSuccess?.('mock-token')}>
          turnstile-success
        </button>
        <button type="button" onClick={() => onError?.()}>
          turnstile-error
        </button>
        <button type="button" onClick={() => onExpire?.()}>
          turnstile-expire
        </button>
      </div>
    )
  }),
}))

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** 로그인 버튼을 눌러도 되는 상태(로봇 인증 완료)로 만든다 */
async function verifyTurnstile() {
  fireEvent.click(screen.getByText('turnstile-success'))
  await waitFor(() => {
    expect(screen.queryByText(/로봇 인증을 완료해주세요/)).not.toBeInTheDocument()
  })
}

// ─── Setup ─────────────────────────────────────────────────────────────────────

describe('LoginPage', () => {
  beforeEach(() => {
    vi.mocked(useNavigate).mockReturnValue(mockNavigate)
    vi.clearAllMocks()
    sessionStorage.clear()
    document.cookie = 'savedEmail=; max-age=0; path=/'
    document.cookie = 'fingerprintCode=; max-age=0; path=/'
    useAuthStore.setState({ isLoggedIn: false, userSession: null })
    useSavedEmailStore.setState({ savedEmail: null })
    useFingerprintStore.setState({ fingerprintCode: null })
    useLoginFlowStore.setState({ pending: null })
    useFindAccountFlowStore.getState().clearVerifiedIdentity()
    useRegisterFlowStore.getState().resetRegisterFlow()
    server.resetHandlers()

    // Turnstile 검증 API 기본 성공 핸들러 — 개별 테스트에서 실패 케이스를 검증할 때만 재정의
    server.use(
      http.post('*/v1/user/turnstile/verify', () =>
        HttpResponse.json({
          result: true,
          statusCode: 200,
          data: { isVerified: true },
          message: [],
        })
      )
    )
    // 핑거프린트 발급 API 기본 성공 핸들러 — useFingerprint가 마운트 시 자동 호출하므로 등록.
    // 발급 자체의 성공/실패/재사용 동작은 useFingerprint.test.ts에서 검증하므로 여기서는
    // 조용히 통과시키기만 한다
    server.use(
      http.get('*/v1/user/fingerprint', () =>
        HttpResponse.json({
          result: true,
          statusCode: 200,
          data: { fingerprintCode: 'mock-fingerprint-code' },
          message: [],
        })
      )
    )
  })

  afterEach(() => {
    cleanup()
  })

  // ─── UI ────────────────────────────────────────────────────────────────────

  it('"로그인" 제목이 렌더링된다', () => {
    render(<LoginPage />)
    expect(screen.getByRole('heading', { name: '로그인' })).toBeInTheDocument()
  })

  it('마운트 시 이메일 입력란에 자동으로 포커스된다', () => {
    render(<LoginPage />)
    expect(screen.getByLabelText('이메일 *')).toHaveFocus()
  })

  it('한글 입력 시 한글 안내 문구가 노출된다', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)
    await user.type(screen.getByLabelText('이메일 *'), '한글')
    expect(screen.getByText(HANGUL_INPUT_MESSAGE)).toBeInTheDocument()
  })

  it('이메일 형식이 아니면 형식 오류 문구가 노출되고, 올바르게 고치면 사라진다', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)
    const emailInput = screen.getByLabelText('이메일 *')
    await user.type(emailInput, 'invalid-email')
    expect(screen.getByText(EMAIL_RULE_MESSAGE)).toBeInTheDocument()
    await user.type(emailInput, '@test.com')
    expect(screen.queryByText(EMAIL_RULE_MESSAGE)).not.toBeInTheDocument()
  })

  it('"아이디 저장" 체크 시 쿠키에 저장되고, 체크 해제 시 제거된다', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)
    await user.type(screen.getByLabelText('이메일 *'), 'user@test.com')
    await user.click(screen.getByLabelText('아이디 저장'))
    expect(getCookie('savedEmail')).toBe('user@test.com')
    await user.click(screen.getByLabelText('아이디 저장'))
    expect(getCookie('savedEmail')).toBeNull()
  })

  it('이메일·비밀번호가 유효하지 않으면 로그인 버튼이 비활성화되고, 둘 다 유효하면 활성화된다', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)
    expect(screen.getByRole('button', { name: '로그인' })).toBeDisabled()
    await user.type(screen.getByLabelText('이메일 *'), 'user@test.com')
    expect(screen.getByRole('button', { name: '로그인' })).toBeDisabled()
    await user.type(screen.getByLabelText('비밀번호 *'), 'password1')
    expect(screen.getByRole('button', { name: '로그인' })).toBeEnabled()
  })

  it('"아이디 · 비밀번호 찾기" 클릭 시 /find-account로 이동한다', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)
    await user.click(screen.getByRole('button', { name: '아이디 · 비밀번호 찾기' }))
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/find-account' })
  })

  it('"아이디 · 비밀번호 찾기" 클릭 시 이전 본인인증 결과를 비워 본인인증부터 다시 하게 한다', async () => {
    const user = userEvent.setup()
    useFindAccountFlowStore.getState().setVerifiedIdentity({
      result: { isVerified: true, hasExistingAccount: false, maskedName: '홍길*' },
      identityVerificationCode: 'stale-find-account-id',
    })
    render(<LoginPage />)

    await user.click(screen.getByRole('button', { name: '아이디 · 비밀번호 찾기' }))

    expect(useFindAccountFlowStore.getState().verifiedIdentity).toBeNull()
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/find-account' })
  })

  it('"회원가입" 클릭 시 /register로 이동한다', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)
    await user.click(screen.getByRole('button', { name: '회원가입' }))
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/register' })
  })

  it('"회원가입" 클릭 시 중단된 이전 회원가입 플로우 값을 비워 본인인증부터 다시 하게 한다', async () => {
    const user = userEvent.setup()
    useRegisterFlowStore.getState().setIdentityVerifyResult(
      {
        isVerified: true,
        hasExistingAccount: false,
        maskedName: '홍길*',
      },
      'find-account'
    )
    useRegisterFlowStore.getState().setIdentityVerificationCode('stale-register-id')
    useRegisterFlowStore.getState().setTermsAgreement({ marketingOptIn: true })
    render(<LoginPage />)

    await user.click(screen.getByRole('button', { name: '회원가입' }))

    expect(useRegisterFlowStore.getState().identityVerifyResult).toBeNull()
    expect(useRegisterFlowStore.getState().identityVerifySource).toBeNull()
    expect(useRegisterFlowStore.getState().identityVerificationCode).toBeNull()
    expect(useRegisterFlowStore.getState().termsAgreement).toBeNull()
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/register' })
  })

  // ─── Turnstile (봇 차단) ────────────────────────────────────────────────────

  describe('Turnstile (봇 차단)', () => {
    it('로봇 인증 전 제출하면 로그인 API를 호출하지 않고 안내 문구를 표시한다', async () => {
      const user = userEvent.setup()
      let loginCalled = false
      server.use(
        http.post('*/v1/user/login', () => {
          loginCalled = true
          return HttpResponse.json({ result: true, statusCode: 201, data: {}, message: [] })
        })
      )
      render(<LoginPage />)

      await user.type(screen.getByLabelText('이메일 *'), 'user@test.com')
      await user.type(screen.getByLabelText('비밀번호 *'), 'password1')
      await user.click(screen.getByRole('button', { name: '로그인' }))

      expect(await screen.findByText(/로봇 인증을 완료해주세요/)).toBeInTheDocument()
      expect(loginCalled).toBe(false)
    })

    it('Turnstile 인증 실패 시 안내 문구를 표시한다', async () => {
      render(<LoginPage />)
      fireEvent.click(screen.getByText('turnstile-error'))
      expect(await screen.findByText(/로봇 인증에 실패했습니다/)).toBeInTheDocument()
    })

    it('Turnstile 인증 만료 후 제출하면 다시 로봇 인증을 요구한다', async () => {
      const user = userEvent.setup()
      render(<LoginPage />)
      await verifyTurnstile()

      fireEvent.click(screen.getByText('turnstile-expire'))
      expect(await screen.findByText(/로봇 인증이 만료되었습니다/)).toBeInTheDocument()

      await user.type(screen.getByLabelText('이메일 *'), 'user@test.com')
      await user.type(screen.getByLabelText('비밀번호 *'), 'password1')
      await user.click(screen.getByRole('button', { name: '로그인' }))

      expect(await screen.findByText(/로봇 인증을 완료해주세요/)).toBeInTheDocument()
    })
  })

  // ─── 로그인 API 연동 ──────────────────────────────────────────────────────────

  describe('로그인', () => {
    it('신뢰된 브라우저(isNewDevice: false)면 토큰을 저장하고 /main으로 이동한다', async () => {
      const user = userEvent.setup()
      server.use(
        http.post('*/v1/user/login', () =>
          HttpResponse.json({
            result: true,
            statusCode: 201,
            data: {
              isNewDevice: false,
              accessToken: 'access-token-abc',
              userIdx: '1',
              userName: '홍길동',
              orgIdx: '1',
              orgName: '테스트 회사',
              userGrade: 0,
            },
            message: [],
          })
        )
      )
      render(<LoginPage />)
      await verifyTurnstile()

      await user.type(screen.getByLabelText('이메일 *'), 'user@koreapetroleum.com')
      await user.type(screen.getByLabelText('비밀번호 *'), 'password1')
      await user.click(screen.getByRole('button', { name: '로그인' }))

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith({ to: '/main' })
      })
      expect(sessionStorage.getItem('accessToken')).toBe('access-token-abc')
      expect(useAuthStore.getState().isLoggedIn).toBe(true)
    })

    it('신규 브라우저(isNewDevice: true)면 pending을 채우고 /login-verify로 이동하며 토큰을 저장하지 않는다', async () => {
      const user = userEvent.setup()
      server.use(
        http.post('*/v1/user/login', () =>
          HttpResponse.json({
            result: true,
            statusCode: 201,
            data: { isNewDevice: true },
            message: [],
          })
        )
      )
      render(<LoginPage />)
      await verifyTurnstile()

      await user.type(screen.getByLabelText('이메일 *'), 'user@koreapetroleum.com')
      await user.type(screen.getByLabelText('비밀번호 *'), 'password1')
      await user.click(screen.getByRole('button', { name: '로그인' }))

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith({ to: '/login-verify' })
      })
      expect(useLoginFlowStore.getState().pending).toEqual({
        email: 'user@koreapetroleum.com',
        password: 'password1',
        fingerprintCode: 'mock-fingerprint-code',
        device: expect.any(String),
      })
      expect(sessionStorage.getItem('accessToken')).toBeNull()
    })

    it('401 실패 시 서버 메시지가 그대로 배너에 노출되고 별도 "비밀번호 찾기" 링크는 보이지 않는다', async () => {
      const user = userEvent.setup()
      server.use(
        http.post('*/v1/user/login', () =>
          HttpResponse.json(
            {
              result: false,
              statusCode: 401,
              data: null,
              message: [
                '이메일 또는 비밀번호가 올바르지 않습니다. 5회 연속 틀리면 계정이 15분 잠깁니다 (남은 시도 4회). 비밀번호가 기억나지 않으면 비밀번호 찾기를 이용해주세요',
              ],
            },
            { status: 401 }
          )
        )
      )
      render(<LoginPage />)
      await verifyTurnstile()

      await user.type(screen.getByLabelText('이메일 *'), 'user@koreapetroleum.com')
      await user.type(screen.getByLabelText('비밀번호 *'), 'wrong-password')
      await user.click(screen.getByRole('button', { name: '로그인' }))

      expect(await screen.findByText(/남은 시도 4회/)).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: '비밀번호 찾기' })).not.toBeInTheDocument()
    })

    it('로그인 요청 body에 fingerprintCode와 device가 포함된다', async () => {
      const user = userEvent.setup()
      let receivedBody: Record<string, unknown> | null = null
      server.use(
        http.post('*/v1/user/login', async ({ request }) => {
          receivedBody = (await request.json()) as Record<string, unknown>
          return HttpResponse.json({
            result: true,
            statusCode: 201,
            data: { isNewDevice: true },
            message: [],
          })
        })
      )
      render(<LoginPage />)
      await verifyTurnstile()

      await user.type(screen.getByLabelText('이메일 *'), 'user@koreapetroleum.com')
      await user.type(screen.getByLabelText('비밀번호 *'), 'password1')
      await user.click(screen.getByRole('button', { name: '로그인' }))

      await waitFor(() => {
        expect(receivedBody).toMatchObject({
          email: 'user@koreapetroleum.com',
          password: 'password1',
          fingerprintCode: 'mock-fingerprint-code',
        })
        expect(['W', 'M', 'T']).toContain(receivedBody?.device)
      })
    })
  })
})
