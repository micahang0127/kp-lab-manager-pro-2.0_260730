import { useNavigate } from '@tanstack/react-router'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useRegisterFlowStore } from '../stores/registerFlowStore'
import { render, screen } from '../test/test-utils'
import { RegisterPage } from './RegisterPage'

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: vi.fn(),
}))

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.mocked(useNavigate).mockReturnValue(mockNavigate)
    vi.clearAllMocks()
    useRegisterFlowStore.setState({
      registerMethod: null,
      identityVerifyResult: null,
      identityVerifySource: null,
    })
  })

  it('페이지 제목과 안내 문구를 렌더링한다', () => {
    render(<RegisterPage />)

    expect(screen.getByRole('heading', { name: '회원가입' })).toBeInTheDocument()
    expect(screen.getByText('랩매니저 시스템 관리자로부터 초대를 받으셨나요?')).toBeInTheDocument()
    expect(
      screen.getByText('선택한 방식에 따라 가입에 필요한 정보와 부여되는 권한이 달라집니다.')
    ).toBeInTheDocument()
  })

  it('가입 방법 선택 카드 2개를 렌더링한다', () => {
    render(<RegisterPage />)

    expect(screen.getByRole('button', { name: /초대받은 조직에 가입/ })).toBeInTheDocument()
    expect(screen.getByText('추천')).toBeInTheDocument()
    expect(
      screen.getByText(/관리자로부터 조직에 초대받은 경우 선택해 주세요\./)
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /새 조직 만들기/ })).toBeInTheDocument()
    expect(
      screen.getByText(/새 조직을 등록하고 구성원을 초대할 경우 선택해 주세요\./)
    ).toBeInTheDocument()
  })

  it('사업자등록증 안내 문구를 렌더링한다', () => {
    render(<RegisterPage />)

    expect(
      screen.getByText(
        /새 조직을 만드는 경우 사업자등록증\(PDF\)이 필요합니다\. 미리 준비해 주세요\./
      )
    ).toBeInTheDocument()
    expect(
      screen.getByText(/가입 중 페이지를 나가면 처음부터 다시 진행해야 합니다\./)
    ).toBeInTheDocument()
  })

  it('카드를 클릭하면 해당 카드만 선택 상태(aria-pressed)가 된다', async () => {
    render(<RegisterPage />)

    const existingCard = screen.getByRole('button', { name: /초대받은 조직에 가입/ })
    const newCard = screen.getByRole('button', { name: /새 조직 만들기/ })

    expect(existingCard).toHaveAttribute('aria-pressed', 'false')
    expect(newCard).toHaveAttribute('aria-pressed', 'false')

    await userEvent.click(existingCard)

    expect(existingCard).toHaveAttribute('aria-pressed', 'true')
    expect(newCard).toHaveAttribute('aria-pressed', 'false')

    await userEvent.click(newCard)

    expect(existingCard).toHaveAttribute('aria-pressed', 'false')
    expect(newCard).toHaveAttribute('aria-pressed', 'true')
  })

  it('"로그인으로 돌아가기" 버튼을 클릭하면 /login으로 이동한다', async () => {
    render(<RegisterPage />)

    await userEvent.click(screen.getByRole('button', { name: /로그인으로 돌아가기/ }))

    expect(mockNavigate).toHaveBeenCalledWith({ to: '/login' })
  })

  it('"이전" 버튼으로 되돌아와 store에 이미 선택된 방법이 남아있으면 해당 카드가 선택 상태로 복원된다', () => {
    useRegisterFlowStore.setState({ registerMethod: 'new' })

    render(<RegisterPage />)

    expect(screen.getByRole('button', { name: /초대받은 조직에 가입/ })).toHaveAttribute(
      'aria-pressed',
      'false'
    )
    expect(screen.getByRole('button', { name: /새 조직 만들기/ })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
  })

  it('"초대받은 조직에 가입" 카드를 클릭하면 registerFlowStore에 저장하고 본인인증 페이지로 이동한다', async () => {
    render(<RegisterPage />)

    await userEvent.click(screen.getByRole('button', { name: /초대받은 조직에 가입/ }))

    expect(useRegisterFlowStore.getState().registerMethod).toBe('existing')
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/register-identity-verification' })
  })

  it('"새 조직 만들기" 카드를 클릭하면 registerFlowStore에 저장하고 본인인증 페이지로 이동한다', async () => {
    render(<RegisterPage />)

    await userEvent.click(screen.getByRole('button', { name: /새 조직 만들기/ }))

    expect(useRegisterFlowStore.getState().registerMethod).toBe('new')
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/register-identity-verification' })
  })

  it("아이디·비밀번호 찾기에서 이미 본인인증을 마친 경우(identityVerifySource가 'find-account') 카드 클릭 시 본인인증과 가입 여부 안내를 모두 건너뛰고 약관 동의 페이지로 이동한다", async () => {
    useRegisterFlowStore.setState({
      identityVerifyResult: { isVerified: true, hasExistingAccount: false, maskedName: '홍길*' },
      identityVerifySource: 'find-account',
    })

    render(<RegisterPage />)

    await userEvent.click(screen.getByRole('button', { name: /초대받은 조직에 가입/ }))

    expect(useRegisterFlowStore.getState().registerMethod).toBe('existing')
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/register-terms' })
  })

  it("정상 플로우에서 본인인증을 마친 뒤 되돌아온 경우(identityVerifySource가 'register') 카드 클릭 시 단계 순서대로 본인인증 페이지로 이동한다", async () => {
    useRegisterFlowStore.setState({
      identityVerifyResult: { isVerified: true, hasExistingAccount: false, maskedName: '홍길*' },
      identityVerifySource: 'register',
    })

    render(<RegisterPage />)

    await userEvent.click(screen.getByRole('button', { name: /초대받은 조직에 가입/ }))

    expect(mockNavigate).toHaveBeenCalledWith({ to: '/register-identity-verification' })
  })
})
