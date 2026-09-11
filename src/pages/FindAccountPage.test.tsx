import { useNavigate } from '@tanstack/react-router'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useFindAccountFlowStore } from '../stores/findAccountFlowStore'
import { useRegisterFlowStore } from '../stores/registerFlowStore'
import { render, screen } from '../test/test-utils'
import { FindAccountPage } from './FindAccountPage'

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: vi.fn(),
}))

// 본인인증 컴포넌트 mock (jsdom 환경에서 PortOne SDK 팝업 렌더 불가) — onVerified에 전달할
// 결과를 클릭 시 인자로 받아 그대로 넘겨준다. 계정 없음/있음 두 케이스를 각각 버튼으로 노출한다.
vi.mock('../components/identityVerification', () => ({
  IdentityVerificationButton: ({ label, onVerified }: any) => (
    <>
      <button
        type="button"
        onClick={() =>
          onVerified?.(
            { isVerified: true, hasExistingAccount: false, maskedName: '홍길*' },
            'iv-no-account-id'
          )
        }
      >
        {label}
      </button>
      <button
        type="button"
        onClick={() =>
          onVerified?.(
            { isVerified: true, hasExistingAccount: true, existingEmail: 'fu******@gmail.com' },
            'iv-existing-account-id'
          )
        }
      >
        {`${label}(가입된 계정 있음)`}
      </button>
    </>
  ),
}))

describe('FindAccountPage', () => {
  beforeEach(() => {
    vi.mocked(useNavigate).mockReturnValue(mockNavigate)
    vi.clearAllMocks()
    useFindAccountFlowStore.setState({ verifiedIdentity: null })
    useRegisterFlowStore.getState().resetRegisterFlow()
  })

  describe('본인인증 전', () => {
    it('페이지 제목과 안내 문구를 렌더링한다', () => {
      render(<FindAccountPage />)

      expect(screen.getByRole('heading', { name: '아이디·비밀번호 찾기' })).toBeInTheDocument()
      expect(screen.getByText('가입된 계정이 있는지 확인해 주세요.')).toBeInTheDocument()
      expect(
        screen.getByText(
          '실명 확인을 위해 휴대폰 본인인증이 필요합니다. 인증 후 가입된 계정을 확인하거나 비밀번호를 재설정할 수 있습니다.'
        )
      ).toBeInTheDocument()
    })

    it('"휴대폰 인증" 버튼을 렌더링한다', () => {
      render(<FindAccountPage />)
      expect(screen.getByRole('button', { name: '휴대폰 인증' })).toBeInTheDocument()
    })

    it('"← 로그인으로 돌아가기" 버튼을 클릭하면 /login으로 이동한다', async () => {
      render(<FindAccountPage />)

      await userEvent.click(screen.getByRole('button', { name: /로그인으로 돌아가기/ }))

      expect(mockNavigate).toHaveBeenCalledWith({ to: '/login' })
    })
  })

  describe('가입된 계정이 없음', () => {
    it('본인인증 완료 후 안내 문구와 마스킹된 본인인증 정보를 표시한다', async () => {
      render(<FindAccountPage />)

      await userEvent.click(screen.getByRole('button', { name: '휴대폰 인증' }))

      expect(screen.getByText('본인인증 완료')).toBeInTheDocument()
      expect(screen.getByText(/가입된 계정이 없습니다\./)).toBeInTheDocument()
      expect(screen.getByText(/랩매니저 회원가입을 진행할 수 있습니다\./)).toBeInTheDocument()
      expect(screen.getByText('홍길*')).toBeInTheDocument()
    })

    it('"회원가입 계속" 클릭 시 registerFlowStore에 본인인증 결과를 저장하고 /register로 이동한다', async () => {
      render(<FindAccountPage />)

      await userEvent.click(screen.getByRole('button', { name: '휴대폰 인증' }))
      await userEvent.click(screen.getByRole('button', { name: '회원가입 계속' }))

      expect(useRegisterFlowStore.getState().identityVerifyResult).toEqual({
        isVerified: true,
        hasExistingAccount: false,
        maskedName: '홍길*',
      })
      expect(useRegisterFlowStore.getState().identityVerificationCode).toBe('iv-no-account-id')
      // 이 출처 값이 곧 RegisterPage와 라우트 가드가 2·3단계를 건너뛸 근거가 된다
      expect(useRegisterFlowStore.getState().identityVerifySource).toBe('find-account')
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/register' })
    })

    it('"회원가입 계속" 클릭 시 중단된 이전 회원가입 시도의 값은 비우고 방금 마친 본인인증 결과만 넘긴다', async () => {
      useRegisterFlowStore.getState().setTermsAgreement({ marketingOptIn: true })
      useRegisterFlowStore.getState().setRegisterEmail('stale@test.com')
      useRegisterFlowStore.getState().setRegisterPassword('stalePassword1!')
      render(<FindAccountPage />)

      await userEvent.click(screen.getByRole('button', { name: '휴대폰 인증' }))
      await userEvent.click(screen.getByRole('button', { name: '회원가입 계속' }))

      expect(useRegisterFlowStore.getState().termsAgreement).toBeNull()
      expect(useRegisterFlowStore.getState().registerEmail).toBeNull()
      expect(useRegisterFlowStore.getState().registerPassword).toBeNull()
      expect(useRegisterFlowStore.getState().identityVerificationCode).toBe('iv-no-account-id')
    })

    it('"← 로그인으로 돌아가기" 버튼을 클릭하면 /login으로 이동하고 findAccountFlowStore를 초기화한다', async () => {
      render(<FindAccountPage />)

      await userEvent.click(screen.getByRole('button', { name: '휴대폰 인증' }))
      await userEvent.click(screen.getByRole('button', { name: /로그인으로 돌아가기/ }))

      expect(mockNavigate).toHaveBeenCalledWith({ to: '/login' })
      expect(useFindAccountFlowStore.getState().verifiedIdentity).toBeNull()
    })
  })

  describe('가입된 계정이 있음', () => {
    const verify = async () => {
      render(<FindAccountPage />)
      await userEvent.click(screen.getByRole('button', { name: '휴대폰 인증(가입된 계정 있음)' }))
    }

    it('본인인증 완료 후 안내 문구와 마스킹된 계정 이메일을 표시한다', async () => {
      await verify()

      expect(screen.getByText('본인인증 완료')).toBeInTheDocument()
      expect(screen.getByText('가입된 계정이 있습니다.')).toBeInTheDocument()
      expect(
        screen.getByText('아래 계정으로 로그인하거나 비밀번호를 재설정할 수 있습니다.')
      ).toBeInTheDocument()
      expect(screen.getByText('fu******@gmail.com')).toBeInTheDocument()
    })

    it('"← 로그인으로 돌아가기" 링크는 표시하지 않는다', async () => {
      await verify()

      expect(screen.queryByRole('button', { name: /로그인으로 돌아가기/ })).not.toBeInTheDocument()
    })

    it('"계정탈퇴" 버튼을 항상 렌더링한다', async () => {
      await verify()

      expect(screen.getByRole('button', { name: '계정탈퇴' })).toBeInTheDocument()
    })

    it('"기존 계정으로 로그인" 클릭 시 /login으로 이동한다', async () => {
      await verify()

      await userEvent.click(screen.getByRole('button', { name: '기존 계정으로 로그인' }))

      expect(mockNavigate).toHaveBeenCalledWith({ to: '/login' })
    })

    it('"비밀번호 재설정" 클릭 시 /find-account-reset-password로 이동한다', async () => {
      await verify()

      await userEvent.click(screen.getByRole('button', { name: '비밀번호 재설정' }))

      expect(mockNavigate).toHaveBeenCalledWith({ to: '/find-account-reset-password' })
    })
  })
})
