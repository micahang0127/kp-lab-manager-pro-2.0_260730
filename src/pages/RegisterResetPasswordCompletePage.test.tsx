import { useNavigate } from '@tanstack/react-router'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { render, screen } from '../test/test-utils'
import { RegisterResetPasswordCompletePage } from './RegisterResetPasswordCompletePage'

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: vi.fn(),
}))

describe('RegisterResetPasswordCompletePage', () => {
  beforeEach(() => {
    vi.mocked(useNavigate).mockReturnValue(mockNavigate)
    vi.clearAllMocks()
  })

  it('"비밀번호 설정 완료" 문구를 렌더링한다', () => {
    render(<RegisterResetPasswordCompletePage />)

    expect(screen.getByText('비밀번호 설정 완료')).toBeInTheDocument()
  })

  it('"← 로그인으로 돌아가기" 버튼을 클릭하면 /login으로 이동한다', async () => {
    render(<RegisterResetPasswordCompletePage />)

    await userEvent.click(screen.getByRole('button', { name: /로그인으로 돌아가기/ }))

    expect(mockNavigate).toHaveBeenCalledWith({ to: '/login' })
  })
})
