import { beforeEach, describe, expect, it } from 'vitest'

import { getCookie } from '../utils/cookie'
import { useSavedEmailStore } from './savedEmailStore'

describe('savedEmailStore', () => {
  beforeEach(() => {
    // 각 테스트 전 쿠키 + store 초기화
    document.cookie = 'savedEmail=; max-age=0; path=/'
    useSavedEmailStore.setState({ savedEmail: null })
  })

  it('saveEmail()은 쿠키와 상태를 동시에 갱신한다', () => {
    useSavedEmailStore.getState().saveEmail('user@test.com')

    expect(getCookie('savedEmail')).toBe('user@test.com')
    expect(useSavedEmailStore.getState().savedEmail).toBe('user@test.com')
  })

  it('clearSavedEmail()은 쿠키 값과 상태를 모두 제거한다', () => {
    useSavedEmailStore.getState().saveEmail('user@test.com')

    useSavedEmailStore.getState().clearSavedEmail()

    expect(getCookie('savedEmail')).toBeNull()
    expect(useSavedEmailStore.getState().savedEmail).toBeNull()
  })

  it('saveEmail()로 저장한 값을 다시 saveEmail()로 덮어쓸 수 있다', () => {
    useSavedEmailStore.getState().saveEmail('first@test.com')
    useSavedEmailStore.getState().saveEmail('second@test.com')

    expect(getCookie('savedEmail')).toBe('second@test.com')
    expect(useSavedEmailStore.getState().savedEmail).toBe('second@test.com')
  })
})
