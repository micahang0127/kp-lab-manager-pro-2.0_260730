import { useNavigate } from '@tanstack/react-router'
import { cleanup, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { checkExistingAccount, deleteExistingAccount } from '../api/auth'
import { sendEmailVerificationCode, verifyEmailVerificationCode } from '../api/user'
import { server } from '../test/mocks/server'
import { render, screen } from '../test/test-utils'
import { RegisterPage } from './RegisterPage'

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: vi.fn(),
}))

// 핸드폰인증 완료 시 백엔드(본인인증)에서 확인된 값 — 이름/휴대폰번호/생년월일/성별 자동 입력에 사용 (이메일은 제외)
const VERIFIED_CUSTOMER = {
  ci: 'mock-ci-123',
  di: 'mock-di-456',
  name: '홍길동',
  gender: 'M',
  birthDate: '1990-01-01',
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

// 기존 계정 확인/삭제([TEMP] 스텁) — 기본은 실제 구현(항상 exists: false)을 그대로 쓰고,
// 필요한 테스트에서만 mockResolvedValueOnce 등으로 override한다
vi.mock('../api/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/auth')>()
  return {
    ...actual,
    checkExistingAccount: vi.fn(actual.checkExistingAccount),
    deleteExistingAccount: vi.fn(actual.deleteExistingAccount),
  }
})

// 이메일 인증번호 발송/확인([TEMP] 스텁) — 기본은 실제 구현(항상 성공)을 그대로 쓰고,
// 필요한 테스트에서만 override한다. signup은 MSW로 실제 fetch를 검증하므로 actual을 그대로 유지한다
vi.mock('../api/user', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/user')>()
  return {
    ...actual,
    sendEmailVerificationCode: vi.fn(actual.sendEmailVerificationCode),
    verifyEmailVerificationCode: vi.fn(actual.verifyEmailVerificationCode),
  }
})

// ─── Setup ─────────────────────────────────────────────────────────────────────

const VALID_PASSWORD = 'Password1!'
const VALID_EMAIL_CODE = '123456'

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

/** 핸드폰인증을 완료하고, 기존 계정 확인(비동기) 응답까지 기다린다 */
async function completeIdentityVerification() {
  await userEvent.click(screen.getByText('identity-verification-mock'))
  await waitFor(() => {
    expect(screen.getByLabelText('이름')).toHaveValue(VERIFIED_CUSTOMER.name)
  })
}

/** 이메일을 입력하고 인증번호 발송 → 확인까지 완료한다 */
async function completeEmailVerification(email: string) {
  await userEvent.type(screen.getByLabelText(/^이메일$/), email)
  await userEvent.click(screen.getByRole('button', { name: '인증번호 보내기' }))
  await waitFor(() => {
    expect(screen.getByLabelText('이메일 인증번호')).not.toBeDisabled()
  })
  await userEvent.type(screen.getByLabelText('이메일 인증번호'), VALID_EMAIL_CODE)
  await userEvent.click(screen.getByRole('button', { name: '확인' }))
  await waitFor(() => {
    expect(screen.getByText('이메일 인증이 완료되었습니다.')).toBeInTheDocument()
  })
}

/** 핸드폰인증/이메일인증을 완료하고 비밀번호/사업자정보/필수 약관까지 채워 제출 가능한 상태로 만든다 */
async function fillValidForm() {
  await completeIdentityVerification()
  await completeEmailVerification('newuser@test.com')
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
    expect(await screen.findByText(/비밀번호는 최소 8자리 이상입니다./)).toBeInTheDocument()
  })

  it('비밀번호와 비밀번호 확인이 다르면 에러를 표시한다', async () => {
    render(<RegisterPage />)
    await userEvent.type(screen.getByLabelText(/^비밀번호$/), VALID_PASSWORD)
    await userEvent.type(screen.getByLabelText(/비밀번호 확인/), 'DifferentPass1!')
    expect(await screen.findByText(/비밀번호가 일치하지 않습니다./)).toBeInTheDocument()
  })

  it('본인인증 전에는 이름/휴대폰번호/생년월일/성별 입력란에 안내 placeholder가 표시되고 비활성화된다', () => {
    render(<RegisterPage />)

    for (const label of ['이름', '휴대폰번호', '생년월일', '성별']) {
      const input = screen.getByLabelText(label)
      expect(input).toBeDisabled()
      expect(input).toHaveAttribute('placeholder', '본인 인증이 필요합니다.')
    }
  })

  it('핸드폰인증을 완료하면 이름/휴대폰번호/생년월일/성별이 인증된 값으로 자동 입력된다', async () => {
    render(<RegisterPage />)

    await completeIdentityVerification()

    expect(screen.getByLabelText('이름')).toHaveValue(VERIFIED_CUSTOMER.name)
    expect(screen.getByLabelText('휴대폰번호')).toHaveValue(VERIFIED_CUSTOMER.phoneNumber)
    expect(screen.getByLabelText('생년월일')).toHaveValue('1990.01.01')
    expect(screen.getByLabelText('성별')).toHaveValue('남성')
  })

  it('핸드폰인증을 완료하지 않으면 제출 버튼이 비활성화된다', async () => {
    render(<RegisterPage />)

    await completeEmailVerification('newuser@test.com')
    await userEvent.type(screen.getByLabelText(/^비밀번호$/), VALID_PASSWORD)
    await userEvent.type(screen.getByLabelText(/비밀번호 확인/), VALID_PASSWORD)
    await fillBusinessInfo()
    await userEvent.click(screen.getByLabelText(/이용약관 동의/))
    await userEvent.click(screen.getByLabelText(/개인정보 수집 및 이용 안내 동의/))

    expect(screen.getByRole('button', { name: /^회원가입$/ })).toBeDisabled()
  })

  it('이메일 인증을 완료하지 않으면 제출 버튼이 비활성화된다', async () => {
    render(<RegisterPage />)

    await completeIdentityVerification()
    await userEvent.type(screen.getByLabelText(/^이메일$/), 'newuser@test.com')
    await userEvent.type(screen.getByLabelText(/^비밀번호$/), VALID_PASSWORD)
    await userEvent.type(screen.getByLabelText(/비밀번호 확인/), VALID_PASSWORD)
    await fillBusinessInfo()
    await userEvent.click(screen.getByLabelText(/이용약관 동의/))
    await userEvent.click(screen.getByLabelText(/개인정보 수집 및 이용 안내 동의/))

    expect(screen.getByRole('button', { name: /^회원가입$/ })).toBeDisabled()
  })

  it('필수 약관에 동의하지 않으면 제출 버튼이 비활성화된다', async () => {
    render(<RegisterPage />)

    await completeIdentityVerification()
    await completeEmailVerification('newuser@test.com')
    await userEvent.type(screen.getByLabelText(/^비밀번호$/), VALID_PASSWORD)
    await userEvent.type(screen.getByLabelText(/비밀번호 확인/), VALID_PASSWORD)
    await fillBusinessInfo()

    expect(screen.getByRole('button', { name: /^회원가입$/ })).toBeDisabled()
  })

  it('사업자등록증을 첨부하지 않으면 제출 버튼이 비활성화된다', async () => {
    render(<RegisterPage />)

    await completeIdentityVerification()
    await completeEmailVerification('newuser@test.com')
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
        return HttpResponse.json({ result: true, statusCode: 200, data: true, message: [] })
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

  describe('본인인증 후 기존 계정 확인', () => {
    it('기존 계정이 없으면 confirm 없이 인증이 완료된다', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm')
      render(<RegisterPage />)

      await completeIdentityVerification()

      expect(confirmSpy).not.toHaveBeenCalled()
      expect(deleteExistingAccount).not.toHaveBeenCalled()
    })

    it('기존 계정이 있으면 confirm 후 동의하면 기존 계정을 삭제하고 인증을 완료한다', async () => {
      vi.mocked(checkExistingAccount).mockResolvedValueOnce({
        result: true,
        statusCode: 200,
        data: { exists: true },
        message: [],
      })
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)

      render(<RegisterPage />)
      await completeIdentityVerification()

      expect(confirmSpy).toHaveBeenCalledWith(
        '기존 가입한 계정이 존재합니다. \n 기존 계정을 삭제하고, 가입을 계속 진행하시겠습니까?'
      )
      expect(deleteExistingAccount).toHaveBeenCalledWith({ ci: VERIFIED_CUSTOMER.ci })
    })

    it('기존 계정이 있을 때 confirm을 취소하면 인증이 완료되지 않고 취소 안내 문구를 표시한다', async () => {
      vi.mocked(checkExistingAccount).mockResolvedValueOnce({
        result: true,
        statusCode: 200,
        data: { exists: true },
        message: [],
      })
      vi.spyOn(window, 'confirm').mockReturnValue(false)

      render(<RegisterPage />)
      await userEvent.click(screen.getByText('identity-verification-mock'))

      expect(
        await screen.findByText(
          '회원가입이 취소되었습니다. 계속하려면 본인인증을 다시 진행해주세요.'
        )
      ).toBeInTheDocument()
      expect(deleteExistingAccount).not.toHaveBeenCalled()
      expect(screen.getByLabelText('이름')).toHaveValue('')
      expect(screen.getByLabelText('이름')).toBeDisabled()
    })

    it('기존 계정 확인 중 오류가 발생하면 오류 메시지를 표시하고 인증을 완료하지 않는다', async () => {
      vi.mocked(checkExistingAccount).mockRejectedValueOnce(
        new Error('기존 계정 확인 중 오류가 발생했습니다.')
      )

      render(<RegisterPage />)
      await userEvent.click(screen.getByText('identity-verification-mock'))

      expect(await screen.findByText('기존 계정 확인 중 오류가 발생했습니다.')).toBeInTheDocument()
      expect(screen.getByLabelText('이름')).toHaveValue('')
      expect(screen.getByLabelText('이름')).toBeDisabled()
    })
  })

  describe('이메일 인증번호', () => {
    it('유효한 이메일 형식이 아니면 인증번호 보내기 버튼이 비활성화된다', async () => {
      render(<RegisterPage />)
      expect(screen.getByRole('button', { name: '인증번호 보내기' })).toBeDisabled()

      await userEvent.type(screen.getByLabelText(/^이메일$/), 'invalid-email')
      expect(screen.getByRole('button', { name: '인증번호 보내기' })).toBeDisabled()
    })

    it('인증번호 보내기를 클릭하면 인증번호 입력란이 활성화되고 발송 안내 문구가 표시된다', async () => {
      render(<RegisterPage />)

      await userEvent.type(screen.getByLabelText(/^이메일$/), 'newuser@test.com')
      expect(screen.getByLabelText('이메일 인증번호')).toBeDisabled()

      await userEvent.click(screen.getByRole('button', { name: '인증번호 보내기' }))

      await waitFor(() => {
        expect(screen.getByLabelText('이메일 인증번호')).not.toBeDisabled()
      })
      expect(
        screen.getByText('인증번호가 발송되었습니다. 이메일을 확인해주세요.')
      ).toBeInTheDocument()
      expect(sendEmailVerificationCode).toHaveBeenCalledWith({ email: 'newuser@test.com' })
    })

    it('인증번호를 확인하면 인증 완료 문구가 표시되고 이메일/인증번호 입력란이 잠긴다', async () => {
      render(<RegisterPage />)
      await completeEmailVerification('newuser@test.com')

      expect(screen.getByText('이메일 인증이 완료되었습니다.')).toBeInTheDocument()
      expect(screen.getByLabelText(/^이메일$/)).toBeDisabled()
      expect(screen.getByLabelText('이메일 인증번호')).toBeDisabled()
      expect(verifyEmailVerificationCode).toHaveBeenCalledWith({
        email: 'newuser@test.com',
        code: VALID_EMAIL_CODE,
      })
    })

    it('잘못된 인증번호를 확인하면 에러 메시지를 표시한다', async () => {
      vi.mocked(verifyEmailVerificationCode).mockRejectedValueOnce(
        new Error('인증번호가 일치하지 않습니다.')
      )

      render(<RegisterPage />)
      await userEvent.type(screen.getByLabelText(/^이메일$/), 'newuser@test.com')
      await userEvent.click(screen.getByRole('button', { name: '인증번호 보내기' }))
      await waitFor(() => {
        expect(screen.getByLabelText('이메일 인증번호')).not.toBeDisabled()
      })
      await userEvent.type(screen.getByLabelText('이메일 인증번호'), '000000')
      await userEvent.click(screen.getByRole('button', { name: '확인' }))

      expect(await screen.findByText('인증번호가 일치하지 않습니다.')).toBeInTheDocument()
    })

    it('인증번호 발송 후 이메일을 수정하면 발송 상태가 초기화된다', async () => {
      render(<RegisterPage />)

      await userEvent.type(screen.getByLabelText(/^이메일$/), 'newuser@test.com')
      await userEvent.click(screen.getByRole('button', { name: '인증번호 보내기' }))
      await waitFor(() => {
        expect(screen.getByLabelText('이메일 인증번호')).not.toBeDisabled()
      })

      await userEvent.type(screen.getByLabelText(/^이메일$/), '2')

      expect(screen.getByLabelText('이메일 인증번호')).toBeDisabled()
    })

    it('인증번호 확인 실패 후 이메일을 수정하면 에러 메시지가 사라진다', async () => {
      vi.mocked(verifyEmailVerificationCode).mockRejectedValueOnce(
        new Error('인증번호가 일치하지 않습니다.')
      )

      render(<RegisterPage />)
      await userEvent.type(screen.getByLabelText(/^이메일$/), 'newuser@test.com')
      await userEvent.click(screen.getByRole('button', { name: '인증번호 보내기' }))
      await waitFor(() => {
        expect(screen.getByLabelText('이메일 인증번호')).not.toBeDisabled()
      })
      await userEvent.type(screen.getByLabelText('이메일 인증번호'), '000000')
      await userEvent.click(screen.getByRole('button', { name: '확인' }))
      expect(await screen.findByText('인증번호가 일치하지 않습니다.')).toBeInTheDocument()

      await userEvent.type(screen.getByLabelText(/^이메일$/), '2')

      expect(screen.queryByText('인증번호가 일치하지 않습니다.')).not.toBeInTheDocument()
    })
  })

  it('회원가입 요청이 진행 중일 때는 제출 버튼과 폼 전체 필드가 잠긴다', async () => {
    let resolveSignup: () => void = () => {}
    const signupPromise = new Promise<void>((resolve) => {
      resolveSignup = resolve
    })
    server.use(
      http.post('*/auth/signup', async () => {
        await signupPromise
        return HttpResponse.json({ result: true, statusCode: 200, data: true, message: [] })
      })
    )

    render(<RegisterPage />)
    await fillValidForm()

    const submitButton = screen.getByRole('button', { name: /^회원가입$/ })
    await userEvent.click(submitButton)

    expect(submitButton).toBeDisabled()
    expect(submitButton).toHaveTextContent(/가입 중/)
    expect(screen.getByLabelText(/^이메일$/)).toBeDisabled()
    expect(screen.getByLabelText('이메일 인증번호')).toBeDisabled()
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
        HttpResponse.json({ result: true, statusCode: 200, data: true, message: [] })
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
          { result: false, statusCode: 409, data: null, message: ['이미 가입된 이메일입니다.'] },
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
