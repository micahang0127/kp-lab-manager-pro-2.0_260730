import { useNavigate } from '@tanstack/react-router'
import { cleanup, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { forwardRef, useImperativeHandle } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useAuthStore } from '../stores/authStore'
import { useLoginFlowStore } from '../stores/loginFlowStore'
import { useSavedEmailStore } from '../stores/savedEmailStore'
import { server } from '../test/mocks/server'
import { render, screen } from '../test/test-utils'
import { getCookie } from '../utils/cookie'
import { LoginPage } from './LoginPage'

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: vi.fn(),
}))

// Turnstile 컴포넌트 mock (jsdom 환경에서 실제 렌더 불가). LoginPage가 검증 실패 시
// ref.reset()을 호출하므로 useImperativeHandle로 최소 구현을 제공한다.
vi.mock('@marsidev/react-turnstile', () => ({
  Turnstile: forwardRef(({ onSuccess, onError, onExpire }: any, ref: any) => {
    useImperativeHandle(ref, () => ({ reset: vi.fn() }))
    return (
      <div>
        <button type="button" onClick={() => onSuccess && onSuccess('mock-token')}>
          turnstile-success
        </button>
        <button type="button" onClick={() => onError && onError()}>
          turnstile-error
        </button>
        <button type="button" onClick={() => onExpire && onExpire()}>
          turnstile-expire
        </button>
      </div>
    )
  }),
}))

// ─── Setup ─────────────────────────────────────────────────────────────────────

describe('LoginPage', () => {
  beforeEach(() => {
    sessionStorage.clear()
    document.cookie = 'savedEmail=; max-age=0; path=/'
    useAuthStore.setState({ isLoggedIn: false })
    useSavedEmailStore.setState({ savedEmail: null })
    useLoginFlowStore.setState({ pending: null })
    vi.mocked(useNavigate).mockReturnValue(mockNavigate)
    vi.clearAllMocks()
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
  })

  afterEach(() => {
    cleanup()
  })

  // ─── Turnstile Tests ─────────────────────────────────────────────────────────

  describe('Turnstile (봇 차단)', () => {
    it('Turnstile 인증 성공 시 에러 메시지가 표시되지 않는다', async () => {
      render(<LoginPage />)

      // 이메일/비밀번호 입력 (HTML5 validation 통과를 위함)
      await userEvent.type(screen.getByLabelText(/이메일/), 'test@test.com')
      await userEvent.type(screen.getByLabelText(/비밀번호/), 'password1')

      // 처음에는 토큰 없이 제출 시도하여 에러 발생시킴
      const submitButton = screen.getByRole('button', { name: /^로그인$/ })
      await userEvent.click(submitButton)
      expect(await screen.findByText(/로봇 인증을 완료해주세요/)).toBeInTheDocument()

      // Turnstile 성공 버튼 클릭 (단순 mock 버튼이므로 fireEvent 사용)
      const successBtn = screen.getByText('turnstile-success')
      fireEvent.click(successBtn)

      // "로봇 인증을 완료해주세요" 메시지가 사라지는지 확인
      await waitFor(() => {
        expect(screen.queryByText(/로봇 인증을 완료해주세요/)).not.toBeInTheDocument()
      })
    })

    it('Turnstile 인증 실패 시 에러 메시지가 표시된다', async () => {
      render(<LoginPage />)
      const errorBtn = screen.getByText('turnstile-error')
      fireEvent.click(errorBtn)
      expect(await screen.findByText(/로봇 인증에 실패했습니다/)).toBeInTheDocument()
    })

    it('Turnstile 인증 만료 시 에러 메시지가 표시된다', async () => {
      render(<LoginPage />)
      const expireBtn = screen.getByText('turnstile-expire')
      fireEvent.click(expireBtn)
      expect(await screen.findByText(/로봇 인증이 만료되었습니다/)).toBeInTheDocument()
    })

    it('Turnstile 토큰 없이 로그인 시도하면 에러 메시지가 표시된다', async () => {
      render(<LoginPage />)
      const emailInput = screen.getByLabelText(/이메일/)
      const passwordInput = screen.getByLabelText(/비밀번호/)
      const submitButton = screen.getByRole('button', { name: /^로그인$/ })
      await userEvent.type(emailInput, 'user@test.com')
      await userEvent.type(passwordInput, 'password123')
      await userEvent.click(submitButton)
      expect(await screen.findByText(/로봇 인증을 완료해주세요/)).toBeInTheDocument()
    })

    it('Turnstile 검증 API가 isVerified: false를 반환하면 에러 메시지가 표시된다', async () => {
      server.use(
        http.post('*/v1/user/turnstile/verify', () =>
          HttpResponse.json({
            result: true,
            statusCode: 200,
            data: { isVerified: false, errorCodes: ['timeout-or-duplicate'] },
            message: [],
          })
        )
      )

      render(<LoginPage />)
      const successBtn = screen.getByText('turnstile-success')
      fireEvent.click(successBtn)

      expect(await screen.findByText(/로봇 인증에 실패했습니다/)).toBeInTheDocument()
    })

    it('Cloudflare와 통신 자체가 실패하면(502) 에러 메시지가 표시된다', async () => {
      server.use(
        http.post('*/v1/user/turnstile/verify', () =>
          HttpResponse.json(
            {
              result: false,
              statusCode: 502,
              data: null,
              message: ['Cloudflare 서버와 통신에 실패했습니다.'],
            },
            { status: 502 }
          )
        )
      )

      render(<LoginPage />)
      const successBtn = screen.getByText('turnstile-success')
      fireEvent.click(successBtn)

      expect(await screen.findByText(/로봇 인증 확인 중 오류가 발생했습니다/)).toBeInTheDocument()
    })
  })

  // ─── Credential Login Tests ──────────────────────────────────────────────────

  describe('로그인 폼 (UI 및 입력)', () => {
    it('폼 입력값이 유지된다', async () => {
      render(<LoginPage />)

      const emailInput = screen.getByLabelText(/이메일/) as HTMLInputElement
      const passwordInput = screen.getByLabelText(/비밀번호/) as HTMLInputElement

      await userEvent.type(emailInput, 'test@example.com')
      await userEvent.type(passwordInput, 'test123')

      expect(emailInput.value).toBe('test@example.com')
      expect(passwordInput.value).toBe('test123')
    })

    it('진입 시 이메일 입력란에 자동으로 포커스된다', () => {
      render(<LoginPage />)

      expect(screen.getByLabelText(/이메일/)).toHaveFocus()
    })

    it('이메일/비밀번호 입력란에 안내 placeholder가 표시된다', () => {
      render(<LoginPage />)

      expect(screen.getByPlaceholderText('이메일을 입력해 주세요')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('비밀번호를 입력해 주세요')).toBeInTheDocument()
    })

    it('이메일/비밀번호 라벨 옆에 필수 입력 표시(*)가 렌더링된다', () => {
      render(<LoginPage />)

      expect(screen.getAllByText('*')).toHaveLength(2)
    })

    it('이메일 입력 시 한글은 즉시 제거된다', async () => {
      render(<LoginPage />)
      const emailInput = screen.getByLabelText(/이메일/) as HTMLInputElement

      await userEvent.type(emailInput, 'test한글abc')

      expect(emailInput.value).toBe('testabc')
    })

    it('비밀번호 입력 시 한글/공백 등 허용되지 않는 문자는 즉시 제거된다', async () => {
      render(<LoginPage />)
      const passwordInput = screen.getByLabelText(/비밀번호/) as HTMLInputElement

      await userEvent.type(passwordInput, 'abc 한글123!@')

      expect(passwordInput.value).toBe('abc123!@')
    })

    it('이메일에 한글(한글 키보드) 입력을 시도하면 입력란 아래에 오류 메시지가 표시된다', async () => {
      render(<LoginPage />)
      const emailInput = screen.getByLabelText(/이메일/)

      await userEvent.type(emailInput, 'test한글')

      expect(await screen.findByText('한글은 입력불가합니다.')).toBeInTheDocument()
    })

    it('한글 입력 시도 후 정상 문자를 입력하면 한글 오류 메시지가 사라진다', async () => {
      render(<LoginPage />)
      const emailInput = screen.getByLabelText(/이메일/)

      await userEvent.type(emailInput, 'test한글')
      expect(await screen.findByText('한글은 입력불가합니다.')).toBeInTheDocument()

      await userEvent.type(emailInput, 'abc')

      expect(screen.queryByText('한글은 입력불가합니다.')).not.toBeInTheDocument()
    })

    it('이메일 형식이 아니면 입력란 아래에 오류 메시지가 표시된다', async () => {
      render(<LoginPage />)
      const emailInput = screen.getByLabelText(/이메일/)

      await userEvent.type(emailInput, 'invalid-email')

      expect(await screen.findByText('이메일 형식에 맞지 않습니다.')).toBeInTheDocument()
    })

    it('이메일 형식이 올바르면 오류 메시지가 표시되지 않는다', async () => {
      render(<LoginPage />)
      const emailInput = screen.getByLabelText(/이메일/)

      await userEvent.type(emailInput, 'user@test.com')

      expect(screen.queryByText('이메일 형식에 맞지 않습니다.')).not.toBeInTheDocument()
    })

    it('비밀번호가 정규식(영문+숫자 조합, 8자 이상)에 맞지 않으면 입력란 아래에 오류 메시지가 표시된다', async () => {
      render(<LoginPage />)
      const passwordInput = screen.getByLabelText(/비밀번호/)

      // 영문만 입력 (숫자 미포함)
      await userEvent.type(passwordInput, 'abcdefgh')

      expect(await screen.findByText('비밀번호 형식에 맞지 않습니다.')).toBeInTheDocument()
    })

    it('비밀번호가 정규식에 맞으면 오류 메시지가 표시되지 않는다', async () => {
      render(<LoginPage />)
      const passwordInput = screen.getByLabelText(/비밀번호/)

      await userEvent.type(passwordInput, 'password1')

      expect(screen.queryByText('비밀번호 형식에 맞지 않습니다.')).not.toBeInTheDocument()
    })

    it('이메일 형식이 아니면 alert 없이 인라인 메시지만 표시하고 로그인 요청을 보내지 않는다', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
      render(<LoginPage />)

      fireEvent.click(screen.getByText('turnstile-success'))
      await userEvent.type(screen.getByLabelText(/이메일/), 'invalid-email')
      await userEvent.type(screen.getByLabelText(/비밀번호/), 'password123')
      await userEvent.click(screen.getByRole('button', { name: /^로그인$/ }))

      expect(screen.getByText('이메일 형식에 맞지 않습니다.')).toBeInTheDocument()
      expect(alertSpy).not.toHaveBeenCalled()
      expect(sessionStorage.getItem('accessToken')).toBeNull()
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('비밀번호가 8자 미만이면 alert 없이 인라인 메시지만 표시하고 로그인 요청을 보내지 않는다', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
      render(<LoginPage />)

      fireEvent.click(screen.getByText('turnstile-success'))
      await userEvent.type(screen.getByLabelText(/이메일/), 'user@test.com')
      await userEvent.type(screen.getByLabelText(/비밀번호/), 'pass1')
      await userEvent.click(screen.getByRole('button', { name: /^로그인$/ }))

      expect(screen.getByText('비밀번호 형식에 맞지 않습니다.')).toBeInTheDocument()
      expect(alertSpy).not.toHaveBeenCalled()
      expect(sessionStorage.getItem('accessToken')).toBeNull()
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('비밀번호가 영문/숫자 조합이 아니면 alert 없이 인라인 메시지만 표시하고 로그인 요청을 보내지 않는다', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
      render(<LoginPage />)

      fireEvent.click(screen.getByText('turnstile-success'))
      await userEvent.type(screen.getByLabelText(/이메일/), 'user@test.com')
      await userEvent.type(screen.getByLabelText(/비밀번호/), '12345678')
      await userEvent.click(screen.getByRole('button', { name: /^로그인$/ }))

      expect(screen.getByText('비밀번호 형식에 맞지 않습니다.')).toBeInTheDocument()
      expect(alertSpy).not.toHaveBeenCalled()
      expect(sessionStorage.getItem('accessToken')).toBeNull()
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('로그인 실패(이메일 또는 비밀번호 불일치) 시 비밀번호 입력란 아래에 실패 횟수와 함께 안내한다', async () => {
      server.use(
        http.post('*/user/login', () =>
          HttpResponse.json(
            {
              result: false,
              statusCode: 401,
              data: null,
              message: ['이메일 또는 비밀번호가 틀렸습니다.'],
            },
            { status: 401 }
          )
        )
      )

      render(<LoginPage />)

      fireEvent.click(screen.getByText('turnstile-success'))
      await userEvent.type(screen.getByLabelText(/이메일/), 'user@test.com')
      await userEvent.type(screen.getByLabelText(/비밀번호/), 'wrongpass1')
      await userEvent.click(screen.getByRole('button', { name: /^로그인$/ }))

      expect(
        await screen.findByText('이메일 또는 비밀번호를 확인해 주세요. (실패 1/5)')
      ).toBeInTheDocument()
      expect(sessionStorage.getItem('accessToken')).toBeNull()
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('로그인을 5회 실패하면 alert로 일시적 제한을 안내한다', async () => {
      server.use(
        http.post('*/user/login', () =>
          HttpResponse.json(
            {
              result: false,
              statusCode: 401,
              data: null,
              message: ['이메일 또는 비밀번호가 틀렸습니다.'],
            },
            { status: 401 }
          )
        )
      )
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})

      render(<LoginPage />)

      fireEvent.click(screen.getByText('turnstile-success'))
      await userEvent.type(screen.getByLabelText(/이메일/), 'user@test.com')
      await userEvent.type(screen.getByLabelText(/비밀번호/), 'wrongpass1')

      const submitButton = screen.getByRole('button', { name: /^로그인$/ })
      for (let i = 0; i < 5; i++) {
        await userEvent.click(submitButton)
        await waitFor(() => {
          expect(
            screen.getByText(`이메일 또는 비밀번호를 확인해 주세요. (실패 ${i + 1}/5)`)
          ).toBeInTheDocument()
        })
      }

      expect(alertSpy).toHaveBeenCalledWith('로그인이 일시적으로 제한되었습니다.')
      expect(sessionStorage.getItem('accessToken')).toBeNull()
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('이메일과 비밀번호를 입력하고 로그인할 수 있다', async () => {
      server.use(
        http.post('*/user/login', () =>
          HttpResponse.json({
            result: true,
            statusCode: 200,
            data: { type: 'T', token: 'new-token-123' },
            message: [],
          })
        )
      )

      render(<LoginPage />)

      fireEvent.click(screen.getByText('turnstile-success'))
      const emailInput = screen.getByLabelText(/이메일/)
      const passwordInput = screen.getByLabelText(/비밀번호/)
      const submitButton = screen.getByRole('button', { name: /^로그인$/ })

      await userEvent.type(emailInput, 'user@test.com')
      await userEvent.type(passwordInput, 'password123')
      await userEvent.click(submitButton)

      await waitFor(() => {
        expect(sessionStorage.getItem('accessToken')).toBe('new-token-123')
        expect(useAuthStore.getState().isLoggedIn).toBe(true)
        expect(mockNavigate).toHaveBeenCalledWith({ to: '/main' })
      })
    })

    // ('로그인 실패 시 에러 메시지를 표시한다' 테스트는 위쪽 '로그인 실패(이메일 또는 비밀번호
    // 불일치) 시 비밀번호 입력란 아래에 실패 횟수와 함께 안내한다' 테스트로 대체됨 — 실제 안내
    // 문구는 서버 message가 아니라 고정된 "실패 N/5" 카운트 문구를 사용하기 때문)

    it('로그인 중에는 버튼이 disabled 상태다', async () => {
      let resolveLogin: () => void = () => {}
      const loginPromise = new Promise<void>((resolve) => {
        resolveLogin = resolve
      })

      server.use(
        http.post('*/user/login', async () => {
          await loginPromise
          return HttpResponse.json({
            result: true,
            statusCode: 200,
            data: { type: 'T', token: 'token' },
            message: [],
          })
        })
      )

      render(<LoginPage />)

      fireEvent.click(screen.getByText('turnstile-success'))
      const emailInput = screen.getByLabelText(/이메일/)
      const passwordInput = screen.getByLabelText(/비밀번호/)
      const submitButton = screen.getByRole('button', { name: /^로그인$/ })

      await userEvent.type(emailInput, 'user@test.com')
      await userEvent.type(passwordInput, 'password123')
      await userEvent.click(submitButton)

      expect(submitButton).toBeDisabled()
      expect(submitButton).toHaveTextContent(/로그인 중/)

      resolveLogin()
      // 로그인 완료까지 대기하여 act 경고 방지
      await waitFor(() => expect(submitButton).not.toBeDisabled())
    })
  })

  // ─── Save Email (아이디 저장) Tests ──────────────────────────────────────────

  describe('아이디 저장', () => {
    it('"아이디 저장" 체크박스가 렌더링된다', () => {
      render(<LoginPage />)

      expect(screen.getByLabelText('아이디 저장')).toBeInTheDocument()
    })

    it('체크박스를 체크하고 로그인하면 이메일이 쿠키에 저장된다', async () => {
      server.use(
        http.post('*/user/login', () =>
          HttpResponse.json({
            result: true,
            statusCode: 200,
            data: { type: 'T', token: 'token' },
            message: [],
          })
        )
      )

      render(<LoginPage />)

      fireEvent.click(screen.getByText('turnstile-success'))
      await userEvent.type(screen.getByLabelText(/이메일/), 'user@test.com')
      await userEvent.type(screen.getByLabelText(/비밀번호/), 'password123')
      await userEvent.click(screen.getByLabelText('아이디 저장'))
      await userEvent.click(screen.getByRole('button', { name: /^로그인$/ }))

      await waitFor(() => {
        expect(getCookie('savedEmail')).toBe('user@test.com')
      })
    })

    it('체크박스를 체크하지 않고 로그인하면 저장된 이메일이 없다', async () => {
      server.use(
        http.post('*/user/login', () =>
          HttpResponse.json({
            result: true,
            statusCode: 200,
            data: { type: 'T', token: 'token' },
            message: [],
          })
        )
      )

      render(<LoginPage />)

      fireEvent.click(screen.getByText('turnstile-success'))
      await userEvent.type(screen.getByLabelText(/이메일/), 'user@test.com')
      await userEvent.type(screen.getByLabelText(/비밀번호/), 'password123')
      await userEvent.click(screen.getByRole('button', { name: /^로그인$/ }))

      await waitFor(() => {
        expect(sessionStorage.getItem('accessToken')).toBeTruthy()
      })
      expect(getCookie('savedEmail')).toBeNull()
    })

    it('이전에 저장된 이메일이 있으면 이메일 입력란에 자동으로 채워지고 체크박스가 체크된 상태로 시작한다', () => {
      useSavedEmailStore.setState({ savedEmail: 'saved@test.com' })

      render(<LoginPage />)

      expect(screen.getByLabelText(/이메일/)).toHaveValue('saved@test.com')
      expect(screen.getByLabelText('아이디 저장')).toBeChecked()
    })
  })

  // ─── 신규 기기 로그인 → 이메일 인증 이동 Tests ────────────────────────────────
  // 실제 이메일 인증 입력/제출 케이스는 EmailVerificationPage.test.tsx에서 검증한다 —
  // 이 페이지는 /login/verify로의 이동만 담당

  describe('로그인 폼 (신규 기기 판별)', () => {
    it('type O 응답 시 이메일 인증 대기 상태를 저장하고 /login/verify로 이동한다', async () => {
      server.use(
        http.post('*/user/login', () =>
          HttpResponse.json({
            result: true,
            statusCode: 200,
            data: { type: 'O' },
            message: [],
          })
        )
      )

      render(<LoginPage />)

      fireEvent.click(screen.getByText('turnstile-success'))
      await userEvent.type(screen.getByLabelText(/이메일/), 'user@test.com')
      await userEvent.type(screen.getByLabelText(/비밀번호/), 'password123')
      await userEvent.click(screen.getByRole('button', { name: /^로그인$/ }))

      await waitFor(() => {
        expect(useLoginFlowStore.getState().pending?.email).toBe('user@test.com')
        expect(mockNavigate).toHaveBeenCalledWith({ to: '/login/verify' })
      })
    })
  })

  // ─── Register Navigation Tests ───────────────────────────────────────────────
  // 본인인증(핸드폰인증) 기능은 회원가입 페이지로 이동됨 — src/components/identityVerification 참고

  describe('회원가입 이동', () => {
    it('회원가입 버튼을 클릭하면 /register로 이동한다', async () => {
      render(<LoginPage />)
      await userEvent.click(screen.getByRole('button', { name: /^회원가입$/ }))

      expect(mockNavigate).toHaveBeenCalledWith({ to: '/register' })
    })
  })
})
