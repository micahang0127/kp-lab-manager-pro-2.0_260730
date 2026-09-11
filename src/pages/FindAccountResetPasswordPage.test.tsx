import { useNavigate } from '@tanstack/react-router'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { resetPassword } from '../api/user'
import { useFindAccountFlowStore } from '../stores/findAccountFlowStore'
import { render, screen } from '../test/test-utils'
import { PASSWORD_RULE_MESSAGE } from '../utils/rules/validationRules'
import { FindAccountResetPasswordPage } from './FindAccountResetPasswordPage'

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: vi.fn(),
}))

vi.mock('../api/user', () => ({
  resetPassword: vi.fn(),
}))

const VALID_PASSWORD = 'abcd1234!'

/** find-account 본인인증 완료 후 findAccountFlowStore에 남아있어야 할 값 */
const IDENTITY_VERIFICATION_CODE = 'iv-existing-account-id'

describe('FindAccountResetPasswordPage', () => {
  beforeEach(() => {
    vi.mocked(useNavigate).mockReturnValue(mockNavigate)
    vi.clearAllMocks()
    useFindAccountFlowStore.setState({
      verifiedIdentity: {
        result: { isVerified: true, hasExistingAccount: true, existingEmail: 'fu******@gmail.com' },
        identityVerificationCode: IDENTITY_VERIFICATION_CODE,
      },
    })
  })

  it('페이지 제목과 안내 문구, 비밀번호 입력란을 렌더링한다', () => {
    render(<FindAccountResetPasswordPage />)

    expect(screen.getByRole('heading', { name: '비밀번호 재설정' })).toBeInTheDocument()
    expect(screen.getByText('비밀번호를 설정해 주세요.')).toBeInTheDocument()
    expect(screen.getByLabelText('새 비밀번호 *')).toBeInTheDocument()
    expect(screen.getByLabelText('새 비밀번호 확인 *')).toBeInTheDocument()
  })

  it('비밀번호 입력 전에는 "비밀번호 재설정" 버튼이 disabled다', () => {
    render(<FindAccountResetPasswordPage />)

    expect(screen.getByRole('button', { name: '비밀번호 재설정' })).toBeDisabled()
  })

  it('새 비밀번호가 형식에 맞지 않으면 오류 문구를 표시하고 버튼은 disabled 상태를 유지한다', async () => {
    render(<FindAccountResetPasswordPage />)

    await userEvent.type(screen.getByLabelText('새 비밀번호 *'), 'abc')

    expect(screen.getByText(PASSWORD_RULE_MESSAGE)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '비밀번호 재설정' })).toBeDisabled()
  })

  it('새 비밀번호 확인이 새 비밀번호와 다르면 불일치 오류 문구를 표시한다', async () => {
    render(<FindAccountResetPasswordPage />)

    await userEvent.type(screen.getByLabelText('새 비밀번호 *'), VALID_PASSWORD)
    await userEvent.type(screen.getByLabelText('새 비밀번호 확인 *'), 'different1')

    expect(screen.getByText('비밀번호가 일치하지 않습니다.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '비밀번호 재설정' })).toBeDisabled()
  })

  it('형식에 맞고 서로 일치하면 제출 시 findAccountFlowStore의 본인인증 키로 재설정 API를 호출하고, 성공하면 완료 화면으로 이동하며 store 값을 비운다', async () => {
    vi.mocked(resetPassword).mockResolvedValue({
      result: true,
      statusCode: 201,
      data: { success: true },
      message: null,
    })

    render(<FindAccountResetPasswordPage />)

    await userEvent.type(screen.getByLabelText('새 비밀번호 *'), VALID_PASSWORD)
    await userEvent.type(screen.getByLabelText('새 비밀번호 확인 *'), VALID_PASSWORD)

    const submitButton = screen.getByRole('button', { name: '비밀번호 재설정' })
    expect(submitButton).not.toBeDisabled()

    await userEvent.click(submitButton)

    expect(resetPassword).toHaveBeenCalledWith({
      identityVerificationId: IDENTITY_VERIFICATION_CODE,
      password: VALID_PASSWORD,
      passwordConfirm: VALID_PASSWORD,
    })
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/register-reset-password-complete' })
    expect(useFindAccountFlowStore.getState().verifiedIdentity).toBeNull()
  })

  it('API가 실패(409, 비밀번호 불일치)하면 오류 메시지를 표시하고 페이지를 이동하지 않는다', async () => {
    vi.mocked(resetPassword).mockRejectedValue(new Error('새 비밀번호가 일치하지 않습니다'))

    render(<FindAccountResetPasswordPage />)

    await userEvent.type(screen.getByLabelText('새 비밀번호 *'), VALID_PASSWORD)
    await userEvent.type(screen.getByLabelText('새 비밀번호 확인 *'), VALID_PASSWORD)
    await userEvent.click(screen.getByRole('button', { name: '비밀번호 재설정' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('새 비밀번호가 일치하지 않습니다')
    expect(mockNavigate).not.toHaveBeenCalledWith({ to: '/register-reset-password-complete' })
  })

  it('본인인증 키(identityVerificationCode)가 없으면 API를 호출하지 않고 오류 메시지를 표시한다', async () => {
    useFindAccountFlowStore.setState({ verifiedIdentity: null })

    render(<FindAccountResetPasswordPage />)

    await userEvent.type(screen.getByLabelText('새 비밀번호 *'), VALID_PASSWORD)
    await userEvent.type(screen.getByLabelText('새 비밀번호 확인 *'), VALID_PASSWORD)
    await userEvent.click(screen.getByRole('button', { name: '비밀번호 재설정' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '본인인증 정보가 없습니다. 처음부터 다시 진행해 주세요.'
    )
    expect(resetPassword).not.toHaveBeenCalled()
  })

  it('"← 이전" 버튼을 클릭하면 /find-account로 이동한다', async () => {
    render(<FindAccountResetPasswordPage />)

    await userEvent.click(screen.getByRole('button', { name: /이전/ }))

    expect(mockNavigate).toHaveBeenCalledWith({ to: '/find-account' })
  })
})
