import { fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError, type ApiResponse } from '../../api'
import {
  type EmailVerificationLimitPurpose,
  useEmailVerificationLimitStore,
} from '../../stores/emailVerificationLimitStore'
import { render, screen } from '../../test/test-utils'
import { EMAIL_RULE_MESSAGE, HANGUL_INPUT_MESSAGE } from '../../utils/rules/validationRules'
import { EmailVerificationField } from './EmailVerificationField'
import type { SendEmailCodeResult } from './useEmailVerification'
import { useEmailVerification } from './useEmailVerification'

// ─── Test Helpers ─────────────────────────────────────────────────────────────
// 훅 + 필드를 함께 사용하는 실제 사용 패턴(예: RegisterEmailVerificationPage)을 그대로 재현한다.

function TestHost({
  sendCode,
  codeError,
  expiresInSeconds,
  sendLimit,
  initialEmail,
  emailDisabled,
}: {
  sendCode: (email: string) => Promise<ApiResponse<SendEmailCodeResult>>
  codeError?: string | null
  expiresInSeconds?: number
  sendLimit?: { purpose: EmailVerificationLimitPurpose; maxAttempts: number; windowMs: number }
  initialEmail?: string
  emailDisabled?: boolean
}) {
  const verification = useEmailVerification({
    sendCode,
    expiresInSeconds,
    sendLimit,
    initialEmail,
  })
  return (
    <EmailVerificationField
      emailId="test-email"
      verification={verification}
      codeError={codeError}
      emailDisabled={emailDisabled}
    />
  )
}

const mockSendCode = vi.fn()

const VALID_EMAIL = 'user@koreapetroleum.com'

describe('EmailVerificationField', () => {
  beforeEach(() => {
    document.cookie = 'emailVerificationLimit=; max-age=0; path=/'
    useEmailVerificationLimitStore.setState({ records: {} })
  })

  it('이메일 입력칸과 인증번호 전송 버튼을 렌더링한다', () => {
    render(<TestHost sendCode={mockSendCode} />)

    expect(screen.getByLabelText('이메일 *')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '인증번호 전송' })).toBeInTheDocument()
    expect(screen.getByText('이메일 인증번호를 전송해 주세요')).toBeInTheDocument()
  })

  it('이메일 형식이 올바르지 않으면 "인증번호 전송" 버튼이 disabled다', async () => {
    render(<TestHost sendCode={mockSendCode} />)

    await userEvent.type(screen.getByLabelText('이메일 *'), 'invalid-email')

    expect(screen.getByRole('button', { name: '인증번호 전송' })).toBeDisabled()
  })

  it('한글이 아닌 형식 오류(예: "@" 누락)가 있으면 이메일 형식 안내를 표시한다', async () => {
    render(<TestHost sendCode={mockSendCode} />)

    await userEvent.type(screen.getByLabelText('이메일 *'), 'invalid-email')

    expect(screen.getByText(EMAIL_RULE_MESSAGE)).toBeInTheDocument()
    expect(screen.getByLabelText('이메일 *').parentElement).toHaveClass('border-[#bf3329]')
  })

  it('이메일 입력칸이 비어 있으면 형식 오류 안내를 표시하지 않는다', () => {
    render(<TestHost sendCode={mockSendCode} />)

    expect(screen.queryByText(EMAIL_RULE_MESSAGE)).not.toBeInTheDocument()
  })

  it('유효한 이메일로 인증번호 전송에 성공하면 인증번호 입력칸이 활성화되고 남은 시간이 표시된다', async () => {
    const sendCode = vi.fn().mockResolvedValue({
      result: true,
      statusCode: 200,
      data: { success: true },
      message: [],
    })
    render(<TestHost sendCode={sendCode} />)

    await userEvent.type(screen.getByLabelText('이메일 *'), VALID_EMAIL)
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

    await userEvent.type(screen.getByLabelText('이메일 *'), VALID_EMAIL)
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

    await userEvent.type(screen.getByLabelText('이메일 *'), VALID_EMAIL)
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

    const emailInput = screen.getByLabelText('이메일 *')
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

  it('codeError prop이 전달되면 최종 확인 에러 메시지(백엔드 message)를 그대로 표시한다', () => {
    render(<TestHost sendCode={mockSendCode} codeError="잘못된 인증번호입니다." />)

    expect(screen.getByText('잘못된 인증번호입니다.')).toBeInTheDocument()
  })

  it('인증번호 전송 후 codeError가 전달되면 인증번호 입력칸이 빨간색 테두리로 강조된다', async () => {
    const sendCode = vi.fn().mockResolvedValue({
      result: true,
      statusCode: 200,
      data: { success: true },
      message: [],
    })
    render(<TestHost sendCode={sendCode} codeError="잘못된 인증번호입니다." />)

    await userEvent.type(screen.getByLabelText('이메일 *'), VALID_EMAIL)
    await userEvent.click(screen.getByRole('button', { name: '인증번호 전송' }))

    await waitFor(() => {
      screen.getAllByLabelText(/인증번호 \d번째 자리/).forEach((box) => {
        expect(box).not.toBeDisabled()
        expect(box).toHaveClass('border-[#d44038]')
      })
    })
  })

  it('한글을 입력하면 한글 입력 불가 안내를 표시하고 입력값에서는 한글이 제거된다', async () => {
    render(<TestHost sendCode={mockSendCode} />)

    await userEvent.type(screen.getByLabelText('이메일 *'), '한글')

    expect(screen.getByText(HANGUL_INPUT_MESSAGE)).toBeInTheDocument()
    expect(screen.getByLabelText('이메일 *')).toHaveValue('')
  })

  it('한글 없이 입력하면 한글 입력 불가 안내가 표시되지 않는다', async () => {
    render(<TestHost sendCode={mockSendCode} />)

    await userEvent.type(screen.getByLabelText('이메일 *'), VALID_EMAIL)

    expect(screen.queryByText(HANGUL_INPUT_MESSAGE)).not.toBeInTheDocument()
  })

  it('한글 입력 후 영문을 이어서 입력하면 안내가 사라진다', async () => {
    render(<TestHost sendCode={mockSendCode} />)

    const emailInput = screen.getByLabelText('이메일 *')
    await userEvent.type(emailInput, '한')
    expect(screen.getByText(HANGUL_INPUT_MESSAGE)).toBeInTheDocument()

    await userEvent.type(emailInput, 'a')
    expect(screen.queryByText(HANGUL_INPUT_MESSAGE)).not.toBeInTheDocument()
  })

  it('한글(IME) 조합이 시작된 것만으로는 안내를 표시하지 않는다 — 영문 입력 중 오탐 방지', () => {
    render(<TestHost sendCode={mockSendCode} />)

    const emailInput = screen.getByLabelText('이메일 *') as HTMLInputElement
    fireEvent.compositionStart(emailInput)

    expect(screen.queryByText(HANGUL_INPUT_MESSAGE)).not.toBeInTheDocument()
  })

  it('한글(IME) 조합 중 실제로 한글이 포함된 값이 오면 즉시 안내를 표시하고, 조합 중에는 값을 바꾸지 않는다', () => {
    render(<TestHost sendCode={mockSendCode} />)

    const emailInput = screen.getByLabelText('이메일 *') as HTMLInputElement
    fireEvent.compositionStart(emailInput)
    fireEvent.change(emailInput, { target: { value: 'ㄱ' } })

    expect(screen.getByText(HANGUL_INPUT_MESSAGE)).toBeInTheDocument()
    expect(emailInput.value).toBe('')
  })

  it('한글(IME) 조합 이벤트가 발생해도 조합 중인 값에 한글이 없으면(영문 조합 등) 값을 그대로 반영한다', () => {
    render(<TestHost sendCode={mockSendCode} />)

    const emailInput = screen.getByLabelText('이메일 *') as HTMLInputElement
    fireEvent.compositionStart(emailInput)
    fireEvent.change(emailInput, { target: { value: 'a' } })

    expect(screen.queryByText(HANGUL_INPUT_MESSAGE)).not.toBeInTheDocument()
    expect(emailInput.value).toBe('a')
  })

  it('한글(IME) 조합이 끝나면 그 시점의 최종 값에서 한글을 제거해 반영한다', () => {
    render(<TestHost sendCode={mockSendCode} />)

    const emailInput = screen.getByLabelText('이메일 *') as HTMLInputElement
    fireEvent.compositionStart(emailInput)
    fireEvent.compositionEnd(emailInput, { target: { value: '가test' } })

    expect(emailInput.value).toBe('test')
  })

  it('평상시 이메일 입력칸은 회색 테두리를 사용한다', () => {
    render(<TestHost sendCode={mockSendCode} />)

    expect(screen.getByLabelText('이메일 *').parentElement).toHaveClass('border-[#c9c9c4]')
  })

  it('한글을 입력하면 이메일 입력칸 테두리가 빨간색(#bf3329)으로 바뀐다', async () => {
    render(<TestHost sendCode={mockSendCode} />)

    await userEvent.type(screen.getByLabelText('이메일 *'), '한')

    expect(screen.getByLabelText('이메일 *').parentElement).toHaveClass('border-[#bf3329]')
  })

  describe('발송 횟수 제한(sendLimit)', () => {
    const SEND_LIMIT = {
      purpose: 'register-send' as const,
      maxAttempts: 5,
      windowMs: 24 * 60 * 60 * 1000,
    }

    it('한도(5회)에 도달할 때까지의 성공한 발송에서는 초과 안내가 뜨지 않는다(마지막 성공 시도 포함)', async () => {
      const sendCode = vi.fn().mockResolvedValue({
        result: true,
        statusCode: 200,
        data: { success: true },
        message: [],
      })
      render(<TestHost sendCode={sendCode} sendLimit={SEND_LIMIT} />)

      await userEvent.type(screen.getByLabelText('이메일 *'), VALID_EMAIL)
      await userEvent.click(screen.getByRole('button', { name: '인증번호 전송' }))
      await waitFor(() => expect(sendCode).toHaveBeenCalledTimes(1))

      for (let i = 0; i < 4; i++) {
        await waitFor(() =>
          expect(screen.getByRole('button', { name: '재전송' })).not.toBeDisabled()
        )
        await userEvent.click(screen.getByRole('button', { name: '재전송' }))
        const expectedCalls = i + 2
        await waitFor(() => expect(sendCode).toHaveBeenCalledTimes(expectedCalls))
      }

      // 5번째(마지막) 발송까지는 정상적으로 성공한 시도이므로, 카운트가 한도에 도달했더라도
      // 초과 안내가 뜨거나 버튼이 disabled되면 안 된다
      await waitFor(() => {
        expect(screen.getByRole('button', { name: '재전송' })).not.toBeDisabled()
      })
      expect(
        screen.queryByText(
          '인증코드 발송 횟수(5회)를 초과했습니다. 마지막 발송 후 24시간이 지나면 다시 요청할 수 있습니다'
        )
      ).not.toBeInTheDocument()
    })

    it('한도(5회)를 넘겨 6번째로 발송을 시도하면 그때 비로소 초과 안내가 뜨고 버튼이 disabled된다', async () => {
      const sendCode = vi.fn().mockResolvedValue({
        result: true,
        statusCode: 200,
        data: { success: true },
        message: [],
      })
      render(<TestHost sendCode={sendCode} sendLimit={SEND_LIMIT} />)

      await userEvent.type(screen.getByLabelText('이메일 *'), VALID_EMAIL)
      await userEvent.click(screen.getByRole('button', { name: '인증번호 전송' }))
      await waitFor(() => expect(sendCode).toHaveBeenCalledTimes(1))

      for (let i = 0; i < 4; i++) {
        await waitFor(() =>
          expect(screen.getByRole('button', { name: '재전송' })).not.toBeDisabled()
        )
        await userEvent.click(screen.getByRole('button', { name: '재전송' }))
        const expectedCalls = i + 2
        await waitFor(() => expect(sendCode).toHaveBeenCalledTimes(expectedCalls))
      }

      // 6번째 시도 — 여기서 비로소 막히고 안내가 표시된다
      await userEvent.click(screen.getByRole('button', { name: '재전송' }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '재전송' })).toBeDisabled()
        expect(screen.getByRole('button', { name: '인증번호 전송' })).toBeDisabled()
      })
      expect(
        screen.getByText(
          '인증코드 발송 횟수(5회)를 초과했습니다. 마지막 발송 후 24시간이 지나면 다시 요청할 수 있습니다'
        )
      ).toBeInTheDocument()

      // 6번째 시도는 API를 호출하지 않는다(프론트에서 막힘)
      expect(sendCode).toHaveBeenCalledTimes(5)
    })

    it('로컬 기록이 없어도(예: 다른 기기에서 이미 초과) 서버가 409로 거절하면 즉시 초과 안내가 뜨고 버튼이 disabled된다', async () => {
      const LIMIT_EXCEEDED_MESSAGE =
        '인증코드 발송 횟수(5회)를 초과했습니다. 마지막 발송 후 24시간이 지나면 다시 요청할 수 있습니다'
      const sendCode = vi.fn().mockRejectedValue(new ApiError(LIMIT_EXCEEDED_MESSAGE, 409))
      render(<TestHost sendCode={sendCode} sendLimit={SEND_LIMIT} />)

      await userEvent.type(screen.getByLabelText('이메일 *'), VALID_EMAIL)
      await userEvent.click(screen.getByRole('button', { name: '인증번호 전송' }))

      expect(await screen.findByText(LIMIT_EXCEEDED_MESSAGE)).toBeInTheDocument()
      await waitFor(() => {
        expect(screen.getByRole('button', { name: '인증번호 전송' })).toBeDisabled()
      })
      // 로컬 가드가 아니라 서버 응답으로 감지된 것이므로 실제로는 1번만 호출된다
      expect(sendCode).toHaveBeenCalledTimes(1)
    })

    it('sendLimit을 지정하지 않으면 한도 없이 계속 재전송할 수 있다', async () => {
      const sendCode = vi.fn().mockResolvedValue({
        result: true,
        statusCode: 200,
        data: { success: true },
        message: [],
      })
      render(<TestHost sendCode={sendCode} />)

      await userEvent.type(screen.getByLabelText('이메일 *'), VALID_EMAIL)
      await userEvent.click(screen.getByRole('button', { name: '인증번호 전송' }))
      await waitFor(() => expect(sendCode).toHaveBeenCalledTimes(1))

      for (let i = 0; i < 5; i++) {
        await waitFor(() =>
          expect(screen.getByRole('button', { name: '재전송' })).not.toBeDisabled()
        )
        await userEvent.click(screen.getByRole('button', { name: '재전송' }))
      }

      await waitFor(() => expect(sendCode).toHaveBeenCalledTimes(6))
      expect(screen.getByRole('button', { name: '재전송' })).not.toBeDisabled()
    })
  })

  it('인증번호 전송 실패 시 이메일 입력칸 테두리도 빨간색(#bf3329)으로 바뀐다', async () => {
    const sendCode = vi.fn().mockRejectedValue(new Error('이미 가입된 이메일입니다.'))
    render(<TestHost sendCode={sendCode} />)

    await userEvent.type(screen.getByLabelText('이메일 *'), VALID_EMAIL)
    await userEvent.click(screen.getByRole('button', { name: '인증번호 전송' }))
    await screen.findByText('이미 가입된 이메일입니다.')

    expect(screen.getByLabelText('이메일 *').parentElement).toHaveClass('border-[#bf3329]')
  })

  describe('emailDisabled', () => {
    it('true면 이메일 입력칸이 비활성화되어 입력해도 값이 바뀌지 않는다', async () => {
      render(<TestHost sendCode={mockSendCode} initialEmail={VALID_EMAIL} emailDisabled />)

      const emailInput = screen.getByLabelText('이메일 *')
      expect(emailInput).toHaveValue(VALID_EMAIL)
      expect(emailInput).toBeDisabled()

      await userEvent.type(emailInput, 'x')

      expect(emailInput).toHaveValue(VALID_EMAIL)
    })

    it('true면 한글을 입력해도(값이 바뀌지 않으므로) 한글 안내 문구를 표시하지 않는다', () => {
      render(<TestHost sendCode={mockSendCode} initialEmail={VALID_EMAIL} emailDisabled />)

      fireEvent.change(screen.getByLabelText('이메일 *'), { target: { value: '한글' } })

      expect(screen.queryByText(HANGUL_INPUT_MESSAGE)).not.toBeInTheDocument()
    })

    it('기본값(false)일 때는 이메일 입력칸을 수정할 수 있다', async () => {
      render(<TestHost sendCode={mockSendCode} />)

      const emailInput = screen.getByLabelText('이메일 *')
      expect(emailInput).not.toBeDisabled()

      await userEvent.type(emailInput, VALID_EMAIL)

      expect(emailInput).toHaveValue(VALID_EMAIL)
    })
  })

  describe('이메일 지우기 버튼', () => {
    it('이메일 입력칸이 비어 있으면 지우기 버튼을 표시하지 않는다', () => {
      render(<TestHost sendCode={mockSendCode} />)

      expect(screen.queryByLabelText('이메일 입력값 지우기')).not.toBeInTheDocument()
    })

    it('이메일을 입력하면 지우기 버튼이 나타나고, 클릭하면 입력값이 지워진다', async () => {
      render(<TestHost sendCode={mockSendCode} />)

      const emailInput = screen.getByLabelText('이메일 *')
      await userEvent.type(emailInput, VALID_EMAIL)

      const clearButton = screen.getByLabelText('이메일 입력값 지우기')
      await userEvent.click(clearButton)

      expect(emailInput).toHaveValue('')
      expect(screen.queryByLabelText('이메일 입력값 지우기')).not.toBeInTheDocument()
    })

    it('emailDisabled가 true면 값이 있어도 지우기 버튼을 표시하지 않는다', () => {
      render(<TestHost sendCode={mockSendCode} initialEmail={VALID_EMAIL} emailDisabled />)

      expect(screen.queryByLabelText('이메일 입력값 지우기')).not.toBeInTheDocument()
    })
  })
})
