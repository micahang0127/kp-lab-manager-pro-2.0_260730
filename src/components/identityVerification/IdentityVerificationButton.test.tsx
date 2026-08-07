import { cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { render, screen } from '../../test/test-utils'
import { IdentityVerificationButton } from './IdentityVerificationButton'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@portone/browser-sdk/v2', () => ({
  requestIdentityVerification: vi.fn(),
}))

// ─── Setup ─────────────────────────────────────────────────────────────────────

describe('IdentityVerificationButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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

  // confirmIdentityVerification(src/api/auth.ts)이 [TEMP] 스텁이라 PortOne 응답만 성공(코드 없음)이면
  // 항상 동일한 verifiedCustomer 목업(phoneNumber: '010-1234-5678')을 반환한다.
  it('인증 성공 시 완료 메시지를 표시하고 onVerified로 고객 정보를 전달한다', async () => {
    const { requestIdentityVerification } = await import('@portone/browser-sdk/v2')
    vi.mocked(requestIdentityVerification).mockResolvedValue({
      identityVerificationId: 'iv-success-id',
      transactionType: 'IDENTITY_VERIFICATION',
      identityVerificationTxId: 'tx-id',
    } as any)

    const onVerified = vi.fn()
    render(<IdentityVerificationButton onVerified={onVerified} />)
    await userEvent.click(screen.getByRole('button', { name: /핸드폰인증/ }))

    expect(await screen.findByText(/핸드폰인증이 완료되었습니다./)).toBeInTheDocument()
    expect(onVerified).toHaveBeenCalledWith(
      expect.objectContaining({ phoneNumber: '010-1234-5678' })
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

    render(<IdentityVerificationButton />)
    const button = screen.getByRole('button', { name: /핸드폰인증/ })

    await userEvent.click(button)

    expect(button).toBeDisabled()
    expect(button).toHaveTextContent(/핸드폰인증 중/)

    resolveVerification()
    // 인증 완료까지 대기하여 act 경고 방지
    await screen.findByText(/핸드폰인증이 완료되었습니다./)
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

    await userEvent.click(button)
    expect(await screen.findByText(/핸드폰인증이 완료되었습니다./)).toBeInTheDocument()
  })
})
