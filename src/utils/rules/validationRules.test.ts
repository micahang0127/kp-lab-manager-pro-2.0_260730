import { describe, expect, it } from 'vitest'

import {
  containsHangul,
  EMAIL_CODE_RULE_MESSAGE,
  EMAIL_RULE_MESSAGE,
  isValidEmail,
  isValidEmailCode,
  isValidPassword,
  PASSWORD_RULE_MESSAGE,
  removeHangul,
  sanitizePasswordInput,
} from './validationRules'

describe('validationRules', () => {
  describe('isValidEmail', () => {
    it('올바른 형식의 이메일은 통과한다', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('test.user+tag@example.co.kr')).toBe(true)
    })

    it('@가 없으면 실패한다', () => {
      expect(isValidEmail('testexample.com')).toBe(false)
    })

    it('도메인이 없으면 실패한다', () => {
      expect(isValidEmail('test@')).toBe(false)
    })

    it('최상위 도메인이 없으면 실패한다', () => {
      expect(isValidEmail('test@example')).toBe(false)
    })

    it('공백이 포함되면 실패한다', () => {
      expect(isValidEmail('test @example.com')).toBe(false)
    })
  })

  it('EMAIL_RULE_MESSAGE는 규칙 안내 문구를 담고 있다', () => {
    expect(EMAIL_RULE_MESSAGE).toContain('이메일')
  })

  describe('removeHangul', () => {
    it('한글 음절이 포함되면 제거한다', () => {
      expect(removeHangul('test한글@example.com')).toBe('test@example.com')
    })

    it('한글 자모가 포함되면 제거한다', () => {
      expect(removeHangul('testㄱㅏ@example.com')).toBe('test@example.com')
    })

    it('한글이 없으면 그대로 반환한다', () => {
      expect(removeHangul('test@example.com')).toBe('test@example.com')
    })
  })

  describe('containsHangul', () => {
    it('한글 음절이 포함되면 true를 반환한다', () => {
      expect(containsHangul('test한글')).toBe(true)
    })

    it('한글 자모가 포함되면 true를 반환한다', () => {
      expect(containsHangul('testㄱㅏ')).toBe(true)
    })

    it('한글이 없으면 false를 반환한다', () => {
      expect(containsHangul('test@example.com')).toBe(false)
    })

    it('반복 호출해도 정상적으로 동작한다 (전역 플래그 lastIndex 이슈 없음)', () => {
      expect(containsHangul('test한글')).toBe(true)
      expect(containsHangul('test한글')).toBe(true)
    })
  })

  describe('isValidPassword', () => {
    it('영문+숫자를 포함한 8자 이상은 통과한다', () => {
      expect(isValidPassword('abcdefg1')).toBe(true)
      expect(isValidPassword('Password1!')).toBe(true)
    })

    it('영문만 포함되면 실패한다 (숫자 미포함)', () => {
      expect(isValidPassword('abcdefgh')).toBe(false)
    })

    it('숫자만 포함되면 실패한다 (영문 미포함)', () => {
      expect(isValidPassword('12345678')).toBe(false)
    })

    it('특수문자만 포함되면 실패한다', () => {
      expect(isValidPassword('!@#$%^&*')).toBe(false)
    })

    it('8자 미만이면 실패한다', () => {
      expect(isValidPassword('ab1!')).toBe(false)
    })

    it('경계값 8자는 통과한다', () => {
      expect(isValidPassword('abcdefg1')).toBe(true)
    })

    it('한글이 포함되면 실패한다', () => {
      expect(isValidPassword('abcdefg1가')).toBe(false)
    })

    it('공백이 포함되면 실패한다', () => {
      expect(isValidPassword('abcd efg1')).toBe(false)
    })

    it('길이 상한 없이 통과한다 (최대 길이 제한 없음)', () => {
      expect(isValidPassword('a1'.repeat(50))).toBe(true)
    })
  })

  it('PASSWORD_RULE_MESSAGE는 규칙 안내 문구를 담고 있다', () => {
    expect(PASSWORD_RULE_MESSAGE).toContain('8자리 이상')
  })

  describe('sanitizePasswordInput', () => {
    it('한글이 포함되면 제거한다', () => {
      expect(sanitizePasswordInput('abc한글123')).toBe('abc123')
    })

    it('공백이 포함되면 제거한다', () => {
      expect(sanitizePasswordInput('abc 123')).toBe('abc123')
    })

    it('영문·숫자·특수문자는 그대로 유지한다', () => {
      expect(sanitizePasswordInput('Abc123!@#')).toBe('Abc123!@#')
    })
  })

  describe('isValidEmailCode', () => {
    it('숫자 6자리면 통과한다', () => {
      expect(isValidEmailCode('123456')).toBe(true)
    })

    it('6자리가 아니면 실패한다', () => {
      expect(isValidEmailCode('12345')).toBe(false)
      expect(isValidEmailCode('1234567')).toBe(false)
    })

    it('숫자가 아닌 문자가 포함되면 실패한다', () => {
      expect(isValidEmailCode('12345a')).toBe(false)
    })

    it('빈 문자열이면 실패한다', () => {
      expect(isValidEmailCode('')).toBe(false)
    })
  })

  it('EMAIL_CODE_RULE_MESSAGE는 규칙 안내 문구를 담고 있다', () => {
    expect(EMAIL_CODE_RULE_MESSAGE).toContain('인증번호')
  })
})
