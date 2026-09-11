import { beforeEach, describe, expect, it } from 'vitest'

import { getStoredUserSession, removeStoredUserSession, setStoredUserSession } from './userSession'

const SESSION = {
  userIdx: '1',
  userName: '홍길동',
  orgIdx: '1',
  orgName: '테스트 회사',
  userGrade: 0,
}

describe('userSession', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('저장된 값이 없으면 null을 반환한다', () => {
    expect(getStoredUserSession()).toBeNull()
  })

  it('저장한 세션 정보를 그대로 읽어온다', () => {
    setStoredUserSession(SESSION)

    expect(getStoredUserSession()).toEqual(SESSION)
  })

  it('저장된 값이 올바른 JSON이 아니면 null을 반환한다', () => {
    sessionStorage.setItem('userSession', 'not-json')

    expect(getStoredUserSession()).toBeNull()
  })

  it('제거하면 이후 조회 시 null을 반환한다', () => {
    setStoredUserSession(SESSION)

    removeStoredUserSession()

    expect(getStoredUserSession()).toBeNull()
  })
})
