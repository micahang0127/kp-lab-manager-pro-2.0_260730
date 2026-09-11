import { describe, expect, it } from 'vitest'

import { ApiError } from '../api'
import { getFieldErrors } from './apiError'

describe('getFieldErrors', () => {
  it('fieldErrors에 해당 필드가 있으면 메시지 배열을 반환한다', () => {
    const error = new ApiError('입력값을 확인해주세요.', 400, {
      email: ['이메일 형식이 올바르지 않습니다.'],
    })

    expect(getFieldErrors(error, 'email')).toEqual(['이메일 형식이 올바르지 않습니다.'])
  })

  it('fieldErrors는 있지만 해당 필드가 없으면 undefined를 반환한다', () => {
    const error = new ApiError('입력값을 확인해주세요.', 400, {
      email: ['이메일 형식이 올바르지 않습니다.'],
    })

    expect(getFieldErrors(error, 'password')).toBeUndefined()
  })

  it('fieldErrors 자체가 없는 ApiError(서비스 로직 에러)면 undefined를 반환한다', () => {
    const error = new ApiError('발송 횟수를 초과했습니다.', 400)

    expect(getFieldErrors(error, 'email')).toBeUndefined()
  })

  it('ApiError가 아닌 일반 Error(네트워크 실패 등)면 undefined를 반환한다', () => {
    const error = new Error('일시적인 오류가 발생했습니다.')

    expect(getFieldErrors(error, 'email')).toBeUndefined()
  })
})
