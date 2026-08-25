import { waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { ApiResponse } from '../../api'
import { render, screen } from '../../test/test-utils'
import { EmailVerificationField } from './EmailVerificationField'
import type { SendEmailCodeResult } from './useEmailVerification'
import { useEmailVerification } from './useEmailVerification'

// ─── Test Helpers ─────────────────────────────────────────────────────────────
// 훅 + 필드를 함께 사용하는 실제 사용 패턴(예: RegisterEmailVerificationPage)을 그대로 재현한다.

function TestHost({
  sendCode,
  codeError,
  expiresInSeconds,
}: {
  sendCode: (email: string) => Promise<ApiResponse<SendEmailCodeResult>>
  codeError?: string | null
  expiresInSeconds?: number
}) {
  const verification = useEmailVerification({ sendCode, expiresInSeconds })
  return (
    <EmailVerificationField
      emailId="test-email"
      verification={verification}
      codeError={codeError}
    />
  )
}

const mockSendCode = vi.fn()

const VALID_EMAIL = 'user@koreapetroleum.com'

describe('EmailVerificationField', () => {
  it('이메일 입력칸과 인증번호 전송 버튼을 렌더링한다', () => {
    render(<TestHost sendCode={mockSendCode} />)

    expect(screen.getByLabelText('그룹 이메일 *')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '인증번호 전송' })).toBeInTheDocument()
    expect(screen.getByText('이메일 인증번호를 전송해 주세요')).toBeInTheDocument()
  })

  it('이메일 형식이 올바르지 않으면 "인증번호 전송" 버튼이 disabled다', async () => {
    render(<TestHost sendCode={mockSendCode} />)

    await userEvent.type(screen.getByLabelText('그룹 이메일 *'), 'invalid-email')

    expect(screen.getByRole('button', { name: '인증번호 전송' })).toBeDisabled()
  })

  it('유효한 이메일로 인증번호 전송에 성공하면 인증번호 입력칸이 활성화되고 남은 시간이 표시된다', async () => {
    const sendCode = vi.fn().mockResolvedValue({
      result: true,
      statusCode: 200,
      data: { success: true },
      message: [],
    })
    render(<TestHost sendCode={sendCode} />)

    await userEvent.type(screen.getByLabelText('그룹 이메일 *'), VALID_EMAIL)
    await userEvent.click(screen.getByRole('button', { name: '인증번호 전송' }))

    await waitFor(() => {
      expect(sendCode).toHaveBeenCalledWith(VALID_EMAIL)
      expect(screen.getByText(/남은 시간 \d{2}:\d{2}/)).toBeInTheDocument()
    })
    screen.getAllByLabelText(/인증번호 \d번째 자리/).forEach((box) => {
      expect(box).not.toBeDisabled()
    })
  })

  it('인증번호 전송 실패 시 에러 메시지를 표시한다', async () => {
    const sendCode = vi.fn().mockRejectedValue(new Error('이미 가입된 이메일입니다.'))
    render(<TestHost sendCode={sendCode} />)

    await userEvent.type(screen.getByLabelText('그룹 이메일 *'), VALID_EMAIL)
    await userEvent.click(screen.getByRole('button', { name: '인증번호 전송' }))

    expect(await screen.findByText('이미 가입된 이메일입니다.')).toBeInTheDocument()
  })

  it('유효 시간이 만료되면 만료 안내를 표시한다', async () => {
    const sendCode = vi.fn().mockResolvedValue({
      result: true,
      statusCode: 200,
      data: { success: true },
      message: [],
    })
    // 발송 API 응답에는 유효 시간이 내려오지 않으므로, 이미 지난 시간을 넣어 즉시 만료를 재현한다
    render(<TestHost sendCode={sendCode} expiresInSeconds={-1} />)

    await userEvent.type(screen.getByLabelText('그룹 이메일 *'), VALID_EMAIL)
    await userEvent.click(screen.getByRole('button', { name: '인증번호 전송' }))

    expect(await screen.findByText(/인증 시간이 만료되었습니다/)).toBeInTheDocument()
  })

  it('인증번호 전송 전에는 "재전송" 버튼이 disabled다', () => {
    render(<TestHost sendCode={mockSendCode} />)

    expect(screen.getByRole('button', { name: '재전송' })).toBeDisabled()
  })

  it('인증번호 전송 후 이메일을 수정하면 "인증번호 전송" 버튼이 재활성화되고 인증번호 입력칸은 다시 잠긴다', async () => {
    const sendCode = vi.fn().mockResolvedValue({
      result: true,
      statusCode: 200,
      data: { success: true },
      message: [],
    })
    render(<TestHost sendCode={sendCode} />)

    const emailInput = screen.getByLabelText('그룹 이메일 *')
    await userEvent.type(emailInput, VALID_EMAIL)
    await userEvent.click(screen.getByRole('button', { name: '인증번호 전송' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '인증번호 전송' })).toBeDisabled()
      expect(screen.getByRole('button', { name: '재전송' })).not.toBeDisabled()
    })

    await userEvent.clear(emailInput)
    await userEvent.type(emailInput, 'other@koreapetroleum.com')

    expect(screen.getByRole('button', { name: '인증번호 전송' })).not.toBeDisabled()
    expect(screen.getByRole('button', { name: '재전송' })).toBeDisabled()
    expect(screen.getByText('이메일 인증번호를 전송해 주세요')).toBeInTheDocument()
    screen.getAllByLabelText(/인증번호 \d번째 자리/).forEach((box) => {
      expect(box).toBeDisabled()
    })
  })

  it('codeError prop이 전달되면 최종 확인 에러 메시지를 표시한다', () => {
    render(<TestHost sendCode={mockSendCode} codeError="잘못된 인증번호입니다." />)

    expect(screen.getByText('잘못된 인증번호입니다.')).toBeInTheDocument()
  })

  it('한글을 입력하면 "한글 입력불가" 안내를 표시하고 입력값에서는 한글이 제거된다', async () => {
    render(<TestHost sendCode={mockSendCode} />)

    await userEvent.type(screen.getByLabelText('그룹 이메일 *'), '한글')

    expect(screen.getByText('한글 입력불가')).toBeInTheDocument()
    expect(screen.getByLabelText('그룹 이메일 *')).toHaveValue('')
  })

  it('한글 없이 입력하면 "한글 입력불가" 안내가 표시되지 않는다', async () => {
    render(<TestHost sendCode={mockSendCode} />)

    await userEvent.type(screen.getByLabelText('그룹 이메일 *'), VALID_EMAIL)

    expect(screen.queryByText('한글 입력불가')).not.toBeInTheDocument()
  })

  it('한글 입력 후 영문을 이어서 입력하면 안내가 사라진다', async () => {
    render(<TestHost sendCode={mockSendCode} />)

    const emailInput = screen.getByLabelText('그룹 이메일 *')
    await userEvent.type(emailInput, '한')
    expect(screen.getByText('한글 입력불가')).toBeInTheDocument()

    await userEvent.type(emailInput, 'a')
    expect(screen.queryByText('한글 입력불가')).not.toBeInTheDocument()
  })

  it('평상시 이메일 입력칸은 회색 테두리를 사용한다', () => {
    render(<TestHost sendCode={mockSendCode} />)

    expect(screen.getByLabelText('그룹 이메일 *').parentElement).toHaveClass('border-[#c9c9c4]')
  })

  it('한글을 입력하면 이메일 입력칸 테두리가 빨간색(#bf3329)으로 바뀐다', async () => {
    render(<TestHost sendCode={mockSendCode} />)

    await userEvent.type(screen.getByLabelText('그룹 이메일 *'), '한')

    expect(screen.getByLabelText('그룹 이메일 *').parentElement).toHaveClass('border-[#bf3329]')
  })

  it('인증번호 전송 실패 시 이메일 입력칸 테두리도 빨간색(#bf3329)으로 바뀐다', async () => {
    const sendCode = vi.fn().mockRejectedValue(new Error('이미 가입된 이메일입니다.'))
    render(<TestHost sendCode={sendCode} />)

    await userEvent.type(screen.getByLabelText('그룹 이메일 *'), VALID_EMAIL)
    await userEvent.click(screen.getByRole('button', { name: '인증번호 전송' }))
    await screen.findByText('이미 가입된 이메일입니다.')

    expect(screen.getByLabelText('그룹 이메일 *').parentElement).toHaveClass('border-[#bf3329]')
  })
})
