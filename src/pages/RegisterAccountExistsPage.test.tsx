import { useNavigate } from '@tanstack/react-router'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { VerifyIdentityResult } from '../api/auth'
import { useFindAccountFlowStore } from '../stores/findAccountFlowStore'
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

/** 회원가입 2단계(본인인증) 완료 시 registerFlowStore에 함께 저장돼있어야 할 본인인증 키 */
const IDENTITY_VERIFICATION_CODE = 'identity-verification-abc123'

describe('RegisterAccountExistsPage', () => {
  beforeEach(() => {
    vi.mocked(useNavigate).mockReturnValue(mockNavigate)
    vi.clearAllMocks()
    useRegisterFlowStore.setState({ identityVerifyResult: null, identityVerificationCode: null })
    useFindAccountFlowStore.setState({ verifiedIdentity: null })
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
      screen.getByText('아래 계정으로 로그인하거나 비밀번호를 재설정할 수 있습니다.')
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

  it('"기존 계정으로 로그인" 버튼을 클릭하면 /login으로 이동한다', async () => {
    render(<RegisterAccountExistsPage />)

    await userEvent.click(screen.getByRole('button', { name: '기존 계정으로 로그인' }))

    expect(mockNavigate).toHaveBeenCalledWith({ to: '/login' })
  })

  it('"비밀번호 재설정" 버튼을 클릭하면 findAccountFlowStore에 본인인증 결과를 옮겨 담고 /find-account-reset-password로 이동한다', async () => {
    useRegisterFlowStore.setState({
      identityVerifyResult: IDENTITY_VERIFY_RESULT,
      identityVerificationCode: IDENTITY_VERIFICATION_CODE,
    })

    render(<RegisterAccountExistsPage />)

    await userEvent.click(screen.getByRole('button', { name: '비밀번호 재설정' }))

    expect(useFindAccountFlowStore.getState().verifiedIdentity).toEqual({
      result: IDENTITY_VERIFY_RESULT,
      identityVerificationCode: IDENTITY_VERIFICATION_CODE,
    })
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/find-account-reset-password' })
  })

  it('본인인증 키(identityVerificationCode)가 없으면 "비밀번호 재설정" 버튼을 클릭해도 이동하지 않는다', async () => {
    useRegisterFlowStore.setState({
      identityVerifyResult: IDENTITY_VERIFY_RESULT,
      identityVerificationCode: null,
    })

    render(<RegisterAccountExistsPage />)

    await userEvent.click(screen.getByRole('button', { name: '비밀번호 재설정' }))

    expect(useFindAccountFlowStore.getState().verifiedIdentity).toBeNull()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('"계정탈퇴" 버튼을 항상 렌더링한다', () => {
    render(<RegisterAccountExistsPage />)

    expect(screen.getByRole('button', { name: '계정탈퇴' })).toBeInTheDocument()
  })
})
