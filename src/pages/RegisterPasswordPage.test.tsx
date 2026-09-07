import { useNavigate } from '@tanstack/react-router'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useRegisterFlowStore } from '../stores/registerFlowStore'
import { render, screen } from '../test/test-utils'
import { PASSWORD_RULE_MESSAGE } from '../utils/rules/validationRules'
import { RegisterPasswordPage } from './RegisterPasswordPage'

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: vi.fn(),
}))

const VALID_PASSWORD = 'abcd1234'

describe('RegisterPasswordPage', () => {
  beforeEach(() => {
    vi.mocked(useNavigate).mockReturnValue(mockNavigate)
    vi.clearAllMocks()
    useRegisterFlowStore.setState({ registerPassword: null })
  })

  it('페이지 제목과 이전 단계 완료 문구, 비밀번호 입력란을 렌더링한다', () => {
    render(<RegisterPasswordPage />)

    expect(screen.getByRole('heading', { name: '회원가입' })).toBeInTheDocument()
    expect(screen.getByText('약관 동의 완료')).toBeInTheDocument()
    expect(screen.getByText('이메일 인증 완료')).toBeInTheDocument()
    expect(screen.getByText('비밀번호를 설정해 주세요.')).toBeInTheDocument()
    expect(screen.getByLabelText('신규 비밀번호 *')).toBeInTheDocument()
    expect(screen.getByLabelText('비밀번호 확인 *')).toBeInTheDocument()
  })

  it('비밀번호 입력 전에는 "다음" 버튼이 disabled다', () => {
    render(<RegisterPasswordPage />)

    expect(screen.getByRole('button', { name: '다음' })).toBeDisabled()
  })

  it('입력 전에도 신규 비밀번호 형식 규칙 안내 문구를 항상 표시한다', () => {
    render(<RegisterPasswordPage />)

    expect(screen.getByText(PASSWORD_RULE_MESSAGE)).toBeInTheDocument()
  })

  it('신규 비밀번호가 형식에 맞지 않으면 오류 문구를 표시한다', async () => {
    render(<RegisterPasswordPage />)

    await userEvent.type(screen.getByLabelText('신규 비밀번호 *'), 'abc')

    expect(screen.getByText(PASSWORD_RULE_MESSAGE)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '다음' })).toBeDisabled()
  })

  it('비밀번호 확인이 신규 비밀번호와 다르면 불일치 오류 문구를 표시한다', async () => {
    render(<RegisterPasswordPage />)

    await userEvent.type(screen.getByLabelText('신규 비밀번호 *'), VALID_PASSWORD)
    await userEvent.type(screen.getByLabelText('비밀번호 확인 *'), 'different1')

    expect(screen.getByText('비밀번호가 일치하지 않습니다.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '다음' })).toBeDisabled()
  })

  it('한글 등 허용되지 않는 문자는 입력 즉시 제거된다', async () => {
    render(<RegisterPasswordPage />)

    await userEvent.type(screen.getByLabelText('신규 비밀번호 *'), 'ab한글cd1234')

    expect(screen.getByLabelText('신규 비밀번호 *')).toHaveValue('abcd1234')
  })

  it("작은따옴표(')는 입력 즉시 제거된다", async () => {
    render(<RegisterPasswordPage />)

    await userEvent.type(screen.getByLabelText('신규 비밀번호 *'), "ab'cd1234")

    expect(screen.getByLabelText('신규 비밀번호 *')).toHaveValue('abcd1234')
  })

  it('비밀번호는 기본적으로 마스킹되고, 표시 아이콘을 클릭하면 평문으로 전환된다', async () => {
    render(<RegisterPasswordPage />)

    const input = screen.getByLabelText('신규 비밀번호 *')
    await userEvent.type(input, VALID_PASSWORD)

    expect(input).toHaveAttribute('type', 'password')

    await userEvent.click(screen.getAllByRole('button', { name: '비밀번호 표시' })[0])

    expect(input).toHaveAttribute('type', 'text')
  })

  it('지우기 아이콘을 클릭하면 입력값이 비워진다', async () => {
    render(<RegisterPasswordPage />)

    const input = screen.getByLabelText('신규 비밀번호 *')
    await userEvent.type(input, VALID_PASSWORD)

    await userEvent.click(screen.getByRole('button', { name: '입력값 지우기' }))

    expect(input).toHaveValue('')
  })

  it('신규 비밀번호와 확인 비밀번호가 형식에 맞고 일치하면 "다음" 버튼이 활성화되고, 클릭하면 registerPassword를 저장하고 새 조직 등록 단계로 이동한다', async () => {
    render(<RegisterPasswordPage />)

    await userEvent.type(screen.getByLabelText('신규 비밀번호 *'), VALID_PASSWORD)
    await userEvent.type(screen.getByLabelText('비밀번호 확인 *'), VALID_PASSWORD)

    const submitButton = screen.getByRole('button', { name: '다음' })
    expect(submitButton).not.toBeDisabled()

    await userEvent.click(submitButton)

    expect(useRegisterFlowStore.getState().registerPassword).toBe(VALID_PASSWORD)
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/register-organization' })
  })

  it('"이전" 버튼으로 되돌아와 store에 이미 저장된 비밀번호가 남아있으면 입력값이 복원된다', () => {
    useRegisterFlowStore.setState({ registerPassword: VALID_PASSWORD })

    render(<RegisterPasswordPage />)

    expect(screen.getByLabelText('신규 비밀번호 *')).toHaveValue(VALID_PASSWORD)
    expect(screen.getByLabelText('비밀번호 확인 *')).toHaveValue(VALID_PASSWORD)
    expect(screen.getByRole('button', { name: '다음' })).not.toBeDisabled()
  })

  it('"← 이전" 버튼을 클릭하면 5단계(이메일 인증)로 이동한다', async () => {
    render(<RegisterPasswordPage />)

    await userEvent.click(screen.getByRole('button', { name: /이전/ }))

    expect(mockNavigate).toHaveBeenCalledWith({ to: '/register-email-verification' })
  })
})
