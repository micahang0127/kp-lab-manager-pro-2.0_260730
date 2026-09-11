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
    useRegisterFlowStore.setState({
      registerEmail: null,
      registerEmailCode: null,
      invitedOrgs: null,
    })
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
      expect(useRegisterFlowStore.getState().registerEmailCode).toBe('123456')
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
      expect(useRegisterFlowStore.getState().registerEmailCode).toBeNull()
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
        screen.getAllByLabelText(/인증번호 \d번째 자리/).forEach((box) => {
          expect(box).not.toHaveClass('border-[#d44038]')
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
