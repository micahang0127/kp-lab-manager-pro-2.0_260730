import { useNavigate } from '@tanstack/react-router'
import { cleanup, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useAuthStore } from '../stores/authStore'
import { useSavedEmailStore } from '../stores/savedEmailStore'
import { server } from '../test/mocks/server'
import { render, screen } from '../test/test-utils'
import { getCookie } from '../utils/cookie'
import { isAuthValid } from '../utils/requireAuth'
import { LoginPage } from './LoginPage'

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: vi.fn(),
}))

vi.mock('../utils/fingerprint', () => ({
  getFingerprint: vi.fn().mockResolvedValue('mock-fingerprint-abc123'),
}))

// Turnstile 컴포넌트 mock (jsdom 환경에서 실제 렌더 불가)
vi.mock('@marsidev/react-turnstile', () => ({
  Turnstile: ({ onSuccess, onError, onExpire }: any) => (
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
  ),
}))

// ─── Setup ─────────────────────────────────────────────────────────────────────

describe('LoginPage', () => {
  beforeEach(() => {
    sessionStorage.clear()
    document.cookie = 'savedEmail=; max-age=0; path=/'
    useAuthStore.setState({ isLoggedIn: false })
    useSavedEmailStore.setState({ savedEmail: null })
    vi.mocked(useNavigate).mockReturnValue(mockNavigate)
    vi.clearAllMocks()
    server.resetHandlers()
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

    // [TEMP] 백엔드 연동 후 주석 해제
    // it('Turnstile 토큰이 잘못되면 서버에서 에러 메시지를 반환한다', async () => {
    //   server.use(
    //     http.post('*/user/login', () =>
    //       HttpResponse.json(
    //         {
    //           result: false,
    //           statusCode: 401,
    //           data: null,
    //           message: ['로봇 인증에 실패했습니다.'],
    //         },
    //         { status: 401 }
    //       )
    //     )
    //   )
    //
    //   render(<LoginPage />)
    //   const successBtn = screen.getByText('turnstile-success')
    //   fireEvent.click(successBtn)
    //   const emailInput = screen.getByLabelText(/이메일/)
    //   const passwordInput = screen.getByLabelText(/비밀번호/)
    //   const submitButton = screen.getByRole('button', { name: /^로그인$/ })
    //   await userEvent.type(emailInput, 'user@test.com')
    //   await userEvent.type(passwordInput, 'password123')
    //   await userEvent.click(submitButton)
    //   expect(await screen.findByText(/로봇 인증에 실패했습니다/)).toBeInTheDocument()
    // })
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

    // [TEMP] 26.07.27 백엔드 미연동 — 로그인 API가 항상 성공한다고 가정한 스텁 동작 검증.
    // 연동 완료 시 이 테스트를 삭제하고 아래 [FUTURE WORK] 테스트들의 주석을 해제할 것
    it('TEMP: 이메일과 비밀번호를 입력하고 제출하면 항상 로그인에 성공하여 /main으로 이동한다', async () => {
      render(<LoginPage />)

      fireEvent.click(screen.getByText('turnstile-success'))
      const emailInput = screen.getByLabelText(/이메일/)
      const passwordInput = screen.getByLabelText(/비밀번호/)
      const submitButton = screen.getByRole('button', { name: /^로그인$/ })

      await userEvent.type(emailInput, 'user@test.com')
      await userEvent.type(passwordInput, 'password123')
      await userEvent.click(submitButton)

      await waitFor(() => {
        const token = sessionStorage.getItem('accessToken')
        expect(token).toBeTruthy()
        // requireAuth 라우트 가드(JWT 형식 + 만료 검증)를 통과하는 토큰이어야 함
        expect(isAuthValid()).toBe(true)
        expect(useAuthStore.getState().isLoggedIn).toBe(true)
        expect(mockNavigate).toHaveBeenCalledWith({ to: '/main' })
      })
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

    // [FUTURE WORK] 백엔드 연동 후 주석 해제
    // it('로그인 실패(이메일 또는 비밀번호 불일치) 시 비밀번호 입력란 아래에 실패 횟수와 함께 안내한다', async () => {
    //   server.use(
    //     http.post('*/user/login', () =>
    //       HttpResponse.json(
    //         {
    //           result: false,
    //           statusCode: 401,
    //           data: null,
    //           message: ['이메일 또는 비밀번호가 틀렸습니다.'],
    //         },
    //         { status: 401 }
    //       )
    //     )
    //   )
    //
    //   render(<LoginPage />)
    //
    //   fireEvent.click(screen.getByText('turnstile-success'))
    //   await userEvent.type(screen.getByLabelText(/이메일/), 'user@test.com')
    //   await userEvent.type(screen.getByLabelText(/비밀번호/), 'wrongpass1')
    //   await userEvent.click(screen.getByRole('button', { name: /^로그인$/ }))
    //
    //   expect(
    //     await screen.findByText('이메일 또는 비밀번호를 확인해 주세요. (실패 1/5)')
    //   ).toBeInTheDocument()
    //   expect(sessionStorage.getItem('accessToken')).toBeNull()
    //   expect(mockNavigate).not.toHaveBeenCalled()
    // })
    //
    // it('로그인을 5회 실패하면 alert로 일시적 제한을 안내한다', async () => {
    //   server.use(
    //     http.post('*/user/login', () =>
    //       HttpResponse.json(
    //         {
    //           result: false,
    //           statusCode: 401,
    //           data: null,
    //           message: ['이메일 또는 비밀번호가 틀렸습니다.'],
    //         },
    //         { status: 401 }
    //       )
    //     )
    //   )
    //   const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    //
    //   render(<LoginPage />)
    //
    //   fireEvent.click(screen.getByText('turnstile-success'))
    //   await userEvent.type(screen.getByLabelText(/이메일/), 'user@test.com')
    //   await userEvent.type(screen.getByLabelText(/비밀번호/), 'wrongpass1')
    //
    //   const submitButton = screen.getByRole('button', { name: /^로그인$/ })
    //   for (let i = 0; i < 5; i++) {
    //     await userEvent.click(submitButton)
    //     await waitFor(() => {
    //       expect(
    //         screen.getByText(`이메일 또는 비밀번호를 확인해 주세요. (실패 ${i + 1}/5)`)
    //       ).toBeInTheDocument()
    //     })
    //   }
    //
    //   expect(alertSpy).toHaveBeenCalledWith('로그인이 일시적으로 제한되었습니다.')
    //   expect(sessionStorage.getItem('accessToken')).toBeNull()
    //   expect(mockNavigate).not.toHaveBeenCalled()
    // })
    //
    // it('이메일과 비밀번호를 입력하고 로그인할 수 있다', async () => {
    //   server.use(
    //     http.post('*/user/login', () =>
    //       HttpResponse.json({
    //         result: true,
    //         statusCode: 200,
    //         data: { type: 'T', token: 'new-token-123' },
    //         message: [],
    //       })
    //     )
    //   )
    //
    //   render(<LoginPage />)
    //
    //   fireEvent.click(screen.getByText('turnstile-success'))
    //   const emailInput = screen.getByLabelText(/이메일/)
    //   const passwordInput = screen.getByLabelText(/비밀번호/)
    //   const submitButton = screen.getByRole('button', { name: /^로그인$/ })
    //
    //   await userEvent.type(emailInput, 'user@test.com')
    //   await userEvent.type(passwordInput, 'password123')
    //   await userEvent.click(submitButton)
    //
    //   await waitFor(() => {
    //     expect(sessionStorage.getItem('accessToken')).toBe('new-token-123')
    //     expect(useAuthStore.getState().isLoggedIn).toBe(true)
    //     expect(mockNavigate).toHaveBeenCalledWith({ to: '/main' })
    //   })
    // })
    //
    // ('로그인 실패 시 에러 메시지를 표시한다' 테스트는 위쪽 '로그인 실패(이메일 또는 비밀번호
    // 불일치) 시 비밀번호 입력란 아래에 실패 횟수와 함께 안내한다' 테스트로 대체됨 — 실제 안내
    // 문구는 서버 message가 아니라 고정된 "실패 N/5" 카운트 문구를 사용하기 때문)
    //
    // it('로그인 중에는 버튼이 disabled 상태다', async () => {
    //   let resolveLogin: () => void = () => {}
    //   const loginPromise = new Promise<void>((resolve) => {
    //     resolveLogin = resolve
    //   })
    //
    //   server.use(
    //     http.post('*/user/login', async () => {
    //       await loginPromise
    //       return HttpResponse.json({
    //         result: true,
    //         statusCode: 200,
    //         data: { type: 'T', token: 'token' },
    //         message: [],
    //       })
    //     })
    //   )
    //
    //   render(<LoginPage />)
    //
    //   fireEvent.click(screen.getByText('turnstile-success'))
    //   const emailInput = screen.getByLabelText(/이메일/)
    //   const passwordInput = screen.getByLabelText(/비밀번호/)
    //   const submitButton = screen.getByRole('button', { name: /^로그인$/ })
    //
    //   await userEvent.type(emailInput, 'user@test.com')
    //   await userEvent.type(passwordInput, 'password123')
    //   await userEvent.click(submitButton)
    //
    //   expect(submitButton).toBeDisabled()
    //   expect(submitButton).toHaveTextContent(/로그인 중/)
    //
    //   resolveLogin()
    //   // 로그인 완료까지 대기하여 act 경고 방지
    //   await waitFor(() => expect(submitButton).not.toBeDisabled())
    // })
  })

  // ─── Save Email (아이디 저장) Tests ──────────────────────────────────────────

  describe('아이디 저장', () => {
    it('"아이디 저장" 체크박스가 렌더링된다', () => {
      render(<LoginPage />)

      expect(screen.getByLabelText('아이디 저장')).toBeInTheDocument()
    })

    // [TEMP] 26.07.27 백엔드 미연동 — 로그인 API가 항상 성공한다고 가정한 스텁 동작 기준으로 검증.
    // 연동 완료 시 실제 로그인 성공 응답 기준으로 재검증할 것
    it('체크박스를 체크하고 로그인하면 이메일이 쿠키에 저장된다', async () => {
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

  // ─── 이메일 인증 로그인 Tests (Future Work) ──────────────────────────────────

  // [FUTURE WORK] 백엔드 연동 후 주석 해제
  // describe('로그인 폼 (신규 기기, 이메일 인증 플로우)', () => {
  //   it('type O 응답 시 이메일 인증 입력 UI가 표시된다', async () => {
  //     server.use(
  //       http.post('*/user/login', () =>
  //         HttpResponse.json({
  //           result: true,
  //           statusCode: 200,
  //           data: { type: 'O' },
  //           message: [],
  //         })
  //       )
  //     )
  //
  //     render(<LoginPage />)
  //
  //     fireEvent.click(screen.getByText('turnstile-success'))
  //     const emailInput = screen.getByLabelText(/이메일/)
  //     const passwordInput = screen.getByLabelText(/비밀번호/)
  //     const submitButton = screen.getByRole('button', { name: /^로그인$/ })
  //
  //     await userEvent.type(emailInput, 'user@test.com')
  //     await userEvent.type(passwordInput, 'password123')
  //     await userEvent.click(submitButton)
  //
  //     // 이메일 인증 입력 UI가 표시되어야 함
  //     expect(await screen.findByLabelText(/인증번호/)).toBeInTheDocument()
  //     expect(await screen.findByText(/남은 시간/)).toBeInTheDocument()
  //     expect(screen.getByRole('button', { name: /이메일 인증/ })).toBeInTheDocument()
  //   })
  //
  //   it('인증번호 6자리 입력 후 제출 시 /main으로 이동한다', async () => {
  //     server.use(
  //       http.post('*/user/login', () =>
  //         HttpResponse.json({
  //           result: true,
  //           statusCode: 200,
  //           data: { type: 'O' },
  //           message: [],
  //         })
  //       ),
  //       http.post('*/user/email-verification-login', () =>
  //         HttpResponse.json({
  //           result: true,
  //           statusCode: 200,
  //           data: { token: 'email-verification-token-456' },
  //           message: [],
  //         })
  //       )
  //     )
  //
  //     render(<LoginPage />)
  //
  //     fireEvent.click(screen.getByText('turnstile-success'))
  //     // 자격증명 입력 및 제출
  //     await userEvent.type(screen.getByLabelText(/이메일/), 'user@test.com')
  //     await userEvent.type(screen.getByLabelText(/비밀번호/), 'password123')
  //     await userEvent.click(screen.getByRole('button', { name: /^로그인$/ }))
  //
  //     // 이메일 인증번호 입력
  //     const emailCodeInput = await screen.findByLabelText(/인증번호/)
  //     await userEvent.type(emailCodeInput, '123456')
  //
  //     // 이메일 인증 제출
  //     const emailCodeButton = screen.getByRole('button', { name: /이메일 인증/ })
  //     await userEvent.click(emailCodeButton)
  //
  //     await waitFor(() => {
  //       expect(sessionStorage.getItem('accessToken')).toBe('email-verification-token-456')
  //       expect(useAuthStore.getState().isLoggedIn).toBe(true)
  //       expect(mockNavigate).toHaveBeenCalledWith({ to: '/main' })
  //     })
  //   })
  //
  //   it('이메일 인증번호 입력 중에는 숫자만 입력된다', async () => {
  //     server.use(
  //       http.post('*/user/login', () =>
  //         HttpResponse.json({
  //           result: true,
  //           statusCode: 200,
  //           data: { type: 'O' },
  //           message: [],
  //         })
  //       )
  //     )
  //
  //     render(<LoginPage />)
  //
  //     fireEvent.click(screen.getByText('turnstile-success'))
  //     await userEvent.type(screen.getByLabelText(/이메일/), 'user@test.com')
  //     await userEvent.type(screen.getByLabelText(/비밀번호/), 'password123')
  //     await userEvent.click(screen.getByRole('button', { name: /^로그인$/ }))
  //
  //     const emailCodeInput = (await screen.findByLabelText(/인증번호/)) as HTMLInputElement
  //     await userEvent.type(emailCodeInput, 'abc123def')
  //
  //     // 숫자만 입력되어야 함
  //     expect(emailCodeInput.value).toBe('123')
  //   })
  //
  //   it('인증번호 6자리 미만이면 제출 버튼이 disabled다', async () => {
  //     server.use(
  //       http.post('*/user/login', () =>
  //         HttpResponse.json({
  //           result: true,
  //           statusCode: 200,
  //           data: { type: 'O' },
  //           message: [],
  //         })
  //       )
  //     )
  //
  //     render(<LoginPage />)
  //
  //     fireEvent.click(screen.getByText('turnstile-success'))
  //     await userEvent.type(screen.getByLabelText(/이메일/), 'user@test.com')
  //     await userEvent.type(screen.getByLabelText(/비밀번호/), 'password123')
  //     await userEvent.click(screen.getByRole('button', { name: /^로그인$/ }))
  //
  //     const emailCodeInput = await screen.findByLabelText(/인증번호/)
  //     const emailCodeButton = screen.getByRole('button', { name: /이메일 인증/ })
  //
  //     // 5자리 입력
  //     await userEvent.type(emailCodeInput, '12345')
  //     expect(emailCodeButton).toBeDisabled()
  //
  //     // 6자리 입력
  //     await userEvent.type(emailCodeInput, '6')
  //     expect(emailCodeButton).not.toBeDisabled()
  //   })
  //
  //   it('이메일 인증 오류 시 에러 메시지를 표시한다', async () => {
  //     server.use(
  //       http.post('*/user/login', () =>
  //         HttpResponse.json({
  //           result: true,
  //           statusCode: 200,
  //           data: { type: 'O' },
  //           message: [],
  //         })
  //       ),
  //       http.post('*/user/email-verification-login', () =>
  //         HttpResponse.json(
  //           {
  //             result: false,
  //             statusCode: 400,
  //             data: null,
  //             message: ['잘못된 인증번호입니다.'],
  //           },
  //           { status: 400 }
  //         )
  //       )
  //     )
  //
  //     render(<LoginPage />)
  //
  //     fireEvent.click(screen.getByText('turnstile-success'))
  //     await userEvent.type(screen.getByLabelText(/이메일/), 'user@test.com')
  //     await userEvent.type(screen.getByLabelText(/비밀번호/), 'password123')
  //     await userEvent.click(screen.getByRole('button', { name: /^로그인$/ }))
  //
  //     const emailCodeInput = await screen.findByLabelText(/인증번호/)
  //     await userEvent.type(emailCodeInput, '000000')
  //     await userEvent.click(screen.getByRole('button', { name: /이메일 인증/ }))
  //
  //     expect(await screen.findByText(/잘못된 인증번호입니다./)).toBeInTheDocument()
  //   })
  //
  //   it('"처음부터 시작" 버튼을 클릭하면 자격증명 폼으로 돌아간다', async () => {
  //     server.use(
  //       http.post('*/user/login', () =>
  //         HttpResponse.json({
  //           result: true,
  //           statusCode: 200,
  //           data: { type: 'O' },
  //           message: [],
  //         })
  //       )
  //     )
  //
  //     render(<LoginPage />)
  //
  //     fireEvent.click(screen.getByText('turnstile-success'))
  //     await userEvent.type(screen.getByLabelText(/이메일/), 'user@test.com')
  //     await userEvent.type(screen.getByLabelText(/비밀번호/), 'password123')
  //     await userEvent.click(screen.getByRole('button', { name: /^로그인$/ }))
  //
  //     // 이메일 인증 단계 확인
  //     expect(await screen.findByLabelText(/인증번호/)).toBeInTheDocument()
  //
  //     // "처음부터 시작" 버튼 클릭
  //     await userEvent.click(screen.getByRole('button', { name: /처음부터 시작/ }))
  //
  //     // 자격증명 폼으로 돌아갔는지 확인
  //     expect(await screen.findByLabelText(/^이메일/)).toBeInTheDocument()
  //     expect(screen.getByLabelText(/^비밀번호/)).toBeInTheDocument()
  //   })
  //
  //   it('이메일 인증 중에는 제출 버튼이 disabled다', async () => {
  //     let resolveEmailCode: () => void = () => {}
  //     const emailCodePromise = new Promise<void>((resolve) => {
  //       resolveEmailCode = resolve
  //     })
  //
  //     server.use(
  //       http.post('*/user/login', () =>
  //         HttpResponse.json({
  //           result: true,
  //           statusCode: 200,
  //           data: { type: 'O' },
  //           message: [],
  //         })
  //       ),
  //       http.post('*/user/email-verification-login', async () => {
  //         await emailCodePromise
  //         return HttpResponse.json({
  //           result: true,
  //           statusCode: 200,
  //           data: { token: 'tok' },
  //           message: [],
  //         })
  //       })
  //     )
  //
  //     render(<LoginPage />)
  //
  //     fireEvent.click(screen.getByText('turnstile-success'))
  //     await userEvent.type(screen.getByLabelText(/이메일/), 'user@test.com')
  //     await userEvent.type(screen.getByLabelText(/비밀번호/), 'password123')
  //     await userEvent.click(screen.getByRole('button', { name: /^로그인$/ }))
  //
  //     const emailCodeInput = await screen.findByLabelText(/인증번호/)
  //     await userEvent.type(emailCodeInput, '123456')
  //
  //     const emailCodeButton = screen.getByRole('button', { name: /이메일 인증/ })
  //     await userEvent.click(emailCodeButton)
  //
  //     expect(emailCodeButton).toBeDisabled()
  //     expect(emailCodeButton).toHaveTextContent(/이메일 인증 확인 중/)
  //
  //     resolveEmailCode()
  //     // 이메일 인증 완료까지 대기하여 act 경고 방지
  //     await waitFor(() => expect(emailCodeButton).not.toBeDisabled())
  //   })
  // })

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
