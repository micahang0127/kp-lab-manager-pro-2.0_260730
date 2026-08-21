import { beforeEach, describe, expect, it } from 'vitest'

import { getCookie, removeCookie, setCookie } from './cookie'

describe('cookie', () => {
  beforeEach(() => {
    // 테스트 간 쿠키 격리
    document.cookie = 'test-key=; max-age=0; path=/'
  })

  it('setCookie()로 저장한 값을 getCookie()로 읽을 수 있다', () => {
    setCookie('test-key', 'test-value', 60)

    expect(getCookie('test-key')).toBe('test-value')
  })

  it('저장되지 않은 키를 조회하면 null을 반환한다', () => {
    expect(getCookie('unknown-key')).toBeNull()
  })

  it('URL 인코딩이 필요한 값(공백, 한글 등)도 원래 값 그대로 왕복한다', () => {
    setCookie('test-key', 'a@b.com; 한글 값', 60)

    expect(getCookie('test-key')).toBe('a@b.com; 한글 값')
  })

  it('removeCookie()를 호출하면 해당 값이 삭제된다', () => {
    setCookie('test-key', 'test-value', 60)

    removeCookie('test-key')

    expect(getCookie('test-key')).toBeNull()
  })

  it('setCookie()로 같은 키를 다시 저장하면 값이 덮어써진다', () => {
    setCookie('test-key', 'first', 60)
    setCookie('test-key', 'second', 60)

    expect(getCookie('test-key')).toBe('second')
  })
})
