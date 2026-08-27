import { beforeEach, describe, expect, it } from 'vitest'

import type { VerifyIdentityResult } from '../api/auth'
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
      termsAgreement: null,
      registerEmail: null,
      registerPassword: null,
      businessRegistrationFile: null,
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

  it('setIdentityVerifyResult()로 본인인증 결과를 저장한다', () => {
    useRegisterFlowStore.getState().setIdentityVerifyResult(IDENTITY_VERIFY_RESULT)

    expect(useRegisterFlowStore.getState().identityVerifyResult).toEqual(IDENTITY_VERIFY_RESULT)
  })

  it('clearIdentityVerifyResult()로 상태를 초기화한다', () => {
    useRegisterFlowStore.getState().setIdentityVerifyResult(IDENTITY_VERIFY_RESULT)

    useRegisterFlowStore.getState().clearIdentityVerifyResult()

    expect(useRegisterFlowStore.getState().identityVerifyResult).toBeNull()
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
})
