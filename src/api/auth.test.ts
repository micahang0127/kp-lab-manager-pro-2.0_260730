import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import { server } from '../test/mocks/server'
import { sendRegisterEmailCode, verifyIdentity, verifyRegisterEmailCode } from './auth'

describe('verifyIdentity', () => {
  beforeEach(() => {
    sessionStorage.clear()
    server.resetHandlers()
  })

  it('본인인증에 성공하고 가입된 계정이 없으면 마스킹된 개인정보를 반환한다', async () => {
    server.use(
      http.post('*/v1/user/identity/verify', () =>
        HttpResponse.json({
          result: true,
          statusCode: 201,
          data: {
            isVerified: true,
            hasExistingAccount: false,
            maskedName: '홍길*',
            maskedBirth: '1990-**-**',
            maskedMobile: '010-**-5678',
            gender: 'M',
          },
          message: [],
        })
      )
    )

    const res = await verifyIdentity({ identityVerificationId: 'iv-id' })

    expect(res.result).toBe(true)
    expect(res.data?.isVerified).toBe(true)
    expect(res.data?.hasExistingAccount).toBe(false)
    expect(res.data?.maskedName).toBe('홍길*')
    expect(res.data?.existingEmail).toBeUndefined()
  })

  it('본인인증에 성공하고 가입된 계정이 있으면 마스킹된 기존 계정 이메일을 반환한다', async () => {
    server.use(
      http.post('*/v1/user/identity/verify', () =>
        HttpResponse.json({
          result: true,
          statusCode: 201,
          data: {
            isVerified: true,
            hasExistingAccount: true,
            existingEmail: 'fu******@gmail.com',
          },
          message: [],
        })
      )
    )

    const res = await verifyIdentity({ identityVerificationId: 'iv-id' })

    expect(res.data?.hasExistingAccount).toBe(true)
    expect(res.data?.existingEmail).toBe('fu******@gmail.com')
    expect(res.data?.maskedName).toBeUndefined()
  })

  it('포트원 본인인증 자체가 실패하면 isVerified: false를 반환한다', async () => {
    server.use(
      http.post('*/v1/user/identity/verify', () =>
        HttpResponse.json({
          result: true,
          statusCode: 201,
          data: { isVerified: false },
          message: [],
        })
      )
    )

    const res = await verifyIdentity({ identityVerificationId: 'iv-id' })

    expect(res.data?.isVerified).toBe(false)
  })

  it('요청 값 검증 실패 시 에러를 던진다', async () => {
    server.use(
      http.post('*/v1/user/identity/verify', () =>
        HttpResponse.json(
          {
            result: false,
            statusCode: 400,
            data: null,
            message: ['identityVerificationId는 필수입니다.'],
          },
          { status: 400 }
        )
      )
    )

    await expect(verifyIdentity({ identityVerificationId: '' })).rejects.toThrow(
      'identityVerificationId는 필수입니다.'
    )
  })
})

describe('sendRegisterEmailCode', () => {
  beforeEach(() => {
    server.resetHandlers()
  })

  it('인증코드 발송에 성공하면 success: true를 반환한다', async () => {
    server.use(
      http.post('*/v1/user/email/sendCode', () =>
        HttpResponse.json({
          result: true,
          statusCode: 201,
          data: { success: true },
          message: [],
        })
      )
    )

    const res = await sendRegisterEmailCode({ email: 'user@koreapetroleum.com' })

    expect(res.result).toBe(true)
    expect(res.data?.success).toBe(true)
  })

  it('하루 발송 횟수(5회)를 초과하면 에러를 던진다', async () => {
    server.use(
      http.post('*/v1/user/email/sendCode', () =>
        HttpResponse.json(
          {
            result: false,
            statusCode: 400,
            data: null,
            message: ['하루 발송 횟수를 초과했습니다.'],
          },
          { status: 400 }
        )
      )
    )

    await expect(sendRegisterEmailCode({ email: 'user@koreapetroleum.com' })).rejects.toThrow(
      '하루 발송 횟수를 초과했습니다.'
    )
  })
})

describe('verifyRegisterEmailCode', () => {
  beforeEach(() => {
    server.resetHandlers()
  })

  it('인증코드가 일치하면 success: true를 반환한다', async () => {
    server.use(
      http.post('*/v1/user/email/verifyCode', () =>
        HttpResponse.json({
          result: true,
          statusCode: 201,
          data: { success: true },
          message: [],
        })
      )
    )

    const res = await verifyRegisterEmailCode({
      email: 'user@koreapetroleum.com',
      code: '123456',
    })

    expect(res.result).toBe(true)
    expect(res.data?.success).toBe(true)
  })

  it('인증코드가 일치하지 않으면 에러를 던진다', async () => {
    server.use(
      http.post('*/v1/user/email/verifyCode', () =>
        HttpResponse.json(
          {
            result: false,
            statusCode: 400,
            data: null,
            message: ['인증코드가 일치하지 않습니다.'],
          },
          { status: 400 }
        )
      )
    )

    await expect(
      verifyRegisterEmailCode({ email: 'user@koreapetroleum.com', code: '000000' })
    ).rejects.toThrow('인증코드가 일치하지 않습니다.')
  })
})
