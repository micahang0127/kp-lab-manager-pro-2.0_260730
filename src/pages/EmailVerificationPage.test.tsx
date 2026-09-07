import { useNavigate } from '@tanstack/react-router'
import { cleanup, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useAuthStore } from '../stores/authStore'
import { useLoginFlowStore } from '../stores/loginFlowStore'
import { fireEvent, render, screen } from '../test/test-utils'
import { isAuthValid } from '../utils/requireAuth'
import { EmailVerificationPage } from './EmailVerificationPage'

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: vi.fn(),
}))

const PENDING_EMAIL = 'user@test.com'

/** 박스형 인증번호 입력칸(1~6번째 자리)에 한 자리씩 입력한다 */
async function typeEmailCode(code: string) {
  const user = userEvent.setup()
  for (let i = 0; i < code.length; i += 1) {
    await user.type(screen.getByLabelText(`인증번호 ${i + 1}번째 자리`), code[i])
  }
}

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
    it('안내 문구, 인증번호 입력칸 6개, 남은 시간이 렌더링된다', () => {
      setPending()
      render(<EmailVerificationPage />)

      expect(
        screen.getByText(`${PENDING_EMAIL}로 발송된 6자리 인증번호를 입력해주세요.`)
      ).toBeInTheDocument()
      expect(screen.getAllByLabelText(/인증번호 \d번째 자리/)).toHaveLength(6)
      expect(screen.getByText(/남은 시간/)).toBeInTheDocument()
    })

    it('붙여넣은 값 중 숫자만 인증번호로 인식한다 (필터링 자체는 EmailCodeInput이 담당)', async () => {
      setPending()
      render(<EmailVerificationPage />)

      screen.getByLabelText('인증번호 1번째 자리').focus()
      await userEvent.paste('ab123456cd')

      const boxes = screen.getAllByLabelText(/인증번호 \d번째 자리/) as HTMLInputElement[]
      expect(boxes.map((box) => box.value).join('')).toBe('123456')
    })

    it('인증번호 6자리 미만이면 제출 버튼이 disabled다', async () => {
      setPending()
      render(<EmailVerificationPage />)

      const submitButton = screen.getByRole('button', { name: /이메일 인증/ })

      await typeEmailCode('12345')
      expect(submitButton).toBeDisabled()

      await userEvent.type(screen.getByLabelText('인증번호 6번째 자리'), '6')
      expect(submitButton).not.toBeDisabled()
    })

    it('값이 채워진 칸에 다시 포커스하면 기존 값이 전체 선택되어, 지우지 않고 바로 재입력할 수 있다', async () => {
      setPending()
      render(<EmailVerificationPage />)

      await typeEmailCode('123456')

      const box1 = screen.getByLabelText('인증번호 1번째 자리') as HTMLInputElement
      await userEvent.click(box1)

      // 값이 이미 있는 maxLength=1 칸에 커서만 있고 선택 영역이 없으면, 브라우저가 추가
      // 입력 자체를 막아서 지우고 다시 입력해야 하는 문제가 있었다(EmailCodeDigitInput.tsx
      // 참고). 포커스 시 기존 값을 전체 선택해두면 실제 브라우저에서는 다음 입력이 선택
      // 영역을 그대로 덮어쓴다 — 여기서는 그 전제 조건(전체 선택)까지 검증한다.
      expect(box1.selectionStart).toBe(0)
      expect(box1.selectionEnd).toBe(1)

      // userEvent의 키보드 시뮬레이션은 네이티브 selection 기반 덮어쓰기 자체를 재현하지
      // 못하므로(jsdom 한계), 실제 브라우저가 선택 영역을 덮어쓴 뒤 보낼 input 이벤트를
      // 직접 발생시켜 상위(emailCode 상태)가 올바르게 갱신되는지 검증한다.
      fireEvent.change(box1, { target: { value: '9' } })

      expect(box1.value).toBe('9')
      expect(screen.getByLabelText('인증번호 2번째 자리')).toHaveFocus()
    })
  })

  // ─── 만료 처리 ────────────────────────────────────────────────────────────────

  describe('만료 처리', () => {
    it('인증 유효시간이 지나면 만료 안내가 표시되고 제출 버튼이 disabled다', async () => {
      setPending({ expiresAt: Date.now() - 1000 })
      render(<EmailVerificationPage />)

      await typeEmailCode('123456')

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

    await typeEmailCode('123456')
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
  //     await typeEmailCode('000000')
  //     await userEvent.click(screen.getByRole('button', { name: /이메일 인증/ }))
  //
  //     expect(await screen.findByText(/잘못된 인증번호입니다./)).toBeInTheDocument()
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
  //     await typeEmailCode('123456')
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
