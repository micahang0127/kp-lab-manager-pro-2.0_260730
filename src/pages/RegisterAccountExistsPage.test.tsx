import { useNavigate } from '@tanstack/react-router'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { VerifyIdentityResult } from '../api/auth'
import { useRegisterFlowStore } from '../stores/registerFlowStore'
import { render, screen } from '../test/test-utils'
import { RegisterAccountExistsPage } from './RegisterAccountExistsPage'

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: vi.fn(),
}))

// 백엔드 계약상 hasExistingAccount: true면 existingEmail만 내려오고
// maskedName/maskedBirth/maskedMobile/gender는 내려오지 않는다
const IDENTITY_VERIFY_RESULT: VerifyIdentityResult = {
  isVerified: true,
  hasExistingAccount: true,
  existingEmail: 'fu******@gmail.com',
}

describe('RegisterAccountExistsPage', () => {
  beforeEach(() => {
    vi.mocked(useNavigate).mockReturnValue(mockNavigate)
    vi.clearAllMocks()
    useRegisterFlowStore.setState({ identityVerifyResult: null })
  })

  it('페이지 제목과 본인인증 완료 문구를 렌더링한다', () => {
    render(<RegisterAccountExistsPage />)

    expect(screen.getByRole('heading', { name: '회원가입' })).toBeInTheDocument()
    expect(screen.getByText('본인인증 완료')).toBeInTheDocument()
  })

  it('가입된 계정이 있다는 안내 문구를 렌더링한다', () => {
    render(<RegisterAccountExistsPage />)

    expect(screen.getByText('가입된 계정이 있습니다.')).toBeInTheDocument()
    expect(
      screen.getByText('랩매니저는 한 사람당 하나의 계정만 사용할 수 있습니다.')
    ).toBeInTheDocument()
  })

  it('registerFlowStore의 identityVerifyResult에서 마스킹된 기존 계정 이메일을 표시한다', () => {
    useRegisterFlowStore.setState({ identityVerifyResult: IDENTITY_VERIFY_RESULT })

    render(<RegisterAccountExistsPage />)

    expect(screen.getByText('fu******@gmail.com')).toBeInTheDocument()
  })

  it('identityVerifyResult가 없으면 정보 텍스트를 렌더링하지 않는다', () => {
    render(<RegisterAccountExistsPage />)

    expect(screen.queryByText(/010 -/)).not.toBeInTheDocument()
    expect(screen.queryByText(/@/)).not.toBeInTheDocument()
  })

  it('"로그인" 버튼을 클릭하면 /login으로 이동한다', async () => {
    render(<RegisterAccountExistsPage />)

    await userEvent.click(screen.getByRole('button', { name: '로그인' }))

    expect(mockNavigate).toHaveBeenCalledWith({ to: '/login' })
  })

  it('"← 로그인으로 돌아가기" 버튼을 클릭하면 /login으로 이동한다', async () => {
    render(<RegisterAccountExistsPage />)

    await userEvent.click(screen.getByRole('button', { name: /로그인으로 돌아가기/ }))

    expect(mockNavigate).toHaveBeenCalledWith({ to: '/login' })
  })

  it('"비밀번호 재설정" 버튼을 클릭하면 /find-account로 이동한다', async () => {
    render(<RegisterAccountExistsPage />)

    await userEvent.click(screen.getByRole('button', { name: '비밀번호 재설정' }))

    expect(mockNavigate).toHaveBeenCalledWith({ to: '/find-account' })
  })
})
