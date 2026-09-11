import { beforeEach, describe, expect, it, vi } from 'vitest'

// TanStack Router의 redirect를 목킹 — 실제 반환값(Response)의 내부 구조에 의존하지 않고
// 어떤 경로로 리디렉션하는지만 검증한다 (requireAuth.test.ts와 동일한 방식)
vi.mock('@tanstack/react-router', () => ({
  redirect: vi.fn((opts: { to: string }) => opts),
}))

import { useRegisterFlowStore } from '../stores/registerFlowStore'
import { redirectIfIdentityVerifiedInFindAccount } from './registerFlowGuard'

const IDENTITY_VERIFY_RESULT = {
  isVerified: true,
  hasExistingAccount: false,
  maskedName: '홍길*',
}

describe('redirectIfIdentityVerifiedInFindAccount', () => {
  beforeEach(() => {
    useRegisterFlowStore.getState().resetRegisterFlow()
  })

  it('본인인증을 하지 않은 상태면 리디렉션하지 않는다', () => {
    expect(redirectIfIdentityVerifiedInFindAccount()).toBeUndefined()
  })

  it("회원가입 2단계에서 직접 본인인증한 경우(출처 'register') 리디렉션하지 않는다 — 순서대로 2·3단계를 거쳐야 한다", () => {
    useRegisterFlowStore.getState().setIdentityVerifyResult(IDENTITY_VERIFY_RESULT, 'register')

    expect(redirectIfIdentityVerifiedInFindAccount()).toBeUndefined()
  })

  it("아이디·비밀번호 찾기에서 본인인증한 경우(출처 'find-account') 4단계(약관 동의)로 리디렉션한다", () => {
    useRegisterFlowStore.getState().setIdentityVerifyResult(IDENTITY_VERIFY_RESULT, 'find-account')

    expect(redirectIfIdentityVerifiedInFindAccount()).toEqual({ to: '/register-terms' })
  })
})
