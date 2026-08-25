import { cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { server } from '../../test/mocks/server'
import { render, screen } from '../../test/test-utils'
import { IdentityVerificationButton } from './IdentityVerificationButton'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@portone/browser-sdk/v2', () => ({
  requestIdentityVerification: vi.fn(),
}))

const mockPortOneSuccess = async () => {
  const { requestIdentityVerification } = await import('@portone/browser-sdk/v2')
  vi.mocked(requestIdentityVerification).mockResolvedValue({
    identityVerificationId: 'iv-success-id',
    transactionType: 'IDENTITY_VERIFICATION',
    identityVerificationTxId: 'tx-id',
  } as any)
}

const mockBackendVerifyResult = (data: Record<string, unknown>) => {
  server.use(
    http.post('*/v1/user/identity/verify', () =>
      HttpResponse.json({ result: true, statusCode: 201, data, message: [] })
    )
  )
}

// ─── Setup ─────────────────────────────────────────────────────────────────────

describe('IdentityVerificationButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    server.resetHandlers()
  })

  afterEach(() => {
    cleanup()
  })

  it('SDK 호출이 취소되면 에러를 표시한다', async () => {
    const { requestIdentityVerification } = await import('@portone/browser-sdk/v2')
    vi.mocked(requestIdentityVerification).mockResolvedValue({
      code: 'USER_CANCELLED',
      message: '사용자가 핸드폰인증을 취소했습니다.',
    } as any)

    render(<IdentityVerificationButton />)
    await userEvent.click(screen.getByRole('button', { name: /핸드폰인증/ }))

    expect(await screen.findByText(/사용자가 핸드폰인증을 취소했습니다./)).toBeInTheDocument()
    expect(screen.queryByRole('alert')).toBeInTheDocument()
  })

  it('SDK 호출 중 에러 메시지를 표시한다', async () => {
    const { requestIdentityVerification } = await import('@portone/browser-sdk/v2')
    vi.mocked(requestIdentityVerification).mockResolvedValue({
      code: 'SDK_ERROR',
      message: 'SDK 오류가 발생했습니다.',
    } as any)

    render(<IdentityVerificationButton />)
    await userEvent.click(screen.getByRole('button', { name: /핸드폰인증/ }))

    expect(await screen.findByText(/SDK 오류가 발생했습니다./)).toBeInTheDocument()
  })

  it('백엔드가 isVerified: false를 반환하면 에러를 표시한다', async () => {
    await mockPortOneSuccess()
    mockBackendVerifyResult({ isVerified: false })

    render(<IdentityVerificationButton />)
    await userEvent.click(screen.getByRole('button', { name: /핸드폰인증/ }))

    expect(await screen.findByText(/본인인증에 실패했습니다/)).toBeInTheDocument()
  })

  it('인증 성공 시 완료 메시지를 표시하고 onVerified로 백엔드 확인 결과를 전달한다', async () => {
    await mockPortOneSuccess()
    mockBackendVerifyResult({
      isVerified: true,
      hasExistingAccount: false,
      maskedName: '홍길*',
      maskedBirth: '1990-**-**',
      maskedMobile: '010-**-5678',
      gender: 'M',
    })

    const onVerified = vi.fn()
    render(<IdentityVerificationButton onVerified={onVerified} />)
    await userEvent.click(screen.getByRole('button', { name: /핸드폰인증/ }))

    expect(await screen.findByText(/핸드폰인증이 완료되었습니다./)).toBeInTheDocument()
    expect(onVerified).toHaveBeenCalledWith(
      expect.objectContaining({ isVerified: true, hasExistingAccount: false, maskedName: '홍길*' })
    )
  })

  it('인증 중에는 버튼이 disabled 상태다', async () => {
    let resolveVerification: () => void = () => {}
    const verificationPromise = new Promise<void>((resolve) => {
      resolveVerification = resolve
    })

    const { requestIdentityVerification } = await import('@portone/browser-sdk/v2')
    vi.mocked(requestIdentityVerification).mockImplementation(async () => {
      await verificationPromise
      return {
        identityVerificationId: 'iv-id',
        transactionType: 'IDENTITY_VERIFICATION',
        identityVerificationTxId: 'tx-id',
      } as any
    })
    mockBackendVerifyResult({ isVerified: true, hasExistingAccount: false })

    render(<IdentityVerificationButton />)
    const button = screen.getByRole('button', { name: /핸드폰인증/ })

    await userEvent.click(button)

    expect(button).toBeDisabled()
    expect(button).toHaveTextContent(/핸드폰인증 중/)

    resolveVerification()
    // 인증 완료까지 대기하여 act 경고 방지
    await screen.findByText(/핸드폰인증이 완료되었습니다./)
  })

  it('className을 지정하지 않으면 기본 스타일을 사용한다', () => {
    render(<IdentityVerificationButton />)

    expect(screen.getByRole('button', { name: /핸드폰인증/ })).toHaveClass('border-gray-300')
  })

  it('className을 지정하면 기본 스타일 대신 해당 클래스가 적용된다', () => {
    render(<IdentityVerificationButton label="휴대폰 인증" className="custom-verify-button" />)

    const button = screen.getByRole('button', { name: /휴대폰 인증/ })
    expect(button).toHaveClass('custom-verify-button')
    expect(button).not.toHaveClass('border-gray-300')
  })

  it('인증에 실패한 뒤 다시 시도할 수 있다', async () => {
    const { requestIdentityVerification } = await import('@portone/browser-sdk/v2')

    vi.mocked(requestIdentityVerification).mockResolvedValueOnce({
      code: 'USER_CANCELLED',
      message: '사용자가 취소했습니다.',
    } as any)

    render(<IdentityVerificationButton />)
    const button = screen.getByRole('button', { name: /핸드폰인증/ })

    await userEvent.click(button)
    expect(await screen.findByText(/사용자가 취소했습니다./)).toBeInTheDocument()

    vi.mocked(requestIdentityVerification).mockResolvedValueOnce({
      identityVerificationId: 'iv-success-1',
      transactionType: 'IDENTITY_VERIFICATION',
      identityVerificationTxId: 'tx-id',
    } as any)
    mockBackendVerifyResult({ isVerified: true, hasExistingAccount: false })

    await userEvent.click(button)
    expect(await screen.findByText(/핸드폰인증이 완료되었습니다./)).toBeInTheDocument()
  })
})
