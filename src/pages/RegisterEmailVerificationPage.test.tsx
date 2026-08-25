import { useNavigate } from '@tanstack/react-router'
import { act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { sendRegisterEmailCode, verifyRegisterEmailCode } from '../api/auth'
import { useRegisterFlowStore } from '../stores/registerFlowStore'
import { render, screen } from '../test/test-utils'
import { EMAIL_CODE_EXPIRES_IN_SECONDS } from '../utils/rules/validationRules'
import { RegisterEmailVerificationPage } from './RegisterEmailVerificationPage'

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: vi.fn(),
}))

vi.mock('../api/auth', () => ({
  sendRegisterEmailCode: vi.fn(),
  verifyRegisterEmailCode: vi.fn(),
}))

const VALID_EMAIL = 'user@koreapetroleum.com'

describe('RegisterEmailVerificationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useNavigate).mockReturnValue(mockNavigate)
    vi.mocked(sendRegisterEmailCode).mockResolvedValue({
      result: true,
      statusCode: 200,
      data: { success: true },
      message: [],
    })
    vi.mocked(verifyRegisterEmailCode).mockResolvedValue({
      result: true,
      statusCode: 200,
      data: { success: true },
      message: [],
    })
    useRegisterFlowStore.setState({ registerEmail: null })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('페이지 제목과 약관 동의 완료 문구, 이메일 입력란을 렌더링한다', () => {
    render(<RegisterEmailVerificationPage />)

    expect(screen.getByRole('heading', { name: '회원가입' })).toBeInTheDocument()
    expect(screen.getByText('약관 동의 완료')).toBeInTheDocument()
    expect(screen.getByText('이메일을 인증해 주세요.')).toBeInTheDocument()
    expect(screen.getByLabelText('그룹 이메일 *')).toBeInTheDocument()
  })

  it('이메일 형식이 올바르지 않으면 "인증번호 전송" 버튼이 disabled다', async () => {
    render(<RegisterEmailVerificationPage />)

    await userEvent.type(screen.getByLabelText('그룹 이메일 *'), 'invalid-email')

    expect(screen.getByRole('button', { name: '인증번호 전송' })).toBeDisabled()
  })

  it('인증번호 입력칸은 인증번호 전송 전까지 비활성화되어 있다', () => {
    render(<RegisterEmailVerificationPage />)

    screen.getAllByLabelText(/인증번호 \d번째 자리/).forEach((box) => {
      expect(box).toBeDisabled()
    })
  })

  it('유효한 이메일로 인증번호 전송에 성공하면 인증번호 입력칸이 활성화되고 남은 시간이 표시된다', async () => {
    render(<RegisterEmailVerificationPage />)

    await userEvent.type(screen.getByLabelText('그룹 이메일 *'), VALID_EMAIL)
    await userEvent.click(screen.getByRole('button', { name: '인증번호 전송' }))

    await waitFor(() => {
      expect(sendRegisterEmailCode).toHaveBeenCalledWith({ email: VALID_EMAIL })
      expect(screen.getByText(/남은 시간 \d{2}:\d{2}/)).toBeInTheDocument()
    })
    screen.getAllByLabelText(/인증번호 \d번째 자리/).forEach((box) => {
      expect(box).not.toBeDisabled()
    })
  })

  it('인증번호 6자리를 입력하고 확인을 클릭하면 registerEmail을 저장한다', async () => {
    render(<RegisterEmailVerificationPage />)

    await userEvent.type(screen.getByLabelText('그룹 이메일 *'), VALID_EMAIL)
    await userEvent.click(screen.getByRole('button', { name: '인증번호 전송' }))
    await waitFor(() => {
      expect(screen.getByText(/남은 시간 \d{2}:\d{2}/)).toBeInTheDocument()
    })

    await userEvent.type(screen.getByLabelText('인증번호 1번째 자리'), '1')
    await userEvent.type(screen.getByLabelText('인증번호 2번째 자리'), '2')
    await userEvent.type(screen.getByLabelText('인증번호 3번째 자리'), '3')
    await userEvent.type(screen.getByLabelText('인증번호 4번째 자리'), '4')
    await userEvent.type(screen.getByLabelText('인증번호 5번째 자리'), '5')
    await userEvent.type(screen.getByLabelText('인증번호 6번째 자리'), '6')

    await userEvent.click(screen.getByRole('button', { name: '인증번호 확인' }))

    await waitFor(() => {
      expect(verifyRegisterEmailCode).toHaveBeenCalledWith({ email: VALID_EMAIL, code: '123456' })
      expect(useRegisterFlowStore.getState().registerEmail).toBe(VALID_EMAIL)
    })
  })

  it('인증번호를 6자리 입력하기 전에는 "확인" 버튼이 disabled다', async () => {
    render(<RegisterEmailVerificationPage />)

    await userEvent.type(screen.getByLabelText('그룹 이메일 *'), VALID_EMAIL)
    await userEvent.click(screen.getByRole('button', { name: '인증번호 전송' }))
    await waitFor(() => {
      expect(screen.getByText(/남은 시간 \d{2}:\d{2}/)).toBeInTheDocument()
    })

    expect(screen.getByRole('button', { name: '인증번호 확인' })).toBeDisabled()
  })

  it('인증 유효시간이 지나면 만료 안내가 표시되고 "확인" 버튼이 disabled다', async () => {
    // 인증코드 발송 API 응답에는 유효 시간이 내려오지 않아(EMAIL_CODE_EXPIRES_IN_SECONDS 고정값
    // 사용) 만료를 재현하려면 실제로 그 시간만큼 흘려보내야 한다 — fake timer로 시간을 앞당긴다.
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime, delay: null })

    render(<RegisterEmailVerificationPage />)

    await user.type(screen.getByLabelText('그룹 이메일 *'), VALID_EMAIL)
    await user.click(screen.getByRole('button', { name: '인증번호 전송' }))

    await waitFor(() => {
      expect(screen.getByText(/남은 시간 \d{2}:\d{2}/)).toBeInTheDocument()
    })

    await act(async () => {
      vi.advanceTimersByTime(EMAIL_CODE_EXPIRES_IN_SECONDS * 1000)
    })

    expect(screen.getByText(/인증 시간이 만료되었습니다/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '인증번호 확인' })).toBeDisabled()
  })

  it('"← 이전" 버튼을 클릭하면 4단계(이용약관 동의)로 이동한다', async () => {
    render(<RegisterEmailVerificationPage />)

    await userEvent.click(screen.getByRole('button', { name: /이전/ }))

    expect(mockNavigate).toHaveBeenCalledWith({ to: '/register-terms' })
  })

  describe('에러 처리', () => {
    it('인증번호 전송에 실패하면 에러 메시지를 표시한다', async () => {
      vi.mocked(sendRegisterEmailCode).mockRejectedValueOnce(new Error('이미 가입된 이메일입니다.'))

      render(<RegisterEmailVerificationPage />)

      await userEvent.type(screen.getByLabelText('그룹 이메일 *'), VALID_EMAIL)
      await userEvent.click(screen.getByRole('button', { name: '인증번호 전송' }))

      expect(await screen.findByText('이미 가입된 이메일입니다.')).toBeInTheDocument()
    })

    it('인증번호 확인에 실패하면 에러 메시지를 표시한다', async () => {
      vi.mocked(verifyRegisterEmailCode).mockRejectedValueOnce(new Error('잘못된 인증번호입니다.'))

      render(<RegisterEmailVerificationPage />)

      await userEvent.type(screen.getByLabelText('그룹 이메일 *'), VALID_EMAIL)
      await userEvent.click(screen.getByRole('button', { name: '인증번호 전송' }))
      await waitFor(() => {
        expect(screen.getByText(/남은 시간 \d{2}:\d{2}/)).toBeInTheDocument()
      })

      await userEvent.type(screen.getByLabelText('인증번호 1번째 자리'), '1')
      await userEvent.type(screen.getByLabelText('인증번호 2번째 자리'), '2')
      await userEvent.type(screen.getByLabelText('인증번호 3번째 자리'), '3')
      await userEvent.type(screen.getByLabelText('인증번호 4번째 자리'), '4')
      await userEvent.type(screen.getByLabelText('인증번호 5번째 자리'), '5')
      await userEvent.type(screen.getByLabelText('인증번호 6번째 자리'), '6')
      await userEvent.click(screen.getByRole('button', { name: '인증번호 확인' }))

      expect(await screen.findByText('잘못된 인증번호입니다.')).toBeInTheDocument()
      expect(useRegisterFlowStore.getState().registerEmail).toBeNull()
    })
  })
})
