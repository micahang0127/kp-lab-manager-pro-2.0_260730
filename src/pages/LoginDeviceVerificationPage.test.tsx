import { useNavigate } from '@tanstack/react-router'
import { waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '../api'
import { loginVerifyDevice, sendEmailVerificationCode } from '../api/auth'
import { useAuthStore } from '../stores/authStore'
import { useEmailVerificationLimitStore } from '../stores/emailVerificationLimitStore'
import { useLoginFlowStore } from '../stores/loginFlowStore'
import { render, screen } from '../test/test-utils'
import { LoginDeviceVerificationPage } from './LoginDeviceVerificationPage'

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: vi.fn(),
}))

vi.mock('../api/auth', () => ({
  sendEmailVerificationCode: vi.fn(),
  loginVerifyDevice: vi.fn(),
}))

const PENDING = {
  email: 'user@koreapetroleum.com',
  password: 'password1',
  fingerprintCode: 'fp-1234',
  device: 'W' as const,
}

const SESSION_RESPONSE = {
  accessToken: 'access-token-abc',
  userIdx: '1',
  userName: '홍길동',
  orgIdx: '1',
  orgName: '테스트 회사',
  userGrade: 0,
}

async function typeCode(code: string) {
  for (let i = 0; i < code.length; i++) {
    await userEvent.type(screen.getByLabelText(`인증번호 ${i + 1}번째 자리`), code[i])
  }
}

/** 마운트 시 자동 발송된 인증번호가 도착해 입력칸이 활성화될 때까지 기다린다 */
async function waitForAutoSend() {
  await waitFor(() => {
    expect(screen.getByText(/남은 시간 \d{2}:\d{2}/)).toBeInTheDocument()
  })
}

describe('LoginDeviceVerificationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useNavigate).mockReturnValue(mockNavigate)
    sessionStorage.clear()
    document.cookie = 'emailVerificationLimit=; max-age=0; path=/'
    useEmailVerificationLimitStore.setState({ records: {} })
    useAuthStore.setState({ isLoggedIn: false, userSession: null })
    useLoginFlowStore.setState({ pending: PENDING })

    vi.mocked(sendEmailVerificationCode).mockResolvedValue({
      result: true,
      statusCode: 200,
      data: { success: true },
      message: [],
    })
    vi.mocked(loginVerifyDevice).mockResolvedValue({
      result: true,
      statusCode: 201,
      data: SESSION_RESPONSE,
      message: [],
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('pending이 없으면 아무것도 렌더링하지 않는다', () => {
    useLoginFlowStore.setState({ pending: null })

    const { container } = render(<LoginDeviceVerificationPage />)

    expect(container).toBeEmptyDOMElement()
  })

  it('제목과 안내 문구, 마스킹된 이메일을 렌더링한다', async () => {
    render(<LoginDeviceVerificationPage />)

    expect(screen.getByRole('heading', { name: '보안 인증' })).toBeInTheDocument()
    expect(screen.getByText('새로운 브라우저에서 로그인하고 있습니다.')).toBeInTheDocument()
    expect(screen.getByText('계정 보호를 위해 추가 인증이 필요합니다.')).toBeInTheDocument()
    expect(screen.getByText('가입한 이메일에서 인증번호를 확인해 주세요.')).toBeInTheDocument()
    expect(screen.getByText('us**@ko************.com')).toBeInTheDocument()
    expect(screen.queryByLabelText('이메일 *')).not.toBeInTheDocument()

    // 백그라운드에서 진행되는 자동 발송이 언마운트 이후 상태를 갱신해 act 경고가 뜨지 않도록
    // 완료될 때까지 기다린다
    await waitForAutoSend()
  })

  it("마운트 시 authType: '1'로 인증번호를 자동 발송하고 fingerprintCode를 보내지 않는다", async () => {
    render(<LoginDeviceVerificationPage />)

    await waitFor(() => {
      expect(sendEmailVerificationCode).toHaveBeenCalledWith({
        email: PENDING.email,
        authType: '1',
      })
    })
    expect(sendEmailVerificationCode).toHaveBeenCalledTimes(1)
    await waitForAutoSend()
    screen.getAllByLabelText(/인증번호 \d번째 자리/).forEach((box) => {
      expect(box).not.toBeDisabled()
    })
  })

  it('6자리 입력 후 확인을 클릭하면 pending의 email/password/fingerprintCode/device를 그대로 전달한다', async () => {
    render(<LoginDeviceVerificationPage />)
    await waitForAutoSend()

    await typeCode('123456')
    await userEvent.click(screen.getByRole('button', { name: '확인' }))

    await waitFor(() => {
      expect(loginVerifyDevice).toHaveBeenCalledWith({
        email: PENDING.email,
        password: PENDING.password,
        code: '123456',
        fingerprintCode: PENDING.fingerprintCode,
        device: PENDING.device,
      })
    })
  })

  it('성공하면 토큰을 저장하고 pending을 비운 뒤 /main으로 이동한다', async () => {
    render(<LoginDeviceVerificationPage />)
    await waitForAutoSend()

    await typeCode('123456')
    await userEvent.click(screen.getByRole('button', { name: '확인' }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/main' })
    })
    expect(sessionStorage.getItem('accessToken')).toBe('access-token-abc')
    expect(useAuthStore.getState().isLoggedIn).toBe(true)
    expect(useLoginFlowStore.getState().pending).toBeNull()
  })

  it('401 실패 시 서버 메시지를 그대로 표시한다', async () => {
    vi.mocked(loginVerifyDevice).mockRejectedValue(
      new ApiError('인증코드가 올바르지 않습니다 (남은 시도 4회)', 401)
    )
    render(<LoginDeviceVerificationPage />)
    await waitForAutoSend()

    await typeCode('000000')
    await userEvent.click(screen.getByRole('button', { name: '확인' }))

    expect(await screen.findByText(/남은 시도 4회/)).toBeInTheDocument()
  })

  it('인증번호 재전송 클릭 시 다시 발송한다', async () => {
    render(<LoginDeviceVerificationPage />)
    await waitForAutoSend()

    await userEvent.click(screen.getByRole('button', { name: '인증번호 재전송' }))

    await waitFor(() => {
      expect(sendEmailVerificationCode).toHaveBeenCalledTimes(2)
    })
  })

  it('자동 발송이 실패해도 재전송 버튼은 비활성화되지 않는다(유일한 재시도 수단)', async () => {
    vi.mocked(sendEmailVerificationCode).mockRejectedValueOnce(new ApiError('발송 실패', 500))
    render(<LoginDeviceVerificationPage />)

    await waitFor(() => {
      expect(sendEmailVerificationCode).toHaveBeenCalledTimes(1)
    })
    const resendButton = await screen.findByRole('button', { name: '인증번호 재전송' })
    expect(resendButton).not.toBeDisabled()

    // 실패 후 재시도하면 정상적으로 다시 발송된다
    await userEvent.click(resendButton)
    await waitForAutoSend()
    expect(sendEmailVerificationCode).toHaveBeenCalledTimes(2)
  })

  it('진입 시 이 브라우저에 이미 5회 발송 기록이 남아있으면 API 호출 없이도 초과 안내를 표시한다', async () => {
    useEmailVerificationLimitStore.setState({
      records: {
        [`login-send:${PENDING.email}`]: { count: 5, firstAttemptAt: Date.now() },
      },
    })
    render(<LoginDeviceVerificationPage />)

    expect(await screen.findByText(/인증코드 발송 횟수\(5회\)를 초과했습니다/)).toBeInTheDocument()
    // 로컬에서 이미 초과를 감지했으므로 실제 발송 API는 호출하지 않는다
    expect(sendEmailVerificationCode).not.toHaveBeenCalled()
    // 더 이상 재시도할 수 없으므로 재전송 버튼 자체가 없어야 한다
    expect(screen.queryByRole('button', { name: '인증번호 재전송' })).not.toBeInTheDocument()
  })

  it('진입 시 이미 발송 횟수(5회)를 초과했다는 서버 에러(409)가 오면 해당 메시지를 표시하고 재전송 버튼을 없앤다', async () => {
    const LIMIT_EXCEEDED_MESSAGE =
      '인증코드 발송 횟수(5회)를 초과했습니다. 마지막 발송 후 24시간이 지나면 다시 요청할 수 있습니다'
    vi.mocked(sendEmailVerificationCode).mockRejectedValue(
      new ApiError(LIMIT_EXCEEDED_MESSAGE, 409)
    )
    render(<LoginDeviceVerificationPage />)

    expect(await screen.findByText(LIMIT_EXCEEDED_MESSAGE)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '인증번호 재전송' })).not.toBeInTheDocument()
  })

  it('발송 실패가 409가 아니면(예: 500) 재전송 버튼을 계속 보여준다', async () => {
    vi.mocked(sendEmailVerificationCode).mockRejectedValue(
      new ApiError('서버 오류가 발생했습니다', 500)
    )
    render(<LoginDeviceVerificationPage />)

    expect(await screen.findByText('서버 오류가 발생했습니다')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '인증번호 재전송' })).not.toBeDisabled()
  })

  it('"취소" 클릭 시 pending을 비우고 /login으로 이동한다', async () => {
    render(<LoginDeviceVerificationPage />)

    await userEvent.click(screen.getByRole('button', { name: '취소' }))

    expect(useLoginFlowStore.getState().pending).toBeNull()
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/login' })
  })
})
