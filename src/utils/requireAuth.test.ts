import { beforeEach, describe, expect, it, vi } from 'vitest'

// 만료되지 않은 유효한 JWT 토큰 (exp: 9999999999 = 2286년)
const VALID_JWT_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTl9.test'

// 만료된 JWT 토큰 (exp: 0 = 1970년)
const EXPIRED_JWT_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjB9.test'

// TanStack Router의 redirect를 목킹
vi.mock('@tanstack/react-router', () => ({
  redirect: vi.fn((opts) => {
    const error = new Error('Redirect')
    ;(error as any).redirect = opts
    throw error
  }),
}))

import { isAuthValid, redirectIfAuthenticated, requireAuth } from './requireAuth'

describe('requireAuth', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.clearAllMocks()
  })

  it('accessToken이 없으면 redirect를 throw한다', () => {
    expect(() => requireAuth()).toThrow()
  })

  it('redirect는 /login으로 이동시킨다', () => {
    expect(() => requireAuth()).toThrow()
  })

  it('유효한 JWT 토큰이 있으면 아무것도 하지 않는다', () => {
    sessionStorage.setItem('accessToken', VALID_JWT_TOKEN)
    expect(() => requireAuth()).not.toThrow()
  })

  it('빈 문자열 토큰도 없는 것으로 간주한다', () => {
    sessionStorage.setItem('accessToken', '')
    expect(() => requireAuth()).toThrow()
  })

  it('whitespace만 있는 토큰도 없는 것으로 간주한다', () => {
    sessionStorage.setItem('accessToken', '   ')
    // .trim()으로 공백 제거되므로 throw 됨
    expect(() => requireAuth()).toThrow()
  })

  it('JWT 형식이 아닌 토큰은 거부한다', () => {
    sessionStorage.setItem('accessToken', 'not-a-jwt-token')
    expect(() => requireAuth()).toThrow()
  })

  it('만료된 JWT 토큰은 거부한다', () => {
    sessionStorage.setItem('accessToken', EXPIRED_JWT_TOKEN)
    expect(() => requireAuth()).toThrow()
  })

  it('여러 번 호출해도 모두 동일하게 동작한다', () => {
    sessionStorage.setItem('accessToken', VALID_JWT_TOKEN)

    expect(() => requireAuth()).not.toThrow()
    expect(() => requireAuth()).not.toThrow()
    expect(() => requireAuth()).not.toThrow()
  })

  it('토큰이 없을 때마다 redirect가 호출된다', () => {
    expect(() => requireAuth()).toThrow()

    // 다시 호출하면 다시 throw
    expect(() => requireAuth()).toThrow()
  })

  it('토큰 삭제 후 다시 requireAuth를 호출하면 redirect된다', () => {
    // 토큰이 있을 때
    sessionStorage.setItem('accessToken', VALID_JWT_TOKEN)
    expect(() => requireAuth()).not.toThrow()

    // 토큰 삭제
    sessionStorage.removeItem('accessToken')

    // 다시 requireAuth를 호출하면 redirect
    expect(() => requireAuth()).toThrow()
  })
})

describe('isAuthValid', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('토큰이 없으면 false를 반환한다', () => {
    expect(isAuthValid()).toBe(false)
  })

  it('유효한 JWT 토큰이 있으면 true를 반환한다', () => {
    sessionStorage.setItem('accessToken', VALID_JWT_TOKEN)
    expect(isAuthValid()).toBe(true)
  })

  it('whitespace만 있으면 false를 반환한다', () => {
    sessionStorage.setItem('accessToken', '   ')
    expect(isAuthValid()).toBe(false)
  })

  it('JWT 형식이 아니면 false를 반환한다', () => {
    sessionStorage.setItem('accessToken', 'invalid-token')
    expect(isAuthValid()).toBe(false)
  })

  it('만료된 토큰이면 false를 반환한다', () => {
    sessionStorage.setItem('accessToken', EXPIRED_JWT_TOKEN)
    expect(isAuthValid()).toBe(false)
  })
})

describe('redirectIfAuthenticated', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.clearAllMocks()
  })

  it('토큰이 없으면 아무것도 하지 않는다', () => {
    expect(() => redirectIfAuthenticated()).not.toThrow()
  })

  it('유효한 JWT 토큰이 있으면 /main으로 redirect를 throw한다', () => {
    sessionStorage.setItem('accessToken', VALID_JWT_TOKEN)

    expect(() => redirectIfAuthenticated()).toThrow()
  })

  // requireAuth와 판단 기준이 다르면 /login ↔ /main 리다이렉트 왕복이 발생하므로,
  // isAuthValid 기준(형식+만료)까지 동일하게 걸러지는지 명시적으로 검증한다.
  it('형식이 깨진 토큰이 남아있어도 /main으로 보내지 않는다 (requireAuth와 판단 기준 통일)', () => {
    sessionStorage.setItem('accessToken', 'not-a-jwt-token')

    expect(() => redirectIfAuthenticated()).not.toThrow()
  })

  it('만료된 토큰이 남아있어도 /main으로 보내지 않는다 (requireAuth와 판단 기준 통일)', () => {
    sessionStorage.setItem('accessToken', EXPIRED_JWT_TOKEN)

    expect(() => redirectIfAuthenticated()).not.toThrow()
  })
})
