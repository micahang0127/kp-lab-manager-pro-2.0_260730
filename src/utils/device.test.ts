import { afterEach, describe, expect, it } from 'vitest'

import { getLoginDevice } from './device'

// ─── Helpers ───────────────────────────────────────────────────────────────────

function setInnerWidth(width: number): void {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width })
}

describe('getLoginDevice', () => {
  const originalWidth = window.innerWidth

  afterEach(() => {
    setInnerWidth(originalWidth)
  })

  it('360px~767px는 모바일(M)로 판단한다', () => {
    setInnerWidth(360)
    expect(getLoginDevice()).toBe('M')

    setInnerWidth(767)
    expect(getLoginDevice()).toBe('M')
  })

  it('768px~1023px는 태블릿(T)로 판단한다', () => {
    setInnerWidth(768)
    expect(getLoginDevice()).toBe('T')

    setInnerWidth(1023)
    expect(getLoginDevice()).toBe('T')
  })

  it('1024px 이상은 웹(W)로 판단한다', () => {
    setInnerWidth(1024)
    expect(getLoginDevice()).toBe('W')

    setInnerWidth(1920)
    expect(getLoginDevice()).toBe('W')
  })
})
