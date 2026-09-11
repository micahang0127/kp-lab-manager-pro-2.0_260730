import { beforeEach, describe, expect, it } from 'vitest'

import type { VerifyIdentityResult } from '../api/auth'
import type { BusinessRegistrationReviewData } from '../api/file'
import type { InvitedOrg } from '../api/user'
import { useRegisterFlowStore } from './registerFlowStore'

const IDENTITY_VERIFY_RESULT: VerifyIdentityResult = {
  isVerified: true,
  hasExistingAccount: false,
  maskedName: '홍길*',
  maskedBirth: '1990-**-**',
  maskedMobile: '010-**-5678',
  gender: 'M',
}

describe('registerFlowStore', () => {
  beforeEach(() => {
    useRegisterFlowStore.setState({
      registerMethod: null,
      identityVerifyResult: null,
      identityVerifySource: null,
      identityVerificationCode: null,
      termsAgreement: null,
      registerEmail: null,
      registerEmailCode: null,
      invitedOrgs: null,
      registerPassword: null,
      businessRegistrationFile: null,
      businessRegistrationReview: null,
      businessRegistrationS3Key: null,
    })
  })

  it('초기 상태는 registerMethod가 null이다', () => {
    expect(useRegisterFlowStore.getState().registerMethod).toBeNull()
  })

  it('setRegisterMethod()로 선택한 가입 방법을 저장한다', () => {
    useRegisterFlowStore.getState().setRegisterMethod('existing')

    expect(useRegisterFlowStore.getState().registerMethod).toBe('existing')
  })

  it('clearRegisterMethod()로 상태를 초기화한다', () => {
    useRegisterFlowStore.getState().setRegisterMethod('new')

    useRegisterFlowStore.getState().clearRegisterMethod()

    expect(useRegisterFlowStore.getState().registerMethod).toBeNull()
  })

  it('setRegisterMethod()를 다시 호출하면 이전 값을 덮어쓴다', () => {
    useRegisterFlowStore.getState().setRegisterMethod('existing')
    useRegisterFlowStore.getState().setRegisterMethod('new')

    expect(useRegisterFlowStore.getState().registerMethod).toBe('new')
  })

  it('초기 상태는 identityVerifyResult가 null이다', () => {
    expect(useRegisterFlowStore.getState().identityVerifyResult).toBeNull()
  })

  it('초기 상태는 identityVerifySource가 null이다', () => {
    expect(useRegisterFlowStore.getState().identityVerifySource).toBeNull()
  })

  it('setIdentityVerifyResult()로 본인인증 결과와 인증 출처를 함께 저장한다', () => {
    useRegisterFlowStore.getState().setIdentityVerifyResult(IDENTITY_VERIFY_RESULT, 'register')

    expect(useRegisterFlowStore.getState().identityVerifyResult).toEqual(IDENTITY_VERIFY_RESULT)
    expect(useRegisterFlowStore.getState().identityVerifySource).toBe('register')
  })

  it("setIdentityVerifyResult()로 아이디·비밀번호 찾기에서 이관받은 결과는 출처가 'find-account'로 저장된다", () => {
    useRegisterFlowStore.getState().setIdentityVerifyResult(IDENTITY_VERIFY_RESULT, 'find-account')

    expect(useRegisterFlowStore.getState().identityVerifySource).toBe('find-account')
  })

  it('clearIdentityVerifyResult()로 본인인증 결과와 인증 출처를 함께 초기화한다', () => {
    useRegisterFlowStore.getState().setIdentityVerifyResult(IDENTITY_VERIFY_RESULT, 'find-account')

    useRegisterFlowStore.getState().clearIdentityVerifyResult()

    expect(useRegisterFlowStore.getState().identityVerifyResult).toBeNull()
    expect(useRegisterFlowStore.getState().identityVerifySource).toBeNull()
  })

  it('초기 상태는 identityVerificationCode가 null이다', () => {
    expect(useRegisterFlowStore.getState().identityVerificationCode).toBeNull()
  })

  it('setIdentityVerificationCode()로 본인인증 키를 저장한다', () => {
    useRegisterFlowStore.getState().setIdentityVerificationCode('identity-verification-abc123')

    expect(useRegisterFlowStore.getState().identityVerificationCode).toBe(
      'identity-verification-abc123'
    )
  })

  it('clearIdentityVerificationCode()로 상태를 초기화한다', () => {
    useRegisterFlowStore.getState().setIdentityVerificationCode('identity-verification-abc123')

    useRegisterFlowStore.getState().clearIdentityVerificationCode()

    expect(useRegisterFlowStore.getState().identityVerificationCode).toBeNull()
  })

  it('초기 상태는 termsAgreement가 null이다', () => {
    expect(useRegisterFlowStore.getState().termsAgreement).toBeNull()
  })

  it('setTermsAgreement()로 약관 동의 결과를 저장한다', () => {
    useRegisterFlowStore.getState().setTermsAgreement({ marketingOptIn: true })

    expect(useRegisterFlowStore.getState().termsAgreement).toEqual({ marketingOptIn: true })
  })

  it('clearTermsAgreement()로 상태를 초기화한다', () => {
    useRegisterFlowStore.getState().setTermsAgreement({ marketingOptIn: true })

    useRegisterFlowStore.getState().clearTermsAgreement()

    expect(useRegisterFlowStore.getState().termsAgreement).toBeNull()
  })

  it('초기 상태는 registerEmail이 null이다', () => {
    expect(useRegisterFlowStore.getState().registerEmail).toBeNull()
  })

  it('setRegisterEmail()로 인증된 이메일을 저장한다', () => {
    useRegisterFlowStore.getState().setRegisterEmail('user@koreapetroleum.com')

    expect(useRegisterFlowStore.getState().registerEmail).toBe('user@koreapetroleum.com')
  })

  it('clearRegisterEmail()로 상태를 초기화한다', () => {
    useRegisterFlowStore.getState().setRegisterEmail('user@koreapetroleum.com')

    useRegisterFlowStore.getState().clearRegisterEmail()

    expect(useRegisterFlowStore.getState().registerEmail).toBeNull()
  })

  it('초기 상태는 registerEmailCode가 null이다', () => {
    expect(useRegisterFlowStore.getState().registerEmailCode).toBeNull()
  })

  it('setRegisterEmailCode()로 인증에 성공한 인증코드를 저장한다', () => {
    useRegisterFlowStore.getState().setRegisterEmailCode('123456')

    expect(useRegisterFlowStore.getState().registerEmailCode).toBe('123456')
  })

  it('clearRegisterEmailCode()로 상태를 초기화한다', () => {
    useRegisterFlowStore.getState().setRegisterEmailCode('123456')

    useRegisterFlowStore.getState().clearRegisterEmailCode()

    expect(useRegisterFlowStore.getState().registerEmailCode).toBeNull()
  })

  const INVITED_ORGS: InvitedOrg[] = [
    {
      invitedIdx: '12',
      orgIdx: '3',
      orgName: '테스트회사',
      orgGrade: 'MEMBER',
      invitedAt: '2026-09-04T01:23:45.000Z',
    },
  ]

  it('초기 상태는 invitedOrgs가 null이다', () => {
    expect(useRegisterFlowStore.getState().invitedOrgs).toBeNull()
  })

  it('setInvitedOrgs()로 초대 조직 목록을 저장한다', () => {
    useRegisterFlowStore.getState().setInvitedOrgs(INVITED_ORGS)

    expect(useRegisterFlowStore.getState().invitedOrgs).toEqual(INVITED_ORGS)
  })

  it('setInvitedOrgs()로 빈 배열(초대 없음)도 저장할 수 있다', () => {
    useRegisterFlowStore.getState().setInvitedOrgs([])

    expect(useRegisterFlowStore.getState().invitedOrgs).toEqual([])
  })

  it('clearInvitedOrgs()로 상태를 초기화한다', () => {
    useRegisterFlowStore.getState().setInvitedOrgs(INVITED_ORGS)

    useRegisterFlowStore.getState().clearInvitedOrgs()

    expect(useRegisterFlowStore.getState().invitedOrgs).toBeNull()
  })

  it('초기 상태는 registerPassword가 null이다', () => {
    expect(useRegisterFlowStore.getState().registerPassword).toBeNull()
  })

  it('setRegisterPassword()로 입력한 비밀번호를 저장한다', () => {
    useRegisterFlowStore.getState().setRegisterPassword('abcd1234')

    expect(useRegisterFlowStore.getState().registerPassword).toBe('abcd1234')
  })

  it('clearRegisterPassword()로 상태를 초기화한다', () => {
    useRegisterFlowStore.getState().setRegisterPassword('abcd1234')

    useRegisterFlowStore.getState().clearRegisterPassword()

    expect(useRegisterFlowStore.getState().registerPassword).toBeNull()
  })

  it('초기 상태는 businessRegistrationFile이 null이다', () => {
    expect(useRegisterFlowStore.getState().businessRegistrationFile).toBeNull()
  })

  it('setBusinessRegistrationFile()로 업로드한 사업자등록증 파일을 저장한다', () => {
    const file = new File(['dummy'], '사업자등록증.pdf', { type: 'application/pdf' })

    useRegisterFlowStore.getState().setBusinessRegistrationFile(file)

    expect(useRegisterFlowStore.getState().businessRegistrationFile).toBe(file)
  })

  it('clearBusinessRegistrationFile()로 상태를 초기화한다', () => {
    const file = new File(['dummy'], '사업자등록증.pdf', { type: 'application/pdf' })
    useRegisterFlowStore.getState().setBusinessRegistrationFile(file)

    useRegisterFlowStore.getState().clearBusinessRegistrationFile()

    expect(useRegisterFlowStore.getState().businessRegistrationFile).toBeNull()
  })

  const BUSINESS_REGISTRATION_REVIEW: BusinessRegistrationReviewData = {
    registrationNumber: '123-45-67890',
    corporateName: '코리아석유',
    ceoName: '홍길동',
    corporateRegistrationNumber: '110111-1234567',
    businessAddress: '서울시 ...',
    businessType: '도매',
    businessItem: '석유제품',
    issueDate: '2020-01-01',
  }

  it('초기 상태는 businessRegistrationReview가 null이다', () => {
    expect(useRegisterFlowStore.getState().businessRegistrationReview).toBeNull()
  })

  it('setBusinessRegistrationReview()로 사업자등록증 분석 결과를 저장한다', () => {
    useRegisterFlowStore.getState().setBusinessRegistrationReview(BUSINESS_REGISTRATION_REVIEW)

    expect(useRegisterFlowStore.getState().businessRegistrationReview).toEqual(
      BUSINESS_REGISTRATION_REVIEW
    )
  })

  it('clearBusinessRegistrationReview()로 상태를 초기화한다', () => {
    useRegisterFlowStore.getState().setBusinessRegistrationReview(BUSINESS_REGISTRATION_REVIEW)

    useRegisterFlowStore.getState().clearBusinessRegistrationReview()

    expect(useRegisterFlowStore.getState().businessRegistrationReview).toBeNull()
  })

  it('초기 상태는 businessRegistrationS3Key가 null이다', () => {
    expect(useRegisterFlowStore.getState().businessRegistrationS3Key).toBeNull()
  })

  it('setBusinessRegistrationS3Key()로 S3 키를 저장한다', () => {
    useRegisterFlowStore
      .getState()
      .setBusinessRegistrationS3Key('PRODUCTION/BusinessRegistration/260901/xxxxxxxx.pdf')

    expect(useRegisterFlowStore.getState().businessRegistrationS3Key).toBe(
      'PRODUCTION/BusinessRegistration/260901/xxxxxxxx.pdf'
    )
  })

  it('clearBusinessRegistrationS3Key()로 상태를 초기화한다', () => {
    useRegisterFlowStore
      .getState()
      .setBusinessRegistrationS3Key('PRODUCTION/BusinessRegistration/260901/xxxxxxxx.pdf')

    useRegisterFlowStore.getState().clearBusinessRegistrationS3Key()

    expect(useRegisterFlowStore.getState().businessRegistrationS3Key).toBeNull()
  })

  it('resetRegisterFlow()로 모든 단계 값을 한 번에 초기화한다', () => {
    const store = useRegisterFlowStore.getState()
    store.setRegisterMethod('new')
    store.setIdentityVerifyResult(IDENTITY_VERIFY_RESULT, 'find-account')
    store.setIdentityVerificationCode('iv-id')
    store.setTermsAgreement({ marketingOptIn: true })
    store.setRegisterEmail('user@test.com')
    store.setRegisterEmailCode('123456')
    store.setInvitedOrgs(INVITED_ORGS)
    store.setRegisterPassword('password1!')
    store.setBusinessRegistrationFile(new File(['pdf'], 'biz.pdf', { type: 'application/pdf' }))
    store.setBusinessRegistrationReview(BUSINESS_REGISTRATION_REVIEW)
    store.setBusinessRegistrationS3Key('PRODUCTION/BusinessRegistration/260901/xxxxxxxx.pdf')

    store.resetRegisterFlow()

    expect(useRegisterFlowStore.getState()).toMatchObject({
      registerMethod: null,
      identityVerifyResult: null,
      identityVerifySource: null,
      identityVerificationCode: null,
      termsAgreement: null,
      registerEmail: null,
      registerEmailCode: null,
      invitedOrgs: null,
      registerPassword: null,
      businessRegistrationFile: null,
      businessRegistrationReview: null,
      businessRegistrationS3Key: null,
    })
  })
})
