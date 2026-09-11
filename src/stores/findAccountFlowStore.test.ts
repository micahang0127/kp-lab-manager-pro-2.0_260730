import { beforeEach, describe, expect, it } from 'vitest'

import { useFindAccountFlowStore } from './findAccountFlowStore'

const VERIFIED_IDENTITY = {
  result: { isVerified: true, hasExistingAccount: false, maskedName: '홍길*' },
  identityVerificationCode: 'iv-1234',
}

describe('findAccountFlowStore', () => {
  beforeEach(() => {
    useFindAccountFlowStore.setState({ verifiedIdentity: null })
  })

  it('초기 상태는 verifiedIdentity가 null이다', () => {
    expect(useFindAccountFlowStore.getState().verifiedIdentity).toBeNull()
  })

  it('setVerifiedIdentity()로 본인인증 결과를 저장한다', () => {
    useFindAccountFlowStore.getState().setVerifiedIdentity(VERIFIED_IDENTITY)

    expect(useFindAccountFlowStore.getState().verifiedIdentity).toEqual(VERIFIED_IDENTITY)
  })

  it('clearVerifiedIdentity()로 상태를 초기화한다', () => {
    useFindAccountFlowStore.getState().setVerifiedIdentity(VERIFIED_IDENTITY)

    useFindAccountFlowStore.getState().clearVerifiedIdentity()

    expect(useFindAccountFlowStore.getState().verifiedIdentity).toBeNull()
  })

  it('setVerifiedIdentity()를 다시 호출하면 이전 값을 덮어쓴다', () => {
    useFindAccountFlowStore.getState().setVerifiedIdentity(VERIFIED_IDENTITY)
    useFindAccountFlowStore.getState().setVerifiedIdentity({
      ...VERIFIED_IDENTITY,
      identityVerificationCode: 'iv-5678',
    })

    expect(useFindAccountFlowStore.getState().verifiedIdentity).toEqual({
      ...VERIFIED_IDENTITY,
      identityVerificationCode: 'iv-5678',
    })
  })
})
