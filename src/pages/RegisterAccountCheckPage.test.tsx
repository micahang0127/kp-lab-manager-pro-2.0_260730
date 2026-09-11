import { useNavigate } from '@tanstack/react-router'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { VerifyIdentityResult } from '../api/auth'
import { useRegisterFlowStore } from '../stores/registerFlowStore'
import { render, screen } from '../test/test-utils'
import { RegisterAccountCheckPage } from './RegisterAccountCheckPage'

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: vi.fn(),
}))

const IDENTITY_VERIFY_RESULT: VerifyIdentityResult = {
  isVerified: true,
  hasExistingAccount: false,
  maskedName: '홍길*',
  maskedBirth: '1990-**-**',
  maskedMobile: '010-**-5678',
  gender: 'M',
}

describe('RegisterAccountCheckPage', () => {
  beforeEach(() => {
    vi.mocked(useNavigate).mockReturnValue(mockNavigate)
    vi.clearAllMocks()
    useRegisterFlowStore.setState({ identityVerifyResult: null })
  })

  it('페이지 제목과 본인인증 완료 문구를 렌더링한다', () => {
    render(<RegisterAccountCheckPage />)

    expect(screen.getByRole('heading', { name: '회원가입' })).toBeInTheDocument()
    expect(screen.getByText('본인인증 완료')).toBeInTheDocument()
  })

  it('가입된 계정이 없다는 안내 문구를 렌더링한다', () => {
    render(<RegisterAccountCheckPage />)

    expect(screen.getByText(/가입된 계정이 없습니다\./)).toBeInTheDocument()
    expect(screen.getByText(/랩매니저 회원가입을 진행할 수 있습니다\./)).toBeInTheDocument()
  })

  it('registerFlowStore의 identityVerifyResult를 마스킹된 형태로 표시한다', () => {
    useRegisterFlowStore.setState({ identityVerifyResult: IDENTITY_VERIFY_RESULT })

    render(<RegisterAccountCheckPage />)

    // RTL의 기본 텍스트 정규화가 연속 공백을 하나로 축약하므로 단일 공백 기준으로 검증한다
    expect(screen.getByText('홍길* / 1990.**.** / 남성 / 010 - ** - 5678')).toBeInTheDocument()
  })

  it('identityVerifyResult가 없으면 마스킹 정보 박스를 렌더링하지 않는다', () => {
    render(<RegisterAccountCheckPage />)

    expect(screen.queryByText(/010 -/)).not.toBeInTheDocument()
  })

  it('"회원가입 계속" 버튼을 클릭하면 4단계(이용약관 동의)로 이동한다', async () => {
    render(<RegisterAccountCheckPage />)

    await userEvent.click(screen.getByRole('button', { name: '회원가입 계속' }))

    expect(mockNavigate).toHaveBeenCalledWith({ to: '/register-terms' })
  })

  it('"← 로그인으로 돌아가기" 버튼을 클릭하면 /login으로 이동하고 registerFlowStore를 초기화한다', async () => {
    useRegisterFlowStore.setState({ identityVerifyResult: IDENTITY_VERIFY_RESULT })
    render(<RegisterAccountCheckPage />)

    await userEvent.click(screen.getByRole('button', { name: /로그인으로 돌아가기/ }))

    expect(mockNavigate).toHaveBeenCalledWith({ to: '/login' })
    expect(useRegisterFlowStore.getState().identityVerifyResult).toBeNull()
  })

  it('"로그인" 버튼을 렌더링하지 않는다', () => {
    render(<RegisterAccountCheckPage />)

    expect(screen.queryByRole('button', { name: '로그인' })).not.toBeInTheDocument()
  })
})
