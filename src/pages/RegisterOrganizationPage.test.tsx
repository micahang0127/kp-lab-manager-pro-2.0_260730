import { useNavigate } from '@tanstack/react-router'
import { fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { BusinessRegistrationReviewData } from '../api/file'
import type { InvitedOrg } from '../api/user'
import { signUp } from '../api/user'
import { useFindAccountFlowStore } from '../stores/findAccountFlowStore'
import { useRegisterFlowStore } from '../stores/registerFlowStore'
import { render, screen } from '../test/test-utils'
import type { UploadedBusinessRegistration } from '../utils/uploadBusinessRegistration'
import { uploadBusinessRegistration } from '../utils/uploadBusinessRegistration'
import { RegisterOrganizationPage } from './RegisterOrganizationPage'

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: vi.fn(),
}))

vi.mock('../utils/uploadBusinessRegistration', () => ({
  uploadBusinessRegistration: vi.fn(),
}))

vi.mock('../api/user', () => ({
  signUp: vi.fn(),
}))

const createPdfFile = (name = '사업자등록증.pdf', sizeInBytes = 1024) =>
  new File([new Uint8Array(sizeInBytes)], name, { type: 'application/pdf' })

const REVIEW: BusinessRegistrationReviewData = {
  registrationNumber: '123-45-67890',
  corporateName: 'KP한석화학 주식회사',
  ceoName: '홍길동',
  corporateRegistrationNumber: '110111-1234567',
  businessAddress: '서울시 ...',
  businessType: '도매',
  businessItem: '석유제품',
  issueDate: '2020-01-01',
}
const UPLOADED: UploadedBusinessRegistration = {
  review: REVIEW,
  s3Key: 'PRODUCTION/BusinessRegistration/260901/xxxxxxxx.pdf',
}

/** 6단계까지 완료됐다고 가정했을 때 registerFlowStore에 남아있어야 할 값들 */
const PRIOR_STEPS_STATE = {
  registerMethod: 'new' as const,
  registerEmail: 'user@koreapetroleum.com',
  registerEmailCode: '123456',
  registerPassword: 'abcd1234',
  identityVerificationCode: 'identity-verification-abc123',
  identityVerifyResult: { isVerified: true, hasExistingAccount: false, maskedName: '홍길*' },
  termsAgreement: { marketingOptIn: true },
}

/** signUp 성공(201) 응답 데이터 — API 문서(UserSignUpPayload)의 예시를 그대로 사용 */
const SIGN_UP_SUCCESS_DATA = {
  userIdx: '1',
  email: PRIOR_STEPS_STATE.registerEmail,
  marketingYn: 'Y' as const,
  createdAt: '2026-09-11T00:00:00.000Z',
  orgIdx: '1',
  orgName: '회사명',
  orgGrade: 'SYSTEM',
  groupIdx: '1',
  acceptedInvitedIdx: null,
  rejectedInviteCount: 0,
}

/** 아직 resolve/reject하지 않은 Promise를 만들어 로딩 상태를 검증할 수 있게 한다 */
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('RegisterOrganizationPage', () => {
  beforeEach(() => {
    vi.mocked(useNavigate).mockReturnValue(mockNavigate)
    vi.clearAllMocks()
    useRegisterFlowStore.setState({
      registerMethod: null,
      registerEmail: null,
      registerEmailCode: null,
      registerPassword: null,
      invitedOrgs: null,
      identityVerificationCode: null,
      identityVerifyResult: null,
      termsAgreement: null,
      businessRegistrationFile: null,
      businessRegistrationReview: null,
      businessRegistrationS3Key: null,
    })
    useFindAccountFlowStore.setState({ verifiedIdentity: null })
  })

  it('페이지 제목과 안내 문구, 업로드 영역을 렌더링한다', () => {
    render(<RegisterOrganizationPage />)

    expect(screen.getByRole('heading', { name: '회원가입' })).toBeInTheDocument()
    expect(screen.getByText('새 조직을 등록해 주세요.')).toBeInTheDocument()
    expect(screen.getByText('사업자등록증 업로드')).toBeInTheDocument()
  })

  it('파일을 선택하기 전에는 "새 조직으로 가입 →" 버튼이 disabled다', () => {
    render(<RegisterOrganizationPage />)

    expect(screen.getByRole('button', { name: '새 조직으로 가입 →' })).toBeDisabled()
  })

  it('PDF가 아닌 파일을 드래그해 놓으면 오류 문구를 표시하고 업로드를 시작하지 않는다', () => {
    // input의 accept 속성은 파일 선택창(클릭 업로드)에서만 필터링되고 드래그앤드롭에는
    // 적용되지 않으므로, 잘못된 파일 형식은 드롭 시나리오로 재현한다.
    render(<RegisterOrganizationPage />)

    const file = new File(['dummy'], '사업자등록증.png', { type: 'image/png' })
    const dropZone = screen.getByRole('button', { name: /사업자등록증 업로드/ })

    fireEvent.drop(dropZone, { dataTransfer: { files: [file] } })

    expect(screen.getByText('PDF 파일만 업로드할 수 있습니다.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '새 조직으로 가입 →' })).toBeDisabled()
    expect(uploadBusinessRegistration).not.toHaveBeenCalled()
  })

  it('20MB를 초과하는 파일을 선택하면 오류 문구를 표시하고 업로드를 시작하지 않는다', async () => {
    render(<RegisterOrganizationPage />)

    const file = createPdfFile('사업자등록증.pdf', 21 * 1024 * 1024)
    const input = screen.getByLabelText('사업자등록증 파일 선택')

    await userEvent.upload(input, file)

    expect(screen.getByText('파일 크기는 최대 20MB까지 업로드할 수 있습니다.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '새 조직으로 가입 →' })).toBeDisabled()
    expect(uploadBusinessRegistration).not.toHaveBeenCalled()
  })

  it('PDF 선택 → 업로드 중 문구 표시 → 완료 카드 렌더링 → 제출 버튼이 완료 라벨로 활성화된다', async () => {
    const { promise, resolve } = deferred<UploadedBusinessRegistration>()
    vi.mocked(uploadBusinessRegistration).mockReturnValue(promise)

    render(<RegisterOrganizationPage />)

    const file = createPdfFile()
    const input = screen.getByLabelText('사업자등록증 파일 선택')
    await userEvent.upload(input, file)

    expect(screen.getByText('사업자등록증을 확인하고 있어요...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '새 조직으로 가입 →' })).toBeDisabled()

    resolve(UPLOADED)

    await waitFor(() => {
      expect(screen.getByText('KP한석화학 주식회사')).toBeInTheDocument()
    })
    expect(screen.getByText('123-45-67890')).toBeInTheDocument()
    expect(screen.getByText('사업자등록증.pdf')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '새 조직으로 가입 완료 →' })).not.toBeDisabled()

    expect(useRegisterFlowStore.getState().businessRegistrationFile).toBe(file)
    expect(useRegisterFlowStore.getState().businessRegistrationReview).toEqual(REVIEW)
    expect(useRegisterFlowStore.getState().businessRegistrationS3Key).toBe(UPLOADED.s3Key)

    // 업로드 완료 시에만 나타나는 조직명 입력 필드 — 인식된 법인명이 기본값으로 채워진다
    expect(screen.getByLabelText('조직명 *')).toHaveValue(REVIEW.corporateName)
  })

  it('업로드/분석이 실패하면 에러 문구를 표시하고 빈 업로드 박스로 되돌린다', async () => {
    vi.mocked(uploadBusinessRegistration).mockRejectedValue(
      new Error('사업자등록증을 인식할 수 없습니다. 다시 업로드해주세요.')
    )

    render(<RegisterOrganizationPage />)

    const file = createPdfFile()
    const input = screen.getByLabelText('사업자등록증 파일 선택')
    await userEvent.upload(input, file)

    await waitFor(() => {
      expect(
        screen.getByText('사업자등록증을 인식할 수 없습니다. 다시 업로드해주세요.')
      ).toBeInTheDocument()
    })
    expect(screen.getByText('사업자등록증 업로드')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '새 조직으로 가입 →' })).toBeDisabled()
    expect(useRegisterFlowStore.getState().businessRegistrationFile).toBeNull()
  })

  it('완료 카드의 삭제(X) 버튼을 클릭하면 빈 업로드 박스로 되돌리고 store를 초기화한다', async () => {
    vi.mocked(uploadBusinessRegistration).mockResolvedValue(UPLOADED)

    render(<RegisterOrganizationPage />)

    const file = createPdfFile()
    const input = screen.getByLabelText('사업자등록증 파일 선택')
    await userEvent.upload(input, file)

    await waitFor(() => {
      expect(screen.getByText('KP한석화학 주식회사')).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: '사업자등록증 삭제' }))

    expect(screen.getByText('사업자등록증 업로드')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '새 조직으로 가입 →' })).toBeDisabled()
    expect(useRegisterFlowStore.getState().businessRegistrationFile).toBeNull()
    expect(useRegisterFlowStore.getState().businessRegistrationReview).toBeNull()
    expect(useRegisterFlowStore.getState().businessRegistrationS3Key).toBeNull()
    // 조직명 입력 필드는 업로드 완료 상태에서만 보이므로 삭제 후에는 함께 사라진다
    expect(screen.queryByLabelText('조직명 *')).not.toBeInTheDocument()
  })

  it('"← 이전" 버튼을 클릭하면 6단계(비밀번호 설정)로 이동한다', async () => {
    render(<RegisterOrganizationPage />)

    await userEvent.click(screen.getByRole('button', { name: /이전/ }))

    expect(mockNavigate).toHaveBeenCalledWith({ to: '/register-password' })
  })

  describe('초대받은 조직이 있는 경우(기존 조직에 가입)', () => {
    const INVITED_ORGS: InvitedOrg[] = [
      {
        invitedIdx: '12',
        orgIdx: '3',
        orgName: '테스트회사',
        orgGrade: 'MEMBER',
        invitedAt: '2026-08-15T01:23:45.000Z',
      },
      {
        invitedIdx: '13',
        orgIdx: '4',
        orgName: '두번째회사',
        orgGrade: 'ADMIN',
        invitedAt: '2026-03-02T01:23:45.000Z',
      },
    ]

    beforeEach(() => {
      useRegisterFlowStore.setState({ ...PRIOR_STEPS_STATE, invitedOrgs: INVITED_ORGS })
    })

    it('업로드 화면 대신 초대 조직 목록을 렌더링하고, 첫 번째 조직이 기본 선택돼 있다', () => {
      render(<RegisterOrganizationPage />)

      expect(screen.getByText('가입할 조직을 확인해 주세요.')).toBeInTheDocument()
      expect(screen.getByText('테스트회사 · MEMBER')).toBeInTheDocument()
      expect(screen.getByText('두번째회사 · ADMIN')).toBeInTheDocument()
      expect(screen.queryByText('사업자등록증 업로드')).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: '선택한 조직으로 가입 완료 →' })).not.toBeDisabled()
    })

    it('다른 조직을 클릭하면 선택이 바뀐다', async () => {
      vi.mocked(signUp).mockResolvedValue({
        result: true,
        statusCode: 201,
        data: SIGN_UP_SUCCESS_DATA,
        message: [],
      })

      render(<RegisterOrganizationPage />)

      await userEvent.click(screen.getByText('두번째회사 · ADMIN'))
      await userEvent.click(screen.getByRole('button', { name: '선택한 조직으로 가입 완료 →' }))

      await waitFor(() => {
        expect(signUp).toHaveBeenCalledWith({
          email: PRIOR_STEPS_STATE.registerEmail,
          password: PRIOR_STEPS_STATE.registerPassword,
          verificationCode: PRIOR_STEPS_STATE.identityVerificationCode,
          code: PRIOR_STEPS_STATE.registerEmailCode,
          joinType: 1,
          termsYn: 'Y',
          marketingYn: 'Y',
          orgIdx: 4,
          invitedIdx: 13,
        })
      })
    })

    it('"선택한 조직으로 가입 완료" 클릭 시 기본 선택된(첫 번째) 조직으로 signUp을 호출한다', async () => {
      vi.mocked(signUp).mockResolvedValue({
        result: true,
        statusCode: 201,
        data: SIGN_UP_SUCCESS_DATA,
        message: [],
      })

      render(<RegisterOrganizationPage />)

      await userEvent.click(screen.getByRole('button', { name: '선택한 조직으로 가입 완료 →' }))

      await waitFor(() => {
        expect(signUp).toHaveBeenCalledWith({
          email: PRIOR_STEPS_STATE.registerEmail,
          password: PRIOR_STEPS_STATE.registerPassword,
          verificationCode: PRIOR_STEPS_STATE.identityVerificationCode,
          code: PRIOR_STEPS_STATE.registerEmailCode,
          joinType: 1,
          termsYn: 'Y',
          marketingYn: 'Y',
          orgIdx: 3,
          invitedIdx: 12,
        })
      })
    })

    it('signUp 성공 시 invitedOrgs를 포함한 회원가입 플로우 store를 초기화하고 로그인 페이지로 이동한다', async () => {
      vi.mocked(signUp).mockResolvedValue({
        result: true,
        statusCode: 201,
        data: SIGN_UP_SUCCESS_DATA,
        message: [],
      })

      render(<RegisterOrganizationPage />)

      await userEvent.click(screen.getByRole('button', { name: '선택한 조직으로 가입 완료 →' }))

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith({ to: '/login' })
      })
      expect(useRegisterFlowStore.getState().invitedOrgs).toBeNull()
      expect(useRegisterFlowStore.getState().registerEmail).toBeNull()
      expect(useRegisterFlowStore.getState().registerEmailCode).toBeNull()
    })

    it('signUp 실패 시 에러 문구를 표시하고 다시 제출할 수 있다', async () => {
      vi.mocked(signUp).mockRejectedValue(new Error('존재하지 않는 회사입니다'))

      render(<RegisterOrganizationPage />)

      await userEvent.click(screen.getByRole('button', { name: '선택한 조직으로 가입 완료 →' }))

      expect(await screen.findByText('존재하지 않는 회사입니다')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '선택한 조직으로 가입 완료 →' })).not.toBeDisabled()
    })
  })

  describe('회원가입 최종 제출(signUp)', () => {
    beforeEach(() => {
      useRegisterFlowStore.setState(PRIOR_STEPS_STATE)
    })

    it('임시 디버그 패널에 이전 단계에서 수집한 데이터를 표시한다', () => {
      render(<RegisterOrganizationPage />)

      expect(screen.getByText('가입 방법(registerMethod): new')).toBeInTheDocument()
      expect(screen.getByText('이메일(registerEmail): user@koreapetroleum.com')).toBeInTheDocument()
      expect(screen.getByText('비밀번호(registerPassword): abcd1234')).toBeInTheDocument()
      expect(
        screen.getByText('본인인증 키(identityVerificationCode): identity-verification-abc123')
      ).toBeInTheDocument()
    })

    it('임시 디버그 패널에 signUp API로 전송될 request 데이터를 JSON으로 표시한다', () => {
      render(<RegisterOrganizationPage />)

      const preview = screen.getByText(/"email": "user@koreapetroleum.com"/)
      expect(preview.textContent).toContain('"password": "abcd1234"')
      expect(preview.textContent).toContain('"verificationCode": "identity-verification-abc123"')
    })

    it('사업자등록증 업로드 완료 후에는 request 미리보기에 regFile/조직 정보가 함께 표시된다', async () => {
      vi.mocked(uploadBusinessRegistration).mockResolvedValue(UPLOADED)

      render(<RegisterOrganizationPage />)

      const input = screen.getByLabelText('사업자등록증 파일 선택')
      await userEvent.upload(input, createPdfFile())

      await waitFor(() => {
        const preview = screen.getByText(new RegExp(`"regFile": "${UPLOADED.s3Key}"`))
        expect(preview.textContent).toContain(`"orgName": "${REVIEW.corporateName}"`)
        expect(preview.textContent).toContain(`"regNo": "${REVIEW.registrationNumber}"`)
      })
    })

    it('업로드 완료 후 "새 조직으로 가입 완료" 클릭 시 이전 단계 값을 모아 signUp을 호출한다', async () => {
      vi.mocked(uploadBusinessRegistration).mockResolvedValue(UPLOADED)
      vi.mocked(signUp).mockResolvedValue({
        result: true,
        statusCode: 201,
        data: SIGN_UP_SUCCESS_DATA,
        message: [],
      })

      render(<RegisterOrganizationPage />)

      const input = screen.getByLabelText('사업자등록증 파일 선택')
      await userEvent.upload(input, createPdfFile())

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '새 조직으로 가입 완료 →' })).not.toBeDisabled()
      })
      await userEvent.click(screen.getByRole('button', { name: '새 조직으로 가입 완료 →' }))

      await waitFor(() => {
        expect(signUp).toHaveBeenCalledWith({
          email: PRIOR_STEPS_STATE.registerEmail,
          password: PRIOR_STEPS_STATE.registerPassword,
          verificationCode: PRIOR_STEPS_STATE.identityVerificationCode,
          code: PRIOR_STEPS_STATE.registerEmailCode,
          joinType: 0,
          termsYn: 'Y',
          marketingYn: 'Y',
          regFile: UPLOADED.s3Key,
          orgName: REVIEW.corporateName,
          regNo: REVIEW.registrationNumber,
          ceoName: REVIEW.ceoName,
          address: REVIEW.businessAddress,
          bizItem: REVIEW.businessItem,
          bizType: REVIEW.businessType,
        })
      })
    })

    it('조직명을 수정하고 제출하면 수정한 값으로 signUp을 호출한다', async () => {
      vi.mocked(uploadBusinessRegistration).mockResolvedValue(UPLOADED)
      vi.mocked(signUp).mockResolvedValue({
        result: true,
        statusCode: 201,
        data: SIGN_UP_SUCCESS_DATA,
        message: [],
      })

      render(<RegisterOrganizationPage />)

      const input = screen.getByLabelText('사업자등록증 파일 선택')
      await userEvent.upload(input, createPdfFile())

      const orgNameInput = await screen.findByLabelText('조직명 *')
      await userEvent.clear(orgNameInput)
      await userEvent.type(orgNameInput, 'KP한석화학(수정)')

      await userEvent.click(screen.getByRole('button', { name: '새 조직으로 가입 완료 →' }))

      await waitFor(() => {
        expect(signUp).toHaveBeenCalledWith(
          expect.objectContaining({ orgName: 'KP한석화학(수정)' })
        )
      })
    })

    it('조직명을 비우면 제출 버튼이 disabled되고, signUp을 호출하지 않는다', async () => {
      vi.mocked(uploadBusinessRegistration).mockResolvedValue(UPLOADED)

      render(<RegisterOrganizationPage />)

      const input = screen.getByLabelText('사업자등록증 파일 선택')
      await userEvent.upload(input, createPdfFile())

      const orgNameInput = await screen.findByLabelText('조직명 *')
      await userEvent.clear(orgNameInput)

      expect(screen.getByRole('button', { name: '새 조직으로 가입 완료 →' })).toBeDisabled()
      expect(signUp).not.toHaveBeenCalled()
    })

    it('signUp 성공 시 회원가입 플로우 store를 초기화하고 로그인 페이지로 이동한다', async () => {
      // 아이디·비밀번호 찾기를 거쳐 회원가입까지 온 경우를 가정 — 가입이 끝나면 이 값도 함께
      // 비워져야 이후 /find-account에서 사실과 다른 "가입된 계정 없음" 안내가 뜨지 않는다
      useFindAccountFlowStore.setState({
        verifiedIdentity: {
          result: PRIOR_STEPS_STATE.identityVerifyResult,
          identityVerificationCode: PRIOR_STEPS_STATE.identityVerificationCode,
        },
      })
      vi.mocked(uploadBusinessRegistration).mockResolvedValue(UPLOADED)
      vi.mocked(signUp).mockResolvedValue({
        result: true,
        statusCode: 201,
        data: SIGN_UP_SUCCESS_DATA,
        message: [],
      })

      render(<RegisterOrganizationPage />)

      const input = screen.getByLabelText('사업자등록증 파일 선택')
      await userEvent.upload(input, createPdfFile())

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '새 조직으로 가입 완료 →' })).not.toBeDisabled()
      })
      await userEvent.click(screen.getByRole('button', { name: '새 조직으로 가입 완료 →' }))

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith({ to: '/login' })
      })
      expect(useRegisterFlowStore.getState().registerMethod).toBeNull()
      expect(useRegisterFlowStore.getState().registerEmail).toBeNull()
      expect(useRegisterFlowStore.getState().registerEmailCode).toBeNull()
      expect(useRegisterFlowStore.getState().registerPassword).toBeNull()
      expect(useRegisterFlowStore.getState().identityVerificationCode).toBeNull()
      expect(useRegisterFlowStore.getState().identityVerifyResult).toBeNull()
      expect(useRegisterFlowStore.getState().termsAgreement).toBeNull()
      expect(useRegisterFlowStore.getState().businessRegistrationFile).toBeNull()
      expect(useRegisterFlowStore.getState().businessRegistrationReview).toBeNull()
      expect(useRegisterFlowStore.getState().businessRegistrationS3Key).toBeNull()
      expect(useFindAccountFlowStore.getState().verifiedIdentity).toBeNull()
    })

    it('signUp 실패 시 에러 문구를 표시하고 다시 제출할 수 있다', async () => {
      vi.mocked(uploadBusinessRegistration).mockResolvedValue(UPLOADED)
      vi.mocked(signUp).mockRejectedValue(new Error('이미 가입된 이메일입니다.'))

      render(<RegisterOrganizationPage />)

      const input = screen.getByLabelText('사업자등록증 파일 선택')
      await userEvent.upload(input, createPdfFile())

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '새 조직으로 가입 완료 →' })).not.toBeDisabled()
      })
      await userEvent.click(screen.getByRole('button', { name: '새 조직으로 가입 완료 →' }))

      expect(await screen.findByText('이미 가입된 이메일입니다.')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '새 조직으로 가입 완료 →' })).not.toBeDisabled()
    })
  })
})
