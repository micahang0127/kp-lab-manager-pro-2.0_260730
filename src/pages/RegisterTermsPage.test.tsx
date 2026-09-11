import { useNavigate } from '@tanstack/react-router'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useRegisterFlowStore } from '../stores/registerFlowStore'
import { render, screen } from '../test/test-utils'
import { RegisterTermsPage } from './RegisterTermsPage'

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: vi.fn(),
}))

describe('RegisterTermsPage', () => {
  beforeEach(() => {
    vi.mocked(useNavigate).mockReturnValue(mockNavigate)
    vi.clearAllMocks()
    useRegisterFlowStore.setState({ termsAgreement: null, identityVerifySource: 'register' })
  })

  it('페이지 제목과 약관 항목들을 렌더링한다', () => {
    render(<RegisterTermsPage />)

    expect(screen.getByRole('heading', { name: '회원가입' })).toBeInTheDocument()
    expect(screen.getByText('서비스 이용약관에 동의해 주세요')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '전체 동의' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '(필수) 이용약관 동의' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '(필수) 개인정보 수집 및 이용 동의' })
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '(선택) 마케팅 정보 수신 동의' })).toBeInTheDocument()
    expect(screen.getByText('개인정보 수집 및 이용 안내')).toBeInTheDocument()
  })

  it('필수 항목을 체크하지 않으면 "동의" 버튼이 disabled다', () => {
    render(<RegisterTermsPage />)

    expect(screen.getByRole('button', { name: '동의' })).toBeDisabled()
  })

  it('필수 항목 2개를 모두 체크하면 "동의" 버튼이 활성화된다', async () => {
    render(<RegisterTermsPage />)

    await userEvent.click(screen.getByRole('button', { name: '(필수) 이용약관 동의' }))
    await userEvent.click(screen.getByRole('button', { name: '(필수) 개인정보 수집 및 이용 동의' }))

    expect(screen.getByRole('button', { name: '동의' })).not.toBeDisabled()
  })

  it('"전체 동의"를 클릭하면 필수·선택 항목이 모두 체크된다', async () => {
    render(<RegisterTermsPage />)

    await userEvent.click(screen.getByRole('button', { name: '전체 동의' }))

    expect(screen.getByRole('button', { name: '(필수) 이용약관 동의' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    expect(
      screen.getByRole('button', { name: '(필수) 개인정보 수집 및 이용 동의' })
    ).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: '(선택) 마케팅 정보 수신 동의' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    expect(screen.getByRole('button', { name: '동의' })).not.toBeDisabled()
  })

  it('"전체 동의"를 다시 클릭하면 모두 해제된다', async () => {
    render(<RegisterTermsPage />)

    const toggleAll = screen.getByRole('button', { name: '전체 동의' })
    await userEvent.click(toggleAll)
    await userEvent.click(toggleAll)

    expect(screen.getByRole('button', { name: '(필수) 이용약관 동의' })).toHaveAttribute(
      'aria-pressed',
      'false'
    )
    expect(screen.getByRole('button', { name: '동의' })).toBeDisabled()
  })

  it('필수 항목만 체크하고 제출하면 marketingOptIn: false로 저장하고 다음 단계로 이동한다', async () => {
    render(<RegisterTermsPage />)

    await userEvent.click(screen.getByRole('button', { name: '(필수) 이용약관 동의' }))
    await userEvent.click(screen.getByRole('button', { name: '(필수) 개인정보 수집 및 이용 동의' }))
    await userEvent.click(screen.getByRole('button', { name: '동의' }))

    expect(useRegisterFlowStore.getState().termsAgreement).toEqual({ marketingOptIn: false })
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/register-email-verification' })
  })

  it('마케팅 수신 동의까지 체크하고 제출하면 marketingOptIn: true로 저장한다', async () => {
    render(<RegisterTermsPage />)

    await userEvent.click(screen.getByRole('button', { name: '전체 동의' }))
    await userEvent.click(screen.getByRole('button', { name: '동의' }))

    expect(useRegisterFlowStore.getState().termsAgreement).toEqual({ marketingOptIn: true })
  })

  it('"이전" 버튼으로 되돌아와 store에 이미 동의한 내역이 남아있으면 체크 상태가 복원된다', () => {
    useRegisterFlowStore.setState({ termsAgreement: { marketingOptIn: true } })

    render(<RegisterTermsPage />)

    expect(screen.getByRole('button', { name: '(필수) 이용약관 동의' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    expect(
      screen.getByRole('button', { name: '(필수) 개인정보 수집 및 이용 동의' })
    ).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: '(선택) 마케팅 정보 수신 동의' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    expect(screen.getByRole('button', { name: '동의' })).not.toBeDisabled()
  })

  it('"이전" 버튼으로 되돌아와 store에 마케팅 수신 미동의로 남아있으면 필수 항목만 복원된다', () => {
    useRegisterFlowStore.setState({ termsAgreement: { marketingOptIn: false } })

    render(<RegisterTermsPage />)

    expect(screen.getByRole('button', { name: '(필수) 이용약관 동의' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    expect(screen.getByRole('button', { name: '(선택) 마케팅 정보 수신 동의' })).toHaveAttribute(
      'aria-pressed',
      'false'
    )
  })

  it('"← 이전" 버튼을 클릭하면 3단계(가입 여부 안내)로 이동한다', async () => {
    render(<RegisterTermsPage />)

    await userEvent.click(screen.getByRole('button', { name: /이전/ }))

    expect(mockNavigate).toHaveBeenCalledWith({ to: '/register-account-check' })
  })

  it('아이디·비밀번호 찾기에서 2·3단계를 건너뛰고 온 경우(identityVerifySource가 \'find-account\') "← 이전" 버튼은 1단계(가입 방법 선택)로 이동한다', async () => {
    useRegisterFlowStore.setState({ identityVerifySource: 'find-account' })
    render(<RegisterTermsPage />)

    await userEvent.click(screen.getByRole('button', { name: /이전/ }))

    expect(mockNavigate).toHaveBeenCalledWith({ to: '/register' })
  })

  it('"더보기"를 클릭하면 aria-expanded가 토글된다', async () => {
    render(<RegisterTermsPage />)

    const moreButton = screen.getByRole('button', { name: '더보기' })
    expect(moreButton).toHaveAttribute('aria-expanded', 'false')

    await userEvent.click(moreButton)

    expect(moreButton).toHaveAttribute('aria-expanded', 'true')
  })
})
