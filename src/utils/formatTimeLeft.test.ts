import { describe, expect, it } from 'vitest'

import { formatTimeLeft } from './formatTimeLeft'

describe('formatTimeLeft', () => {
  it("180초를 '03:00'으로 변환한다", () => {
    expect(formatTimeLeft(180)).toBe('03:00')
  })

  it("5초를 '00:05'로 변환한다(초 단위 zero-pad)", () => {
    expect(formatTimeLeft(5)).toBe('00:05')
  })

  it("0초를 '00:00'으로 변환한다", () => {
    expect(formatTimeLeft(0)).toBe('00:00')
  })
})
