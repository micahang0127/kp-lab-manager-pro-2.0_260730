import { useNavigate } from '@tanstack/react-router'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useRegisterFlowStore } from '../stores/registerFlowStore'
import { render, screen } from '../test/test-utils'
import { RegisterIdentityVerificationPage } from './RegisterIdentityVerificationPage'

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: vi.fn(),
}))

// 본인인증 컴포넌트 mock (jsdom 환경에서 PortOne SDK 팝업 렌더 불가) — onVerified에 전달할
// 결과를 클릭 시 인자로 받아 그대로 넘겨준다
vi.mock('../components/identityVerification', () => ({
  IdentityVerificationButton: ({ label, onVerified }: any) => (
    <>
      <button
        type="button"
        onClick={() =>
          onVerified?.({ isVerified: true, hasExistingAccount: false }, 'iv-no-account-id')
        }
      >
        {label}
      </button>
      <button
        type="button"
        onClick={() =>
          onVerified?.(
            {
              isVerified: true,
              hasExistingAccount: true,
              existingEmail: 'fu******@gmail.com',
            },
            'iv-existing-account-id'
          )
        }
      >
        {`${label}(가입된 계정 있음)`}
      </button>
    </>
  ),
}))

describe('RegisterIdentityVerificationPage', () => {
  beforeEach(() => {
    vi.mocked(useNavigate).mockReturnValue(mockNavigate)
    vi.clearAllMocks()
    useRegisterFlowStore.setState({ identityVerifyResult: null, identityVerificationCode: null })
  })

  it('페이지 제목과 안내 문구를 렌더링한다', () => {
    render(<RegisterIdentityVerificationPage />)

    expect(screen.getByRole('heading', { name: '회원가입' })).toBeInTheDocument()
    expect(screen.getByText('가입된 계정이 있는지 확인해 주세요.')).toBeInTheDocument()
    expect(
      screen.getByText(
        '실명 확인을 위해 휴대폰 본인인증이 필요합니다. 인증 후 가입 여부에 따라 자동으로 안내해 드립니다.'
      )
    ).toBeInTheDocument()
  })

  it('"휴대폰 인증" 버튼과 진행률(1/3)을 렌더링한다', () => {
    render(<RegisterIdentityVerificationPage />)

    expect(screen.getByRole('button', { name: '휴대폰 인증' })).toBeInTheDocument()
    expect(screen.getByText('1/3')).toBeInTheDocument()
  })

  it('본인인증 완료 후 가입된 계정이 없으면 registerFlowStore에 저장하고 "가입 없음" 안내 페이지로 이동한다', async () => {
    render(<RegisterIdentityVerificationPage />)

    await userEvent.click(screen.getByRole('button', { name: '휴대폰 인증' }))

    expect(useRegisterFlowStore.getState().identityVerifyResult).toEqual({
      isVerified: true,
      hasExistingAccount: false,
    })
    expect(useRegisterFlowStore.getState().identityVerificationCode).toBe('iv-no-account-id')
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/register-account-check' })
  })

  it('본인인증 완료 후 가입된 계정이 있으면 registerFlowStore에 저장하고 "가입 있음" 안내 페이지로 이동한다', async () => {
    render(<RegisterIdentityVerificationPage />)

    await userEvent.click(screen.getByRole('button', { name: '휴대폰 인증(가입된 계정 있음)' }))

    expect(useRegisterFlowStore.getState().identityVerifyResult).toEqual({
      isVerified: true,
      hasExistingAccount: true,
      existingEmail: 'fu******@gmail.com',
    })
    expect(useRegisterFlowStore.getState().identityVerificationCode).toBe('iv-existing-account-id')
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/register-account-exists' })
  })

  it('"← 이전" 버튼을 클릭하면 /register로 이동한다', async () => {
    render(<RegisterIdentityVerificationPage />)

    await userEvent.click(screen.getByRole('button', { name: /이전/ }))

    expect(mockNavigate).toHaveBeenCalledWith({ to: '/register' })
  })
})
