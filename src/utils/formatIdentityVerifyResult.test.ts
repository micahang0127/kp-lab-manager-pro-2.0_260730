import { describe, expect, it } from 'vitest'

import type { VerifyIdentityResult } from '../api/auth'
import { formatMaskedIdentity } from './formatIdentityVerifyResult'

describe('formatMaskedIdentity', () => {
  it('마스킹된 이름·생년월일·성별·휴대폰번호를 표시용 구분자로 합친다', () => {
    const result: VerifyIdentityResult = {
      isVerified: true,
      hasExistingAccount: false,
      maskedName: '홍길*',
      maskedBirth: '1990-**-**',
      maskedMobile: '010-**-5678',
      gender: 'M',
    }

    expect(formatMaskedIdentity(result)).toBe('홍길*  /  1990.**.**  /  남성  /  010 - ** - 5678')
  })

  it('성별이 F이면 "여성"으로 표시한다', () => {
    expect(formatMaskedIdentity({ isVerified: true, gender: 'F', maskedName: '김철*' })).toContain(
      '여성'
    )
  })

  it('가입된 계정이 있는 경우처럼 마스킹 필드가 없으면 빈 문자열을 반환한다', () => {
    expect(
      formatMaskedIdentity({
        isVerified: true,
        hasExistingAccount: true,
        existingEmail: 'fu******@gmail.com',
      })
    ).toBe('')
  })
})
