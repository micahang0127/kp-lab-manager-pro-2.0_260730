import { useNavigate } from '@tanstack/react-router'
import { act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '../api'
import { sendEmailVerificationCode, verifyRegisterEmailCode } from '../api/auth'
import { checkEmailDuplicate, getInvitedOrgs } from '../api/user'
import { useEmailVerificationLimitStore } from '../stores/emailVerificationLimitStore'
import { useFingerprintStore } from '../stores/fingerprintStore'
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
  sendEmailVerificationCode: vi.fn(),
  verifyRegisterEmailCode: vi.fn(),
}))

vi.mock('../api/user', () => ({
  checkEmailDuplicate: vi.fn(),
  getInvitedOrgs: vi.fn(),
  issueFingerprint: vi.fn(),
}))

const VALID_EMAIL = 'user@koreapetroleum.com'
const FINGERPRINT_CODE = 'test-fingerprint-code'

describe('RegisterEmailVerificationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // fingerprintCode는 useFingerprint 훅이 마운트 시 비동기로 발급받으므로, 발급 API를 별도로
    // 목킹하는 대신 이미 쿠키에 있는 상태로 시작해 테스트를 단순화한다 (발급 자체는 useFingerprint.test.ts에서 검증)
    useFingerprintStore.setState({ fingerprintCode: FINGERPRINT_CODE })
    // 발송/인증 횟수 제한(emailVerificationLimitStore)도 쿠키 기반이라 테스트 간 격리를 위해 초기화
    document.cookie = 'emailVerificationLimit=; max-age=0; path=/'
    useEmailVerificationLimitStore.setState({ records: {} })
    vi.mocked(useNavigate).mockReturnValue(mockNavigate)
    vi.mocked(checkEmailDuplicate).mockResolvedValue({
      result: true,
      statusCode: 201,
      data: { isDuplicated: false },
      message: [],
    })
    vi.mocked(sendEmailVerificationCode).mockResolvedValue({
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
    vi.mocked(getInvitedOrgs).mockResolvedValue({
      result: true,
      statusCode: 201,
      data: { invites: [] },
      message: [],
    })
    useRegisterFlowStore.setState({ registerEmail: null, invitedOrgs: null })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('페이지 제목과 약관 동의 완료 문구, 이메일 입력란을 렌더링한다', () => {
    render(<RegisterEmailVerificationPage />)

    expect(screen.getByRole('heading', { name: '회원가입' })).toBeInTheDocument()
    expect(screen.getByText('약관 동의 완료')).toBeInTheDocument()
    expect(screen.getByText('이메일을 인증해 주세요.')).toBeInTheDocument()
    expect(screen.getByLabelText('이메일 *')).toBeInTheDocument()
  })

  it('"이전" 버튼으로 되돌아와 store에 이미 인증했던 이메일이 남아있으면 입력칸에 복원되지만, 인증번호 입력칸은 다시 잠긴 상태로 시작한다', () => {
    useRegisterFlowStore.setState({ registerEmail: VALID_EMAIL })

    render(<RegisterEmailVerificationPage />)

    expect(screen.getByLabelText('이메일 *')).toHaveValue(VALID_EMAIL)
    screen.getAllByLabelText(/인증번호 \d번째 자리/).forEach((box) => {
      expect(box).toBeDisabled()
    })
    expect(screen.getByRole('button', { name: '인증번호 확인' })).toBeDisabled()
  })

  it('이메일 형식이 올바르지 않으면 "인증번호 전송" 버튼이 disabled다', async () => {
    render(<RegisterEmailVerificationPage />)

    await userEvent.type(screen.getByLabelText('이메일 *'), 'invalid-email')

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

    await userEvent.type(screen.getByLabelText('이메일 *'), VALID_EMAIL)
    await userEvent.click(screen.getByRole('button', { name: '인증번호 전송' }))

    await waitFor(() => {
      expect(checkEmailDuplicate).toHaveBeenCalledWith({ email: VALID_EMAIL })
      expect(sendEmailVerificationCode).toHaveBeenCalledWith({
        email: VALID_EMAIL,
        authType: '0',
        fingerprintCode: FINGERPRINT_CODE,
      })
      expect(screen.getByText(/남은 시간 \d{2}:\d{2}/)).toBeInTheDocument()
    })
    screen.getAllByLabelText(/인증번호 \d번째 자리/).forEach((box) => {
      expect(box).not.toBeDisabled()
    })
  })

  it('인증번호 6자리를 입력하고 확인을 클릭하면 registerEmail을 저장하고 비밀번호 설정 단계로 이동한다', async () => {
    render(<RegisterEmailVerificationPage />)

    await userEvent.type(screen.getByLabelText('이메일 *'), VALID_EMAIL)
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
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/register-password' })
    })
  })

  it('인증번호 확인 성공 시 인증에 사용한 email/code로 초대 조직을 조회하고 결과를 저장한다', async () => {
    vi.mocked(getInvitedOrgs).mockResolvedValue({
      result: true,
      statusCode: 201,
      data: {
        invites: [
          {
            invitedIdx: '12',
            orgIdx: '3',
            orgName: '테스트회사',
            orgGrade: 'MEMBER',
            invitedAt: '2026-09-04T01:23:45.000Z',
          },
        ],
      },
      message: [],
    })

    render(<RegisterEmailVerificationPage />)

    await userEvent.type(screen.getByLabelText('이메일 *'), VALID_EMAIL)
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
      expect(getInvitedOrgs).toHaveBeenCalledWith({ email: VALID_EMAIL, code: '123456' })
      expect(useRegisterFlowStore.getState().invitedOrgs).toEqual([
        {
          invitedIdx: '12',
          orgIdx: '3',
          orgName: '테스트회사',
          orgGrade: 'MEMBER',
          invitedAt: '2026-09-04T01:23:45.000Z',
        },
      ])
    })
  })

  it('초대 조직 조회가 실패해도 회원가입 진행을 막지 않는다(invitedOrgs는 null로 남음)', async () => {
    vi.mocked(getInvitedOrgs).mockRejectedValue(new Error('서버 오류가 발생했습니다.'))

    render(<RegisterEmailVerificationPage />)

    await userEvent.type(screen.getByLabelText('이메일 *'), VALID_EMAIL)
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
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/register-password' })
    })
    expect(getInvitedOrgs).toHaveBeenCalledWith({ email: VALID_EMAIL, code: '123456' })
    expect(useRegisterFlowStore.getState().invitedOrgs).toBeNull()
  })

  it('인증번호를 6자리 입력하기 전에는 "확인" 버튼이 disabled다', async () => {
    render(<RegisterEmailVerificationPage />)

    await userEvent.type(screen.getByLabelText('이메일 *'), VALID_EMAIL)
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

    await user.type(screen.getByLabelText('이메일 *'), VALID_EMAIL)
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
    it('이미 가입된 이메일이면 인증번호를 발송하지 않고 에러 메시지를 표시한다', async () => {
      vi.mocked(checkEmailDuplicate).mockResolvedValueOnce({
        result: true,
        statusCode: 201,
        data: { isDuplicated: true },
        message: [],
      })

      render(<RegisterEmailVerificationPage />)

      await userEvent.type(screen.getByLabelText('이메일 *'), VALID_EMAIL)
      await userEvent.click(screen.getByRole('button', { name: '인증번호 전송' }))

      expect(await screen.findByText('이미 가입된 이메일입니다.')).toBeInTheDocument()
      expect(sendEmailVerificationCode).not.toHaveBeenCalled()
      expect(screen.queryByText(/남은 시간 \d{2}:\d{2}/)).not.toBeInTheDocument()
    })

    it('인증번호 전송에 실패하면 에러 메시지를 표시한다', async () => {
      vi.mocked(sendEmailVerificationCode).mockRejectedValueOnce(
        new Error('이미 가입된 이메일입니다.')
      )

      render(<RegisterEmailVerificationPage />)

      await userEvent.type(screen.getByLabelText('이메일 *'), VALID_EMAIL)
      await userEvent.click(screen.getByRole('button', { name: '인증번호 전송' }))

      expect(await screen.findByText('이미 가입된 이메일입니다.')).toBeInTheDocument()
    })

    it('인증번호 확인에 실패하면 에러 메시지를 표시한다', async () => {
      vi.mocked(verifyRegisterEmailCode).mockRejectedValueOnce(
        new ApiError('잘못된 인증번호입니다.', 400)
      )

      render(<RegisterEmailVerificationPage />)

      await userEvent.type(screen.getByLabelText('이메일 *'), VALID_EMAIL)
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

    it('네트워크 오류 등(ApiError가 아닌 오류)은 인증 실패 횟수에 반영되지 않는다', async () => {
      const networkErrorMessage = '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
      vi.mocked(verifyRegisterEmailCode).mockRejectedValue(new Error(networkErrorMessage))

      render(<RegisterEmailVerificationPage />)

      await userEvent.type(screen.getByLabelText('이메일 *'), VALID_EMAIL)
      await userEvent.click(screen.getByRole('button', { name: '인증번호 전송' }))
      await waitFor(() => {
        expect(screen.getByText(/남은 시간 \d{2}:\d{2}/)).toBeInTheDocument()
      })

      // 서버가 인증번호를 거부한 게 아니라 매번 네트워크 오류가 나는 상황을 5회(잠금 한도만큼)
      // 반복해도, ApiError가 아니므로 실패 횟수에 반영되지 않아 잠금 안내가 뜨지 않아야 한다
      for (let attempt = 1; attempt <= 5; attempt++) {
        await userEvent.type(screen.getByLabelText('인증번호 1번째 자리'), '1')
        await userEvent.type(screen.getByLabelText('인증번호 2번째 자리'), '2')
        await userEvent.type(screen.getByLabelText('인증번호 3번째 자리'), '3')
        await userEvent.type(screen.getByLabelText('인증번호 4번째 자리'), '4')
        await userEvent.type(screen.getByLabelText('인증번호 5번째 자리'), '5')
        await userEvent.type(screen.getByLabelText('인증번호 6번째 자리'), '6')
        await userEvent.click(screen.getByRole('button', { name: '인증번호 확인' }))

        await waitFor(() => expect(verifyRegisterEmailCode).toHaveBeenCalledTimes(attempt))
        await screen.findByText(networkErrorMessage)

        for (const label of [
          '인증번호 6번째 자리',
          '인증번호 5번째 자리',
          '인증번호 4번째 자리',
          '인증번호 3번째 자리',
          '인증번호 2번째 자리',
          '인증번호 1번째 자리',
        ]) {
          await userEvent.type(screen.getByLabelText(label), '{backspace}')
        }
      }

      expect(
        screen.queryByText(
          '이메일 인증 실패 횟수(5회)를 초과했습니다. 24시간이 지나면 다시 시도할 수 있습니다.'
        )
      ).not.toBeInTheDocument()
      screen.getAllByLabelText(/인증번호 \d번째 자리/).forEach((box) => {
        expect(box).not.toBeDisabled()
      })
    })

    it('인증번호 확인 실패 후 재전송 없이 인증번호를 다시 입력하면 이전 에러 메시지와 빨간 강조가 사라진다', async () => {
      vi.mocked(verifyRegisterEmailCode).mockRejectedValueOnce(
        new ApiError('잘못된 인증번호입니다.', 400)
      )

      render(<RegisterEmailVerificationPage />)

      await userEvent.type(screen.getByLabelText('이메일 *'), VALID_EMAIL)
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

      // 재전송 없이, 틀린 인증번호의 마지막 자리를 지우고 다시 입력한다
      await userEvent.type(screen.getByLabelText('인증번호 6번째 자리'), '{backspace}')

      await waitFor(() => {
        expect(screen.queryByText('잘못된 인증번호입니다.')).not.toBeInTheDocument()
        expect(
          screen.queryByText('5회 실패 시 24시간 동안 인증이 제한됩니다.')
        ).not.toBeInTheDocument()
        screen.getAllByLabelText(/인증번호 \d번째 자리/).forEach((box) => {
          expect(box).not.toHaveClass('border-[#d44038]')
        })
      })

      await userEvent.type(screen.getByLabelText('인증번호 6번째 자리'), '7')

      expect(screen.queryByText('잘못된 인증번호입니다.')).not.toBeInTheDocument()
    })

    it('인증번호 확인 실패 후 "재전송"하면 이전 에러 메시지와 빨간 강조가 사라진다', async () => {
      vi.mocked(verifyRegisterEmailCode).mockRejectedValueOnce(
        new ApiError('잘못된 인증번호입니다.', 400)
      )

      render(<RegisterEmailVerificationPage />)

      await userEvent.type(screen.getByLabelText('이메일 *'), VALID_EMAIL)
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

      await userEvent.click(screen.getByRole('button', { name: '재전송' }))

      await waitFor(() => {
        expect(screen.queryByText('잘못된 인증번호입니다.')).not.toBeInTheDocument()
        expect(
          screen.queryByText('5회 실패 시 24시간 동안 인증이 제한됩니다.')
        ).not.toBeInTheDocument()
        screen.getAllByLabelText(/인증번호 \d번째 자리/).forEach((box) => {
          expect(box).not.toHaveClass('border-[#d44038]')
        })
      })
    })

    it('인증번호 확인 실패가 5회에 도달하면(마지막 시도 포함) 한도 초과 안내로 바뀌고 입력칸/확인 버튼이 disabled된다', async () => {
      vi.mocked(verifyRegisterEmailCode).mockRejectedValue(
        new ApiError('잘못된 인증번호입니다.', 400)
      )

      render(<RegisterEmailVerificationPage />)

      await userEvent.type(screen.getByLabelText('이메일 *'), VALID_EMAIL)
      await userEvent.click(screen.getByRole('button', { name: '인증번호 전송' }))
      await waitFor(() => {
        expect(screen.getByText(/남은 시간 \d{2}:\d{2}/)).toBeInTheDocument()
      })

      // 1~4번째 실패까지는 서버 메시지("잘못된 인증번호입니다.")가 그대로 표시된다
      for (let attempt = 1; attempt <= 4; attempt++) {
        await userEvent.type(screen.getByLabelText('인증번호 1번째 자리'), '1')
        await userEvent.type(screen.getByLabelText('인증번호 2번째 자리'), '2')
        await userEvent.type(screen.getByLabelText('인증번호 3번째 자리'), '3')
        await userEvent.type(screen.getByLabelText('인증번호 4번째 자리'), '4')
        await userEvent.type(screen.getByLabelText('인증번호 5번째 자리'), '5')
        await userEvent.type(screen.getByLabelText('인증번호 6번째 자리'), '6')
        await userEvent.click(screen.getByRole('button', { name: '인증번호 확인' }))

        await waitFor(() => expect(verifyRegisterEmailCode).toHaveBeenCalledTimes(attempt))
        await screen.findByText('잘못된 인증번호입니다.')

        // 다음 시도를 위해 입력칸을 비운다
        for (const label of [
          '인증번호 6번째 자리',
          '인증번호 5번째 자리',
          '인증번호 4번째 자리',
          '인증번호 3번째 자리',
          '인증번호 2번째 자리',
          '인증번호 1번째 자리',
        ]) {
          await userEvent.type(screen.getByLabelText(label), '{backspace}')
        }
      }

      // 5번째(마지막) 시도 — 이 시도가 실패로 기록되는 순간 한도(5회)에 도달하므로, 서버 메시지
      // 대신 한도 초과 안내가 표시되고 입력칸/확인 버튼이 모두 disabled된다
      await userEvent.type(screen.getByLabelText('인증번호 1번째 자리'), '1')
      await userEvent.type(screen.getByLabelText('인증번호 2번째 자리'), '2')
      await userEvent.type(screen.getByLabelText('인증번호 3번째 자리'), '3')
      await userEvent.type(screen.getByLabelText('인증번호 4번째 자리'), '4')
      await userEvent.type(screen.getByLabelText('인증번호 5번째 자리'), '5')
      await userEvent.type(screen.getByLabelText('인증번호 6번째 자리'), '6')
      await userEvent.click(screen.getByRole('button', { name: '인증번호 확인' }))

      await waitFor(() => expect(verifyRegisterEmailCode).toHaveBeenCalledTimes(5))
      await waitFor(() => {
        expect(
          screen.getByText(
            '이메일 인증 실패 횟수(5회)를 초과했습니다. 24시간이 지나면 다시 시도할 수 있습니다.'
          )
        ).toBeInTheDocument()
        expect(screen.getByRole('button', { name: '인증번호 확인' })).toBeDisabled()
        screen.getAllByLabelText(/인증번호 \d번째 자리/).forEach((box) => {
          expect(box).toBeDisabled()
        })
        // 잠긴 상태에서는 한도 초과 안내와 모순되는 "남은 시간"/"인증 시간이 만료되었습니다"
        // 안내를 함께 보여주지 않는다
        expect(screen.queryByText(/남은 시간 \d{2}:\d{2}/)).not.toBeInTheDocument()
        expect(screen.queryByText(/인증 시간이 만료되었습니다/)).not.toBeInTheDocument()
      })

      // 확인 버튼과 입력칸이 모두 disabled이므로 추가 시도가 API를 호출하지 않는다
      expect(verifyRegisterEmailCode).toHaveBeenCalledTimes(5)
    })

    it('한도(5회) 미만일 때 재전송하면 실패 카운트가 초기화되어 새 인증번호로 다시 5회를 시도할 수 있다', async () => {
      vi.mocked(verifyRegisterEmailCode).mockRejectedValue(
        new ApiError('잘못된 인증번호입니다.', 400)
      )

      render(<RegisterEmailVerificationPage />)

      await userEvent.type(screen.getByLabelText('이메일 *'), VALID_EMAIL)
      await userEvent.click(screen.getByRole('button', { name: '인증번호 전송' }))
      await waitFor(() => {
        expect(screen.getByText(/남은 시간 \d{2}:\d{2}/)).toBeInTheDocument()
      })

      const typeAndSubmit = async () => {
        await userEvent.type(screen.getByLabelText('인증번호 1번째 자리'), '1')
        await userEvent.type(screen.getByLabelText('인증번호 2번째 자리'), '2')
        await userEvent.type(screen.getByLabelText('인증번호 3번째 자리'), '3')
        await userEvent.type(screen.getByLabelText('인증번호 4번째 자리'), '4')
        await userEvent.type(screen.getByLabelText('인증번호 5번째 자리'), '5')
        await userEvent.type(screen.getByLabelText('인증번호 6번째 자리'), '6')
        await userEvent.click(screen.getByRole('button', { name: '인증번호 확인' }))
      }
      const clearDigits = async () => {
        for (const label of [
          '인증번호 6번째 자리',
          '인증번호 5번째 자리',
          '인증번호 4번째 자리',
          '인증번호 3번째 자리',
          '인증번호 2번째 자리',
          '인증번호 1번째 자리',
        ]) {
          await userEvent.type(screen.getByLabelText(label), '{backspace}')
        }
      }

      // 첫 번째 인증번호로 3회 실패 (한도 5회 미만)
      for (let attempt = 1; attempt <= 3; attempt++) {
        await typeAndSubmit()
        await waitFor(() => expect(verifyRegisterEmailCode).toHaveBeenCalledTimes(attempt))
        await screen.findByText('잘못된 인증번호입니다.')
        await clearDigits()
      }

      // 재전송으로 새 인증번호를 발급받으면 이전 실패 카운트(3회)는 이어지지 않는다
      await userEvent.click(screen.getByRole('button', { name: '재전송' }))
      await waitFor(() => expect(sendEmailVerificationCode).toHaveBeenCalledTimes(2))

      // 새 인증번호로 3회를 더 틀려도(누적하면 6회지만 새 인증번호 기준으로는 3회) 아직 잠기지 않는다
      for (let attempt = 4; attempt <= 6; attempt++) {
        await typeAndSubmit()
        await waitFor(() => expect(verifyRegisterEmailCode).toHaveBeenCalledTimes(attempt))
        await screen.findByText('잘못된 인증번호입니다.')
        expect(
          screen.queryByText(
            '이메일 인증 실패 횟수(5회)를 초과했습니다. 24시간이 지나면 다시 시도할 수 있습니다.'
          )
        ).not.toBeInTheDocument()
        await clearDigits()
      }

      // 새 인증번호 기준 4, 5번째 실패(전체 누적 7, 8번째)에서 비로소 잠긴다
      await typeAndSubmit()
      await waitFor(() => expect(verifyRegisterEmailCode).toHaveBeenCalledTimes(7))
      await screen.findByText('잘못된 인증번호입니다.')
      await clearDigits()

      await typeAndSubmit()
      await waitFor(() => expect(verifyRegisterEmailCode).toHaveBeenCalledTimes(8))
      await waitFor(() => {
        expect(
          screen.getByText(
            '이메일 인증 실패 횟수(5회)를 초과했습니다. 24시간이 지나면 다시 시도할 수 있습니다.'
          )
        ).toBeInTheDocument()
      })
    })

    it('이미 5회 실패해 잠긴 상태여도 재전송으로 새 인증번호를 받으면 잠금이 풀려 다시 시도할 수 있다', async () => {
      vi.mocked(verifyRegisterEmailCode).mockRejectedValue(
        new ApiError('잘못된 인증번호입니다.', 400)
      )

      render(<RegisterEmailVerificationPage />)

      await userEvent.type(screen.getByLabelText('이메일 *'), VALID_EMAIL)
      await userEvent.click(screen.getByRole('button', { name: '인증번호 전송' }))
      await waitFor(() => {
        expect(screen.getByText(/남은 시간 \d{2}:\d{2}/)).toBeInTheDocument()
      })

      for (let attempt = 1; attempt <= 5; attempt++) {
        await userEvent.type(screen.getByLabelText('인증번호 1번째 자리'), '1')
        await userEvent.type(screen.getByLabelText('인증번호 2번째 자리'), '2')
        await userEvent.type(screen.getByLabelText('인증번호 3번째 자리'), '3')
        await userEvent.type(screen.getByLabelText('인증번호 4번째 자리'), '4')
        await userEvent.type(screen.getByLabelText('인증번호 5번째 자리'), '5')
        await userEvent.type(screen.getByLabelText('인증번호 6번째 자리'), '6')
        await userEvent.click(screen.getByRole('button', { name: '인증번호 확인' }))
        await waitFor(() => expect(verifyRegisterEmailCode).toHaveBeenCalledTimes(attempt))

        if (attempt < 5) {
          await screen.findByText('잘못된 인증번호입니다.')
          for (const label of [
            '인증번호 6번째 자리',
            '인증번호 5번째 자리',
            '인증번호 4번째 자리',
            '인증번호 3번째 자리',
            '인증번호 2번째 자리',
            '인증번호 1번째 자리',
          ]) {
            await userEvent.type(screen.getByLabelText(label), '{backspace}')
          }
        }
      }

      await waitFor(() => {
        expect(
          screen.getByText(
            '이메일 인증 실패 횟수(5회)를 초과했습니다. 24시간이 지나면 다시 시도할 수 있습니다.'
          )
        ).toBeInTheDocument()
        expect(screen.getByRole('button', { name: '인증번호 확인' })).toBeDisabled()
      })

      // 재전송(새 인증번호 발급)하면 실패 카운트는 "해당 인증번호" 단위이므로 잠금이 풀린다
      await userEvent.click(screen.getByRole('button', { name: '재전송' }))
      await waitFor(() => expect(sendEmailVerificationCode).toHaveBeenCalledTimes(2))

      await waitFor(() => {
        expect(
          screen.queryByText(
            '이메일 인증 실패 횟수(5회)를 초과했습니다. 24시간이 지나면 다시 시도할 수 있습니다.'
          )
        ).not.toBeInTheDocument()
        screen.getAllByLabelText(/인증번호 \d번째 자리/).forEach((box) => {
          expect(box).not.toBeDisabled()
        })
      })

      // 새 인증번호로 다시 검증을 시도할 수 있다(6번째 API 호출이 실제로 일어남)
      await userEvent.type(screen.getByLabelText('인증번호 1번째 자리'), '1')
      await userEvent.type(screen.getByLabelText('인증번호 2번째 자리'), '2')
      await userEvent.type(screen.getByLabelText('인증번호 3번째 자리'), '3')
      await userEvent.type(screen.getByLabelText('인증번호 4번째 자리'), '4')
      await userEvent.type(screen.getByLabelText('인증번호 5번째 자리'), '5')
      await userEvent.type(screen.getByLabelText('인증번호 6번째 자리'), '6')
      await userEvent.click(screen.getByRole('button', { name: '인증번호 확인' }))

      await waitFor(() => expect(verifyRegisterEmailCode).toHaveBeenCalledTimes(6))
    })

    it('이전 세션에서 이미 잠긴 이메일이라도, 아직 인증번호를 보내지 않은 새 화면에서는 이메일만 입력했다고 초과 안내가 뜨지 않는다', async () => {
      // 쿠키에 이미 5회 초과(잠김) 기록이 남아있는 상황을 재현한다 — 예: 이전 세션에서
      // 5회 실패 후 페이지를 새로고침/재방문한 경우
      useEmailVerificationLimitStore.setState({
        records: {
          [`register-verify-fail:${VALID_EMAIL.toLowerCase()}`]: {
            count: 5,
            firstAttemptAt: Date.now(),
          },
        },
      })

      render(<RegisterEmailVerificationPage />)

      // 아직 "인증번호 전송"을 누르지 않았으므로(=현재 활성화된 인증번호가 없으므로) 이메일만
      // 입력한 상태에서는 초과 안내가 뜨면 안 된다
      await userEvent.type(screen.getByLabelText('이메일 *'), VALID_EMAIL)

      expect(
        screen.queryByText(
          '이메일 인증 실패 횟수(5회)를 초과했습니다. 24시간이 지나면 다시 시도할 수 있습니다.'
        )
      ).not.toBeInTheDocument()

      // 인증번호를 실제로 보내면(새 인증번호 발급) 이전 잠금 기록이 정리되어 정상적으로
      // 인증번호 입력칸이 활성화된다
      await userEvent.click(screen.getByRole('button', { name: '인증번호 전송' }))

      await waitFor(() => {
        expect(screen.getByText(/남은 시간 \d{2}:\d{2}/)).toBeInTheDocument()
        expect(
          screen.queryByText(
            '이메일 인증 실패 횟수(5회)를 초과했습니다. 24시간이 지나면 다시 시도할 수 있습니다.'
          )
        ).not.toBeInTheDocument()
        screen.getAllByLabelText(/인증번호 \d번째 자리/).forEach((box) => {
          expect(box).not.toBeDisabled()
        })
      })
    })

    it('인증번호 확인 실패 후 이메일을 새로 입력해 다시 전송하면 이전 에러 메시지가 사라진다', async () => {
      vi.mocked(verifyRegisterEmailCode).mockRejectedValueOnce(
        new ApiError('잘못된 인증번호입니다.', 400)
      )

      render(<RegisterEmailVerificationPage />)

      const emailInput = screen.getByLabelText('이메일 *')
      await userEvent.type(emailInput, VALID_EMAIL)
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

      await userEvent.clear(emailInput)
      await userEvent.type(emailInput, 'other@koreapetroleum.com')
      await userEvent.click(screen.getByRole('button', { name: '인증번호 전송' }))

      await waitFor(() => {
        expect(screen.queryByText('잘못된 인증번호입니다.')).not.toBeInTheDocument()
      })
    })
  })
})
