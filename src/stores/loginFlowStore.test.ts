import { beforeEach, describe, expect, it } from 'vitest'

import { useLoginFlowStore } from './loginFlowStore'

const PENDING = {
  email: 'user@test.com',
  password: 'password1',
  fingerprintCode: 'fp-1234',
  device: 'W' as const,
}

describe('loginFlowStore', () => {
  beforeEach(() => {
    useLoginFlowStore.setState({ pending: null })
  })

  it('초기 상태는 pending이 null이다', () => {
    expect(useLoginFlowStore.getState().pending).toBeNull()
  })

  it('setPending()으로 2차 인증에 필요한 값을 저장한다', () => {
    useLoginFlowStore.getState().setPending(PENDING)

    expect(useLoginFlowStore.getState().pending).toEqual(PENDING)
  })

  it('clearPending()으로 상태를 초기화한다', () => {
    useLoginFlowStore.getState().setPending(PENDING)

    useLoginFlowStore.getState().clearPending()

    expect(useLoginFlowStore.getState().pending).toBeNull()
  })

  it('setPending()을 다시 호출하면 이전 값을 덮어쓴다', () => {
    useLoginFlowStore.getState().setPending({ ...PENDING, email: 'first@test.com' })
    useLoginFlowStore.getState().setPending({ ...PENDING, email: 'second@test.com' })

    expect(useLoginFlowStore.getState().pending).toEqual({ ...PENDING, email: 'second@test.com' })
  })
})
