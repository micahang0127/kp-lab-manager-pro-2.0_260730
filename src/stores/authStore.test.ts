import { beforeEach, describe, expect, it } from 'vitest'

import { useAuthStore } from './authStore'

const SESSION = {
  userIdx: '1',
  userName: '홍길동',
  orgIdx: '1',
  orgName: '테스트 회사',
  userGrade: 0,
}

describe('authStore', () => {
  beforeEach(() => {
    // 각 테스트 전 sessionStorage + store 초기화
    sessionStorage.clear()
    // store를 초기 상태로 리셋
    useAuthStore.setState({
      isLoggedIn: false,
      userSession: null,
    })
  })

  it('setLoggedIn(true)는 isLoggedIn을 true로 만든다', () => {
    useAuthStore.getState().setLoggedIn(true)
    expect(useAuthStore.getState().isLoggedIn).toBe(true)
  })

  it('setLoggedIn(false)는 isLoggedIn을 false로 만든다', () => {
    useAuthStore.setState({ isLoggedIn: true })

    useAuthStore.getState().setLoggedIn(false)
    expect(useAuthStore.getState().isLoggedIn).toBe(false)
  })

  it('logout()은 sessionStorage의 accessToken을 제거한다', () => {
    sessionStorage.setItem('accessToken', 'mock-token')
    useAuthStore.setState({ isLoggedIn: true })

    useAuthStore.getState().logout()

    expect(sessionStorage.getItem('accessToken')).toBeNull()
  })

  it('logout()은 isLoggedIn을 false로 만든다', () => {
    useAuthStore.setState({ isLoggedIn: true })
    sessionStorage.setItem('accessToken', 'mock-token')

    useAuthStore.getState().logout()

    expect(useAuthStore.getState().isLoggedIn).toBe(false)
  })

  it('logout()은 accessToken 제거와 isLoggedIn을 동시에 처리한다', () => {
    sessionStorage.setItem('accessToken', 'mock-token')
    useAuthStore.setState({ isLoggedIn: true })

    useAuthStore.getState().logout()

    expect(useAuthStore.getState().isLoggedIn).toBe(false)
    expect(sessionStorage.getItem('accessToken')).toBeNull()
  })

  it('login()은 accessToken과 사용자 세션을 sessionStorage에 저장하고 로그인 상태로 만든다', () => {
    useAuthStore.getState().login('access-token-abc', SESSION)

    expect(useAuthStore.getState().isLoggedIn).toBe(true)
    expect(useAuthStore.getState().userSession).toEqual(SESSION)
    expect(sessionStorage.getItem('accessToken')).toBe('access-token-abc')
    expect(JSON.parse(sessionStorage.getItem('userSession') ?? 'null')).toEqual(SESSION)
  })

  it('logout()은 userSession도 함께 제거한다', () => {
    useAuthStore.getState().login('access-token-abc', SESSION)

    useAuthStore.getState().logout()

    expect(useAuthStore.getState().userSession).toBeNull()
    expect(sessionStorage.getItem('userSession')).toBeNull()
  })

  it('스토어는 여러 상태 변경을 지원한다', () => {
    // 로그인 흐름 시뮬레이션
    expect(useAuthStore.getState().isLoggedIn).toBe(false)

    // 로그인
    useAuthStore.getState().setLoggedIn(true)
    expect(useAuthStore.getState().isLoggedIn).toBe(true)

    // 로그아웃
    useAuthStore.getState().logout()
    expect(useAuthStore.getState().isLoggedIn).toBe(false)
  })
})
