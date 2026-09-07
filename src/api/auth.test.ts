import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import { server } from '../test/mocks/server'
import { sendEmailVerificationCode, verifyIdentity, verifyRegisterEmailCode } from './auth'

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

describe('sendEmailVerificationCode', () => {
  beforeEach(() => {
    server.resetHandlers()
  })

  it("회원가입용(authType: '0') 인증코드 발송에 성공하면 success: true를 반환한다", async () => {
    server.use(
      http.post('*/v1/user/email/sendCode', () =>
        HttpResponse.json({
          result: true,
          statusCode: 201,
          data: { success: true },
          message: null,
        })
      )
    )

    const res = await sendEmailVerificationCode({
      email: 'user@koreapetroleum.com',
      authType: '0',
      fingerprintCode: 'fp-1234',
    })

    expect(res.result).toBe(true)
    expect(res.data?.success).toBe(true)
  })

  it("로그인 2차 인증용(authType: '1') 인증코드 발송에 성공하면 success: true를 반환한다", async () => {
    server.use(
      http.post('*/v1/user/email/sendCode', () =>
        HttpResponse.json({
          result: true,
          statusCode: 201,
          data: { success: true },
          message: null,
        })
      )
    )

    const res = await sendEmailVerificationCode({
      email: 'user@koreapetroleum.com',
      authType: '1',
    })

    expect(res.result).toBe(true)
    expect(res.data?.success).toBe(true)
  })

  it('DTO 검증 실패(이메일 형식 오류)면 400과 함께 필드별 메시지 중 해당 필드 메시지를 던진다', async () => {
    server.use(
      http.post('*/v1/user/email/sendCode', () =>
        HttpResponse.json(
          {
            result: false,
            statusCode: 400,
            data: null,
            message: { email: ['올바른 이메일 형식이 아닙니다'] },
          },
          { status: 400 }
        )
      )
    )

    await expect(
      sendEmailVerificationCode({
        email: 'invalid-email',
        authType: '0',
        fingerprintCode: 'fp-1234',
      })
    ).rejects.toThrow('올바른 이메일 형식이 아닙니다')
  })

  it('회원가입인데 fingerprintCode가 없으면(서비스 로직 검증) 400과 함께 문자열 배열 메시지를 던진다', async () => {
    server.use(
      http.post('*/v1/user/email/sendCode', () =>
        HttpResponse.json(
          {
            result: false,
            statusCode: 400,
            data: null,
            message: ['브라우저 지문 코드를 입력해주세요'],
          },
          { status: 400 }
        )
      )
    )

    await expect(
      sendEmailVerificationCode({ email: 'user@koreapetroleum.com', authType: '0' })
    ).rejects.toThrow('브라우저 지문 코드를 입력해주세요')
  })

  it('회원가입은 같은 이메일+fingerprintCode 기준 24시간 안에 5회를 초과하면 409와 함께 에러를 던진다', async () => {
    server.use(
      http.post('*/v1/user/email/sendCode', () =>
        HttpResponse.json(
          {
            result: false,
            statusCode: 409,
            data: null,
            message: [
              '인증코드 발송 횟수(5회)를 초과했습니다. 마지막 발송 후 24시간이 지나면 다시 요청할 수 있습니다',
            ],
          },
          { status: 409 }
        )
      )
    )

    await expect(
      sendEmailVerificationCode({
        email: 'user@koreapetroleum.com',
        authType: '0',
        fingerprintCode: 'fp-1234',
      })
    ).rejects.toThrow(
      '인증코드 발송 횟수(5회)를 초과했습니다. 마지막 발송 후 24시간이 지나면 다시 요청할 수 있습니다'
    )
  })

  it('로그인 2차 인증은 같은 이메일 기준 1시간 안에 5회를 초과하면 409와 함께 에러를 던진다', async () => {
    server.use(
      http.post('*/v1/user/email/sendCode', () =>
        HttpResponse.json(
          {
            result: false,
            statusCode: 409,
            data: null,
            message: [
              '인증코드 발송 횟수(5회)를 초과했습니다. 마지막 발송 후 1시간이 지나면 다시 요청할 수 있습니다',
            ],
          },
          { status: 409 }
        )
      )
    )

    await expect(
      sendEmailVerificationCode({ email: 'user@koreapetroleum.com', authType: '1' })
    ).rejects.toThrow(
      '인증코드 발송 횟수(5회)를 초과했습니다. 마지막 발송 후 1시간이 지나면 다시 요청할 수 있습니다'
    )
  })

  it('서버 내부 오류(DB·메일 발송 실패 등) 발생 시 500과 함께 고정 에러 메시지를 던진다', async () => {
    server.use(
      http.post('*/v1/user/email/sendCode', () =>
        HttpResponse.json(
          {
            result: false,
            statusCode: 500,
            data: null,
            message: ['서버 오류가 발생했습니다'],
          },
          { status: 500 }
        )
      )
    )

    await expect(
      sendEmailVerificationCode({
        email: 'user@koreapetroleum.com',
        authType: '0',
        fingerprintCode: 'fp-1234',
      })
    ).rejects.toThrow('서버 오류가 발생했습니다')
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
