import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getStoredAccessToken,
  getTokenExpiry,
  isTokenExpired,
  isValidTokenFormat,
  removeStoredAccessToken,
} from './token'

// 만료되지 않은 유효한 JWT 토큰 (exp: 9999999999 = 2286년)
const VALID_JWT_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTl9.test'
// 만료된 JWT 토큰 (exp: 0 = 1970년)
const EXPIRED_JWT_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjB9.test'

describe('token', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getStoredAccessToken / removeStoredAccessToken', () => {
    it('저장된 토큰을 앞뒤 공백을 제거해 반환한다', () => {
      sessionStorage.setItem('accessToken', '  token-value  ')
      expect(getStoredAccessToken()).toBe('token-value')
    })

    it('토큰이 없으면 null을 반환한다', () => {
      expect(getStoredAccessToken()).toBeNull()
    })

    it('공백만 있는 토큰은 null로 취급한다', () => {
      sessionStorage.setItem('accessToken', '   ')
      expect(getStoredAccessToken()).toBeNull()
    })

    it('sessionStorage 접근 자체가 예외를 던지면 콘솔에 남기고 null을 반환한다', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('접근 차단됨')
      })

      expect(getStoredAccessToken()).toBeNull()
      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    it('removeStoredAccessToken은 sessionStorage에서 토큰을 제거한다', () => {
      sessionStorage.setItem('accessToken', VALID_JWT_TOKEN)
      removeStoredAccessToken()
      expect(sessionStorage.getItem('accessToken')).toBeNull()
    })

    it('removeStoredAccessToken은 sessionStorage 접근이 예외를 던져도 앱을 죽이지 않는다', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('접근 차단됨')
      })

      expect(() => removeStoredAccessToken()).not.toThrow()
      expect(consoleErrorSpy).toHaveBeenCalled()
    })
  })

  describe('isValidTokenFormat', () => {
    it('header.payload.signature 3부분으로 구성되면 유효하다', () => {
      expect(isValidTokenFormat(VALID_JWT_TOKEN)).toBe(true)
    })

    it('부분이 3개가 아니면 유효하지 않다', () => {
      expect(isValidTokenFormat('a.b')).toBe(false)
    })

    it('빈 부분이 있으면 유효하지 않다', () => {
      expect(isValidTokenFormat('a..b')).toBe(false)
    })
  })

  describe('getTokenExpiry / isTokenExpired', () => {
    it('exp claim을 Unix timestamp(초)로 반환한다', () => {
      expect(getTokenExpiry(VALID_JWT_TOKEN)).toBe(9999999999)
    })

    it('파싱에 실패하면 null을 반환한다', () => {
      expect(getTokenExpiry('not-a-jwt-token')).toBeNull()
    })

    it('exp가 미래면 만료되지 않은 것으로 판단한다', () => {
      expect(isTokenExpired(VALID_JWT_TOKEN)).toBe(false)
    })

    it('exp가 과거면 만료된 것으로 판단한다', () => {
      expect(isTokenExpired(EXPIRED_JWT_TOKEN)).toBe(true)
    })

    it('exp claim이 없거나 파싱에 실패하면 만료된 것으로 간주한다', () => {
      expect(isTokenExpired('not-a-jwt-token')).toBe(true)
    })
  })
})
