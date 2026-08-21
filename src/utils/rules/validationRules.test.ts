import { describe, expect, it } from 'vitest'

import {
  BUSINESS_NUMBER_RULE_MESSAGE,
  BUSINESS_REGISTRATION_FILE_MAX_SIZE_BYTES,
  BUSINESS_REGISTRATION_FILE_RULE_MESSAGE,
  containsHangul,
  EMAIL_CODE_RULE_MESSAGE,
  EMAIL_RULE_MESSAGE,
  isValidBusinessNumber,
  isValidBusinessRegistrationFile,
  isValidEmail,
  isValidEmailCode,
  isValidPassword,
  isValidRepresentativeName,
  PASSWORD_RULE_MESSAGE,
  removeHangul,
  REPRESENTATIVE_NAME_RULE_MESSAGE,
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

  describe('isValidBusinessNumber', () => {
    it('하이픈을 포함한 10자리 숫자는 통과한다', () => {
      expect(isValidBusinessNumber('123-45-67890')).toBe(true)
    })

    it('하이픈 없는 10자리 숫자도 통과한다', () => {
      expect(isValidBusinessNumber('1234567890')).toBe(true)
    })

    it('자릿수가 부족하면 실패한다', () => {
      expect(isValidBusinessNumber('123-45-6789')).toBe(false)
    })

    it('숫자 이외의 문자가 포함되면 실패한다', () => {
      expect(isValidBusinessNumber('123-45-abcde')).toBe(false)
    })

    it('빈 문자열은 실패한다', () => {
      expect(isValidBusinessNumber('')).toBe(false)
    })
  })

  it('BUSINESS_NUMBER_RULE_MESSAGE는 규칙 안내 문구를 담고 있다', () => {
    expect(BUSINESS_NUMBER_RULE_MESSAGE).toContain('사업자등록번호')
  })

  describe('isValidRepresentativeName', () => {
    it('한글 이름은 통과한다', () => {
      expect(isValidRepresentativeName('홍길동')).toBe(true)
    })

    it('영문 이름은 통과한다', () => {
      expect(isValidRepresentativeName('John Smith')).toBe(true)
    })

    it('숫자가 포함되어도 통과한다 (공동대표 번호 표기 대응)', () => {
      expect(isValidRepresentativeName('1 홍길동 2 김철수')).toBe(true)
    })

    it('공백/하이픈/따옴표가 포함되어도 통과한다', () => {
      expect(isValidRepresentativeName("O'Brien-Kim")).toBe(true)
    })

    it('앞뒤 공백은 제거한 뒤 검사한다', () => {
      expect(isValidRepresentativeName('  홍길동  ')).toBe(true)
    })

    it('앞뒤 공백을 제거하고 2자 미만이면 실패한다', () => {
      expect(isValidRepresentativeName(' 홍 ')).toBe(false)
    })

    it('50자를 초과하면 실패한다', () => {
      expect(isValidRepresentativeName('가'.repeat(51))).toBe(false)
    })

    it('괄호·쉼표·마침표·가운뎃점·슬래시가 포함되어도 통과한다', () => {
      expect(isValidRepresentativeName('홍길동(대표)')).toBe(true)
      expect(isValidRepresentativeName('홍길동, 김철수')).toBe(true)
      expect(isValidRepresentativeName('홍길동·김철수')).toBe(true)
    })

    it('허용되지 않는 특수문자가 포함되면 실패한다', () => {
      expect(isValidRepresentativeName('홍길동@대표')).toBe(false)
    })

    it('숫자·기호만으로는 실패한다 (한글/영문 미포함)', () => {
      expect(isValidRepresentativeName('123')).toBe(false)
      expect(isValidRepresentativeName('1-2')).toBe(false)
    })

    it('빈 문자열은 실패한다', () => {
      expect(isValidRepresentativeName('')).toBe(false)
    })
  })

  it('REPRESENTATIVE_NAME_RULE_MESSAGE는 규칙 안내 문구를 담고 있다', () => {
    expect(REPRESENTATIVE_NAME_RULE_MESSAGE).toContain('대표자명')
  })

  describe('isValidBusinessRegistrationFile', () => {
    it('PDF 파일은 통과한다', () => {
      expect(
        isValidBusinessRegistrationFile(
          new File(['dummy'], 'license.pdf', { type: 'application/pdf' })
        )
      ).toBe(true)
    })

    it('이미지 파일(JPG, PNG)이면 실패한다', () => {
      expect(
        isValidBusinessRegistrationFile(new File(['dummy'], 'license.jpg', { type: 'image/jpeg' }))
      ).toBe(false)
      expect(
        isValidBusinessRegistrationFile(new File(['dummy'], 'license.png', { type: 'image/png' }))
      ).toBe(false)
    })

    it('허용되지 않는 형식이면 실패한다', () => {
      expect(
        isValidBusinessRegistrationFile(
          new File(['dummy'], 'license.hwp', { type: 'application/x-hwp' })
        )
      ).toBe(false)
    })

    it('용량이 상한을 초과하면 실패한다', () => {
      const oversized = new File(
        [new Uint8Array(BUSINESS_REGISTRATION_FILE_MAX_SIZE_BYTES + 1)],
        'license.pdf',
        {
          type: 'application/pdf',
        }
      )
      expect(isValidBusinessRegistrationFile(oversized)).toBe(false)
    })

    it('빈 파일(용량 0바이트)은 실패한다', () => {
      expect(
        isValidBusinessRegistrationFile(new File([], 'license.pdf', { type: 'application/pdf' }))
      ).toBe(false)
    })
  })

  it('BUSINESS_REGISTRATION_FILE_RULE_MESSAGE는 규칙 안내 문구를 담고 있다', () => {
    expect(BUSINESS_REGISTRATION_FILE_RULE_MESSAGE).toContain('PDF')
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
