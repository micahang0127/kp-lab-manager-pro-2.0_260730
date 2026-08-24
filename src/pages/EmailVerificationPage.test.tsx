import { useNavigate } from '@tanstack/react-router'
import { cleanup, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useAuthStore } from '../stores/authStore'
import { useLoginFlowStore } from '../stores/loginFlowStore'
import { render, screen } from '../test/test-utils'
import { isAuthValid } from '../utils/requireAuth'
import { EmailVerificationPage } from './EmailVerificationPage'

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: vi.fn(),
}))

const PENDING_EMAIL = 'user@test.com'

/** 이메일 인증 대기 상태를 store에 채워넣는다 (LoginPage에서 type: 'O' 응답을 받은 이후 상태) */
function setPending(overrides: Partial<{ email: string; expiresAt: number }> = {}) {
  useLoginFlowStore.setState({
    pending: {
      email: PENDING_EMAIL,
      expiresAt: Date.now() + 5 * 60 * 1000,
      ...overrides,
    },
  })
}

// ─── Setup ─────────────────────────────────────────────────────────────────────

describe('EmailVerificationPage', () => {
  beforeEach(() => {
    sessionStorage.clear()
    useAuthStore.setState({ isLoggedIn: false })
    useLoginFlowStore.setState({ pending: null })
    vi.mocked(useNavigate).mockReturnValue(mockNavigate)
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  // ─── 방어적 렌더링 ────────────────────────────────────────────────────────────

  it('pending 상태가 없으면 아무것도 렌더링하지 않는다', () => {
    render(<EmailVerificationPage />)

    expect(screen.queryByText('이메일 인증')).not.toBeInTheDocument()
  })

  // ─── 인증번호 입력 UI ─────────────────────────────────────────────────────────

  describe('인증번호 입력 UI', () => {
    it('안내 문구, 인증번호 입력란, 남은 시간이 렌더링된다', () => {
      setPending()
      render(<EmailVerificationPage />)

      expect(
        screen.getByText(`${PENDING_EMAIL}로 발송된 6자리 인증번호를 입력해주세요.`)
      ).toBeInTheDocument()
      expect(screen.getByLabelText(/인증번호/)).toBeInTheDocument()
      expect(screen.getByText(/남은 시간/)).toBeInTheDocument()
    })

    it('"이 브라우저를 30일동안 신뢰" 체크박스를 토글할 수 있다', async () => {
      setPending()
      render(<EmailVerificationPage />)

      const checkbox = screen.getByLabelText('이 브라우저를 30일동안 신뢰')
      expect(checkbox).not.toBeChecked()

      await userEvent.click(checkbox)

      expect(checkbox).toBeChecked()
    })

    it('인증번호 입력 중에는 숫자만 입력된다', async () => {
      setPending()
      render(<EmailVerificationPage />)

      const emailCodeInput = screen.getByLabelText(/인증번호/) as HTMLInputElement
      await userEvent.type(emailCodeInput, 'abc123def')

      expect(emailCodeInput.value).toBe('123')
    })

    it('인증번호 6자리 미만이면 제출 버튼이 disabled다', async () => {
      setPending()
      render(<EmailVerificationPage />)

      const emailCodeInput = screen.getByLabelText(/인증번호/)
      const submitButton = screen.getByRole('button', { name: /이메일 인증/ })

      await userEvent.type(emailCodeInput, '12345')
      expect(submitButton).toBeDisabled()

      await userEvent.type(emailCodeInput, '6')
      expect(submitButton).not.toBeDisabled()
    })
  })

  // ─── 만료 처리 ────────────────────────────────────────────────────────────────

  describe('만료 처리', () => {
    it('인증 유효시간이 지나면 만료 안내가 표시되고 제출 버튼이 disabled다', async () => {
      setPending({ expiresAt: Date.now() - 1000 })
      render(<EmailVerificationPage />)

      await userEvent.type(screen.getByLabelText(/인증번호/), '123456')

      await waitFor(() => {
        expect(screen.getByText(/인증 시간이 만료되었습니다/)).toBeInTheDocument()
      })
      expect(screen.getByRole('button', { name: /이메일 인증/ })).toBeDisabled()
    })
  })

  // ─── TEMP 스텁 동작 (백엔드 미연동) ────────────────────────────────────────────

  // [TEMP] 26.07.27 백엔드 미연동 — 이메일 인증 API가 항상 성공한다고 가정한 스텁 동작 검증.
  // 연동 완료 시 이 테스트를 삭제하고 아래 [FUTURE WORK] 테스트들의 주석을 해제할 것
  it('TEMP: 인증번호 6자리를 제출하면 항상 성공하여 /main으로 이동한다', async () => {
    setPending()
    render(<EmailVerificationPage />)

    await userEvent.type(screen.getByLabelText(/인증번호/), '123456')
    await userEvent.click(screen.getByRole('button', { name: /이메일 인증/ }))

    await waitFor(() => {
      const token = sessionStorage.getItem('accessToken')
      expect(token).toBeTruthy()
      expect(isAuthValid()).toBe(true)
      expect(useAuthStore.getState().isLoggedIn).toBe(true)
      expect(useLoginFlowStore.getState().pending).toBeNull()
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/main' })
    })
  })

  // ─── 처음부터 시작 ────────────────────────────────────────────────────────────

  describe('처음부터 시작', () => {
    it('버튼을 클릭하면 pending을 초기화하고 /login으로 이동한다', async () => {
      setPending()
      render(<EmailVerificationPage />)

      await userEvent.click(screen.getByRole('button', { name: /처음부터 시작/ }))

      expect(useLoginFlowStore.getState().pending).toBeNull()
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/login' })
    })
  })

  // [FUTURE WORK] 백엔드 연동 후 주석 해제 (실제 API 호출 기반 케이스 — MSW 사용)
  // describe('백엔드 연동 이후', () => {
  //   it('잘못된 인증번호 제출 시 에러 메시지를 표시한다', async () => {
  //     server.use(
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
  //     setPending()
  //     render(<EmailVerificationPage />)
  //
  //     await userEvent.type(screen.getByLabelText(/인증번호/), '000000')
  //     await userEvent.click(screen.getByRole('button', { name: /이메일 인증/ }))
  //
  //     expect(await screen.findByText(/잘못된 인증번호입니다./)).toBeInTheDocument()
  //   })
  //
  //   it('신뢰 체크박스를 선택하고 제출하면 rememberDevice와 trustDurationDays가 요청 body에 포함된다', async () => {
  //     let capturedBody: Record<string, unknown> | null = null
  //     server.use(
  //       http.post('*/user/email-verification-login', async ({ request }) => {
  //         capturedBody = (await request.json()) as Record<string, unknown>
  //         return HttpResponse.json({
  //           result: true,
  //           statusCode: 200,
  //           data: { token: 'tok' },
  //           message: [],
  //         })
  //       })
  //     )
  //
  //     setPending()
  //     render(<EmailVerificationPage />)
  //
  //     await userEvent.click(screen.getByLabelText('이 브라우저를 30일동안 신뢰'))
  //     await userEvent.type(screen.getByLabelText(/인증번호/), '123456')
  //     await userEvent.click(screen.getByRole('button', { name: /이메일 인증/ }))
  //
  //     await waitFor(() => {
  //       expect(capturedBody).toMatchObject({ rememberDevice: true, trustDurationDays: 30 })
  //     })
  //   })
  //
  //   it('이메일 인증 중에는 제출 버튼이 disabled다', async () => {
  //     let resolveEmailCode: () => void = () => {}
  //     const emailCodePromise = new Promise<void>((resolve) => {
  //       resolveEmailCode = resolve
  //     })
  //
  //     server.use(
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
  //     setPending()
  //     render(<EmailVerificationPage />)
  //
  //     await userEvent.type(screen.getByLabelText(/인증번호/), '123456')
  //     const submitButton = screen.getByRole('button', { name: /이메일 인증/ })
  //     await userEvent.click(submitButton)
  //
  //     expect(submitButton).toBeDisabled()
  //     expect(submitButton).toHaveTextContent(/이메일 인증 확인 중/)
  //
  //     resolveEmailCode()
  //     await waitFor(() => expect(submitButton).not.toBeDisabled())
  //   })
  // })
})
