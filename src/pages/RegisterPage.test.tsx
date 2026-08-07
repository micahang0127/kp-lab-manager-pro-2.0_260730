import { useNavigate } from '@tanstack/react-router'
import { cleanup, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { server } from '../test/mocks/server'
import { render, screen } from '../test/test-utils'
import { RegisterPage } from './RegisterPage'

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: vi.fn(),
}))

// 핸드폰인증 완료 시 백엔드(본인인증)에서 확인된 값 — 이름/휴대폰번호만 사전 입력값을 덮어씀 (이메일은 제외)
const VERIFIED_CUSTOMER = {
  name: '홍길동',
  phoneNumber: '010-1234-5678',
}

// 핸드폰인증 컴포넌트 mock (jsdom 환경에서 PortOne SDK 팝업 렌더 불가)
vi.mock('../components/identityVerification', () => ({
  IdentityVerificationButton: ({ onVerified }: any) => (
    <button type="button" onClick={() => onVerified && onVerified(VERIFIED_CUSTOMER)}>
      identity-verification-mock
    </button>
  ),
}))

// 주소검색 컴포넌트 mock (jsdom 환경에서 Daum 우편번호 팝업 렌더 불가)
vi.mock('../components/addressSearch', () => ({
  AddressField: ({
    id,
    label,
    address,
    onAddressChange,
    addressDetail,
    onAddressDetailChange,
  }: any) => (
    <div>
      <label htmlFor={id}>{label}</label>
      <input id={id} value={address} disabled readOnly onChange={() => {}} />
      <button type="button" onClick={() => onAddressChange('서울시 강남구 테헤란로 1')}>
        address-search-mock
      </button>
      <input
        aria-label="상세주소"
        value={addressDetail}
        onChange={(e) => onAddressDetailChange(e.target.value)}
      />
    </div>
  ),
}))

// ─── Setup ─────────────────────────────────────────────────────────────────────

const VALID_PASSWORD = 'Password1!'

const BUSINESS_LICENSE_FILE = new File(['dummy'], 'business-license.pdf', {
  type: 'application/pdf',
})

/** 사업자등록 정보 7개 항목을 채운다 */
async function fillBusinessInfo() {
  await userEvent.upload(screen.getByLabelText('사업자등록증'), BUSINESS_LICENSE_FILE)
  await userEvent.type(screen.getByLabelText('법인명'), '(주)케이피랩')
  await userEvent.type(screen.getByLabelText('대표자명'), '홍길동')
  await userEvent.type(screen.getByLabelText('사업자등록번호 앞 3자리'), '123')
  await userEvent.type(screen.getByLabelText('사업자등록번호 중간 2자리'), '45')
  await userEvent.type(screen.getByLabelText('사업자등록번호 뒤 5자리'), '67890')
  await userEvent.click(screen.getByText('address-search-mock'))
  await userEvent.type(screen.getByLabelText('업태'), '제조업')
  await userEvent.type(screen.getByLabelText('업종'), '화학제품')
}

/** 핸드폰인증을 완료하고 이메일/비밀번호/사업자정보/필수 약관까지 채워 제출 가능한 상태로 만든다 */
async function fillValidForm() {
  await userEvent.click(screen.getByText('identity-verification-mock'))
  await userEvent.type(screen.getByLabelText(/^이메일$/), 'newuser@test.com')
  await userEvent.type(screen.getByLabelText(/^비밀번호$/), VALID_PASSWORD)
  await userEvent.type(screen.getByLabelText(/비밀번호 확인/), VALID_PASSWORD)
  await fillBusinessInfo()
  await userEvent.click(screen.getByLabelText(/이용약관 동의/))
  await userEvent.click(screen.getByLabelText(/개인정보 수집 및 이용 안내 동의/))
}

describe('RegisterPage', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.mocked(useNavigate).mockReturnValue(mockNavigate)
    vi.clearAllMocks()
    server.resetHandlers()
  })

  afterEach(() => {
    cleanup()
  })

  it('핸드폰인증 라벨 옆에도 다른 필수 입력 항목처럼 필수 표시가 렌더링된다', () => {
    render(<RegisterPage />)
    expect(screen.getByText('핸드폰인증').parentElement).toHaveTextContent('핸드폰인증*')
  })

  it('필수 필드를 입력하지 않으면 제출 버튼이 비활성화된다', () => {
    render(<RegisterPage />)
    expect(screen.getByRole('button', { name: /^회원가입$/ })).toBeDisabled()
  })

  it('이메일은 254자를 초과하여 입력할 수 없다 (RFC 5321 기준)', () => {
    render(<RegisterPage />)
    expect(screen.getByLabelText(/^이메일$/)).toHaveAttribute('maxLength', '254')
  })

  it('비밀번호 규칙을 충족하지 못하면 안내 문구를 표시한다', async () => {
    render(<RegisterPage />)
    await userEvent.type(screen.getByLabelText(/^비밀번호$/), 'abc')
    expect(
      await screen.findByText(/영문, 숫자, 특수문자를 포함하여 8~64자로 입력해주세요./)
    ).toBeInTheDocument()
  })

  it('비밀번호와 비밀번호 확인이 다르면 에러를 표시한다', async () => {
    render(<RegisterPage />)
    await userEvent.type(screen.getByLabelText(/^비밀번호$/), VALID_PASSWORD)
    await userEvent.type(screen.getByLabelText(/비밀번호 확인/), 'DifferentPass1!')
    expect(await screen.findByText(/비밀번호가 일치하지 않습니다./)).toBeInTheDocument()
  })

  it('핸드폰인증을 완료하지 않으면 제출 버튼이 비활성화된다', async () => {
    render(<RegisterPage />)

    // 이름/이메일/휴대폰번호를 직접 입력해도 인증을 완료하지 않았다면 제출할 수 없다
    await userEvent.type(screen.getByLabelText(/이름/), '홍길동')
    await userEvent.type(screen.getByLabelText(/^이메일$/), 'newuser@test.com')
    await userEvent.type(screen.getByLabelText(/휴대폰번호/), '010-0000-0000')
    await userEvent.type(screen.getByLabelText(/^비밀번호$/), VALID_PASSWORD)
    await userEvent.type(screen.getByLabelText(/비밀번호 확인/), VALID_PASSWORD)
    await userEvent.click(screen.getByLabelText(/이용약관 동의/))
    await userEvent.click(screen.getByLabelText(/개인정보 수집 및 이용 안내 동의/))

    expect(screen.getByRole('button', { name: /^회원가입$/ })).toBeDisabled()
  })

  it('필수 약관에 동의하지 않으면 제출 버튼이 비활성화된다', async () => {
    render(<RegisterPage />)

    await userEvent.click(screen.getByText('identity-verification-mock'))
    await userEvent.type(screen.getByLabelText(/^이메일$/), 'newuser@test.com')
    await userEvent.type(screen.getByLabelText(/^비밀번호$/), VALID_PASSWORD)
    await userEvent.type(screen.getByLabelText(/비밀번호 확인/), VALID_PASSWORD)

    expect(screen.getByRole('button', { name: /^회원가입$/ })).toBeDisabled()
  })

  it('사업자등록증을 첨부하지 않으면 제출 버튼이 비활성화된다', async () => {
    render(<RegisterPage />)

    await userEvent.click(screen.getByText('identity-verification-mock'))
    await userEvent.type(screen.getByLabelText(/^이메일$/), 'newuser@test.com')
    await userEvent.type(screen.getByLabelText(/^비밀번호$/), VALID_PASSWORD)
    await userEvent.type(screen.getByLabelText(/비밀번호 확인/), VALID_PASSWORD)
    await userEvent.type(screen.getByLabelText('법인명'), '(주)케이피랩')
    await userEvent.type(screen.getByLabelText('대표자명'), '홍길동')
    await userEvent.type(screen.getByLabelText('사업자등록번호 앞 3자리'), '123')
    await userEvent.type(screen.getByLabelText('사업자등록번호 중간 2자리'), '45')
    await userEvent.type(screen.getByLabelText('사업자등록번호 뒤 5자리'), '67890')
    await userEvent.click(screen.getByText('address-search-mock'))
    await userEvent.type(screen.getByLabelText('업태'), '제조업')
    await userEvent.type(screen.getByLabelText('업종'), '화학제품')
    await userEvent.click(screen.getByLabelText(/이용약관 동의/))
    await userEvent.click(screen.getByLabelText(/개인정보 수집 및 이용 안내 동의/))

    expect(screen.getByRole('button', { name: /^회원가입$/ })).toBeDisabled()
  })

  it('상세주소를 입력하면 사업장 소재지와 합쳐서 회원가입 요청에 포함된다', async () => {
    let capturedBody: Record<string, unknown> = {}
    server.use(
      http.post('*/auth/signup', async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ statusCode: 200, data: true, error: [] })
      })
    )

    render(<RegisterPage />)
    await fillValidForm()
    await userEvent.type(screen.getByLabelText('상세주소'), '3층 301호')
    await userEvent.click(screen.getByRole('button', { name: /^회원가입$/ }))

    await waitFor(() => {
      expect(capturedBody.businessAddress).toBe('서울시 강남구 테헤란로 1 3층 301호')
    })
  })

  it('전체 동의 체크박스를 클릭하면 약관 4개가 모두 체크된다', async () => {
    render(<RegisterPage />)

    await userEvent.click(screen.getByLabelText(/^전체 동의$/))

    expect(screen.getByLabelText(/이용약관 동의/)).toBeChecked()
    expect(screen.getByLabelText(/개인정보 수집 및 이용 안내 동의/)).toBeChecked()
    expect(screen.getByLabelText(/^이메일 수신$/)).toBeChecked()
    expect(screen.getByLabelText(/^SMS 수신$/)).toBeChecked()
  })

  it('핸드폰인증을 완료하면 이름/휴대폰번호가 인증된 값으로 자동 입력되고 수정할 수 없다 (이메일은 제외)', async () => {
    render(<RegisterPage />)

    // 사전에 다른 값을 입력해둔 상태
    await userEvent.type(screen.getByLabelText(/이름/), '임시이름')
    await userEvent.type(screen.getByLabelText(/^이메일$/), 'temp@test.com')
    await userEvent.type(screen.getByLabelText(/휴대폰번호/), '010-9999-9999')

    await userEvent.click(screen.getByText('identity-verification-mock'))

    const nameInput = screen.getByLabelText(/이름/) as HTMLInputElement
    const emailInput = screen.getByLabelText(/^이메일$/) as HTMLInputElement
    const phoneInput = screen.getByLabelText(/휴대폰번호/) as HTMLInputElement

    // 이름/휴대폰번호는 사전 입력값이 지워지고 인증된 값으로 덮어써진 뒤 잠긴다
    expect(nameInput.value).toBe(VERIFIED_CUSTOMER.name)
    expect(phoneInput.value).toBe(VERIFIED_CUSTOMER.phoneNumber)
    expect(nameInput).toBeDisabled()
    expect(phoneInput).toBeDisabled()

    // 이메일은 인증 대상이 아니므로 입력값이 그대로 유지되고 계속 수정 가능하다
    expect(emailInput.value).toBe('temp@test.com')
    expect(emailInput).not.toBeDisabled()
  })

  it('회원가입 요청이 진행 중일 때는 제출 버튼과 폼 전체 필드가 잠긴다', async () => {
    let resolveSignup: () => void = () => {}
    const signupPromise = new Promise<void>((resolve) => {
      resolveSignup = resolve
    })
    server.use(
      http.post('*/auth/signup', async () => {
        await signupPromise
        return HttpResponse.json({ statusCode: 200, data: true, error: [] })
      })
    )

    render(<RegisterPage />)
    await fillValidForm()

    const submitButton = screen.getByRole('button', { name: /^회원가입$/ })
    await userEvent.click(submitButton)

    expect(submitButton).toBeDisabled()
    expect(submitButton).toHaveTextContent(/가입 중/)
    expect(screen.getByLabelText(/^이메일$/)).toBeDisabled()
    expect(screen.getByLabelText(/^비밀번호$/)).toBeDisabled()
    expect(screen.getByLabelText(/비밀번호 확인/)).toBeDisabled()
    expect(screen.getByLabelText('법인명')).toBeDisabled()
    expect(screen.getByLabelText(/이용약관 동의/)).toBeDisabled()

    resolveSignup()
    // 회원가입 완료까지 대기하여 act 경고 방지
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith({ to: '/login' }))
  })

  it('모든 값을 올바르게 입력하면 회원가입에 성공하여 /login으로 이동한다', async () => {
    server.use(
      http.post('*/auth/signup', () =>
        HttpResponse.json({ statusCode: 200, data: true, error: [] })
      )
    )

    render(<RegisterPage />)
    await fillValidForm()

    const submitButton = screen.getByRole('button', { name: /^회원가입$/ })
    expect(submitButton).not.toBeDisabled()
    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/login' })
    })
  })

  it('이미 가입된 이메일이면 에러 메시지를 표시한다', async () => {
    server.use(
      http.post('*/auth/signup', () =>
        HttpResponse.json(
          { statusCode: 409, data: false, error: ['이미 가입된 이메일입니다.'] },
          { status: 409 }
        )
      )
    )

    render(<RegisterPage />)
    await fillValidForm()
    await userEvent.click(screen.getByRole('button', { name: /^회원가입$/ }))

    expect(await screen.findByText(/이미 가입된 이메일입니다./)).toBeInTheDocument()
    expect(mockNavigate).not.toHaveBeenCalledWith({ to: '/login' })
  })
})
