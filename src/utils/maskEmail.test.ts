import { describe, expect, it } from 'vitest'

import { maskEmail } from './maskEmail'

describe('maskEmail', () => {
  it('로컬 파트와 도메인 이름을 앞 2글자만 남기고 마스킹하며 TLD는 그대로 노출한다', () => {
    expect(maskEmail('hodong@koreapetroleum.com')).toBe('ho****@ko************.com')
  })

  it('로컬 파트/도메인 이름이 2글자 이하면 마스킹하지 않는다', () => {
    expect(maskEmail('ab@co.com')).toBe('ab@co.com')
  })

  it('TLD가 없는 도메인은 도메인 전체를 마스킹한다', () => {
    expect(maskEmail('hodong@localhost')).toBe('ho****@lo*******')
  })

  it("'@'가 없으면 원본을 그대로 반환한다", () => {
    expect(maskEmail('invalid-email')).toBe('invalid-email')
  })

  it("'@'로 시작하거나 끝나면 원본을 그대로 반환한다", () => {
    expect(maskEmail('@koreapetroleum.com')).toBe('@koreapetroleum.com')
    expect(maskEmail('hodong@')).toBe('hodong@')
  })
})
