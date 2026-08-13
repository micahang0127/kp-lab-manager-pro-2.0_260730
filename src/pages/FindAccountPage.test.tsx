import { useNavigate } from '@tanstack/react-router'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { render, screen } from '../test/test-utils'
import { FindAccountPage } from './FindAccountPage'

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: vi.fn(),
}))

// 본인인증 완료 시 백엔드에서 확인된 값
const VERIFIED_CUSTOMER = {
  name: '홍길동',
  phoneNumber: '010-1234-5678',
}

// 본인인증 컴포넌트 mock (jsdom 환경에서 PortOne SDK 팝업 렌더 불가)
vi.mock('../components/identityVerification', () => ({
  IdentityVerificationButton: ({ onVerified }: any) => (
    <button type="button" onClick={() => onVerified && onVerified(VERIFIED_CUSTOMER)}>
      identity-verification-mock
    </button>
  ),
}))

describe('FindAccountPage', () => {
  beforeEach(() => {
    vi.mocked(useNavigate).mockReturnValue(mockNavigate)
    vi.clearAllMocks()
  })

  it('페이지 제목을 렌더링한다', () => {
    render(<FindAccountPage />)
    expect(screen.getByRole('heading', { name: '아이디/비밀번호 찾기' })).toBeInTheDocument()
  })

  it('본인인증 버튼을 렌더링한다', () => {
    render(<FindAccountPage />)
    expect(screen.getByText('identity-verification-mock')).toBeInTheDocument()
  })

  it('본인인증 완료 시 안내 메시지를 표시한다', async () => {
    render(<FindAccountPage />)

    expect(screen.queryByText(/본인인증이 완료되었습니다/)).not.toBeInTheDocument()

    await userEvent.click(screen.getByText('identity-verification-mock'))

    expect(screen.getByText(/본인인증이 완료되었습니다/)).toBeInTheDocument()
  })

  it('"로그인으로 돌아가기" 버튼을 클릭하면 /login으로 이동한다', async () => {
    render(<FindAccountPage />)

    await userEvent.click(screen.getByRole('button', { name: '로그인으로 돌아가기' }))

    expect(mockNavigate).toHaveBeenCalledWith({ to: '/login' })
  })
})
