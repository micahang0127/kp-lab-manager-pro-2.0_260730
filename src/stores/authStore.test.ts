import { beforeEach, describe, expect, it } from 'vitest'

import { useAuthStore } from './authStore'

describe('authStore', () => {
  beforeEach(() => {
    // 각 테스트 전 sessionStorage + store 초기화
    sessionStorage.clear()
    // store를 초기 상태로 리셋
    useAuthStore.setState({
      isLoggedIn: false,
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
