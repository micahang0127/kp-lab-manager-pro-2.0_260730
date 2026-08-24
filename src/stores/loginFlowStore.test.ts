import { beforeEach, describe, expect, it } from 'vitest'

import { useLoginFlowStore } from './loginFlowStore'

describe('loginFlowStore', () => {
  beforeEach(() => {
    useLoginFlowStore.setState({ pending: null })
  })

  it('초기 상태는 pending이 null이다', () => {
    expect(useLoginFlowStore.getState().pending).toBeNull()
  })

  it('setPending()으로 이메일과 만료 시각을 저장한다', () => {
    useLoginFlowStore.getState().setPending({ email: 'user@test.com', expiresAt: 12345 })

    expect(useLoginFlowStore.getState().pending).toEqual({
      email: 'user@test.com',
      expiresAt: 12345,
    })
  })

  it('clearPending()으로 상태를 초기화한다', () => {
    useLoginFlowStore.getState().setPending({ email: 'user@test.com', expiresAt: 12345 })

    useLoginFlowStore.getState().clearPending()

    expect(useLoginFlowStore.getState().pending).toBeNull()
  })

  it('setPending()을 다시 호출하면 이전 값을 덮어쓴다', () => {
    useLoginFlowStore.getState().setPending({ email: 'first@test.com', expiresAt: 111 })
    useLoginFlowStore.getState().setPending({ email: 'second@test.com', expiresAt: 222 })

    expect(useLoginFlowStore.getState().pending).toEqual({
      email: 'second@test.com',
      expiresAt: 222,
    })
  })
})
