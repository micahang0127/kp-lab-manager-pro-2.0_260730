import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import { server } from '../test/mocks/server'
import { changePassword, login, loginWithEmailVerificationCode, withdraw } from './user'

describe('login API', () => {
  beforeEach(() => {
    sessionStorage.clear()
    server.resetHandlers()
  })

  it('type T 응답 시 token을 포함한 응답을 반환한다', async () => {
    server.use(
      http.post('*/user/login', () =>
        HttpResponse.json({
          result: true,
          statusCode: 200,
          data: { type: 'T', token: 'real-token-xyz' },
          message: [],
        })
      )
    )

    const result = await login({
      email: 'test@test.com',
      password: '1234',
      cfTurnstileResponse: 'mock-turnstile-token',
    })
    expect(result.statusCode).toBe(200)
    expect(result.data?.type).toBe('T')
    expect(result.data?.token).toBe('real-token-xyz')
  })

  it('type O 응답 시 token 없이 응답을 반환한다', async () => {
    server.use(
      http.post('*/user/login', () =>
        HttpResponse.json({
          result: true,
          statusCode: 200,
          data: { type: 'O' },
          message: [],
        })
      )
    )

    const result = await login({
      email: 'test@test.com',
      password: '1234',
      cfTurnstileResponse: 'mock-turnstile-token',
    })
    expect(result.statusCode).toBe(200)
    expect(result.data?.type).toBe('O')
    expect(result.data?.token).toBeUndefined()
  })

  it('실패 시 에러를 던진다', async () => {
    server.use(
      http.post('*/user/login', () =>
        HttpResponse.json(
          {
            result: false,
            statusCode: 400,
            data: null,
            message: ['이메일 또는 비밀번호가 틀렸습니다.'],
          },
          { status: 400 }
        )
      )
    )

    await expect(
      login({
        email: 'wrong@test.com',
        password: 'wrong',
        cfTurnstileResponse: 'mock-turnstile-token',
      })
    ).rejects.toThrow('이메일 또는 비밀번호가 틀렸습니다.')
  })

  it('서버 오류 시 에러를 던진다', async () => {
    server.use(
      http.post('*/user/login', () =>
        HttpResponse.json(
          {
            result: false,
            statusCode: 500,
            data: null,
            message: ['서버 오류가 발생했습니다.'],
          },
          { status: 500 }
        )
      )
    )

    await expect(
      login({
        email: 'test@test.com',
        password: 'test',
        cfTurnstileResponse: 'mock-turnstile-token',
      })
    ).rejects.toThrow('서버 오류가 발생했습니다.')
  })

  it('로그인 요청에 Authorization 헤더가 포함되지 않는다', async () => {
    sessionStorage.setItem('accessToken', 'existing-token')
    let authHeader: string | null = null
    server.use(
      http.post('*/user/login', ({ request }) => {
        authHeader = request.headers.get('Authorization')
        return HttpResponse.json({
          result: true,
          statusCode: 200,
          data: { type: 'T', token: 'tok' },
          message: [],
        })
      })
    )

    await login({
      email: 'a@b.com',
      password: 'pw',
      cfTurnstileResponse: 'mock-turnstile-token',
    })
    expect(authHeader).toBeNull()
  })
})

describe('withdraw API', () => {
  beforeEach(() => {
    sessionStorage.clear()
    server.resetHandlers()
  })

  it('성공 시 statusCode 200을 반환한다', async () => {
    sessionStorage.setItem('accessToken', 'mock-token')
    server.use(
      http.delete('*/auth/withdraw', () =>
        HttpResponse.json({
          result: true,
          statusCode: 200,
          data: true,
          message: [],
        })
      )
    )

    const result = await withdraw()
    expect(result.statusCode).toBe(200)
  })

  it('토큰 없으면 401 에러를 던진다', async () => {
    sessionStorage.clear()
    server.use(
      http.delete('*/auth/withdraw', () =>
        HttpResponse.json(
          {
            result: false,
            statusCode: 401,
            data: null,
            message: ['인증이 필요합니다.'],
          },
          { status: 401 }
        )
      )
    )

    await expect(withdraw()).rejects.toThrow('인증이 필요합니다.')
  })

  it('서버 오류 시 에러를 던진다', async () => {
    sessionStorage.setItem('accessToken', 'mock-token')
    server.use(
      http.delete('*/auth/withdraw', () =>
        HttpResponse.json(
          {
            result: false,
            statusCode: 500,
            data: null,
            message: ['회원탈퇴 처리 중 오류가 발생했습니다.'],
          },
          { status: 500 }
        )
      )
    )

    await expect(withdraw()).rejects.toThrow('회원탈퇴 처리 중 오류가 발생했습니다.')
  })
})

describe('changePassword API', () => {
  beforeEach(() => {
    sessionStorage.clear()
    server.resetHandlers()
  })

  it('성공 시 statusCode 200을 반환한다', async () => {
    sessionStorage.setItem('accessToken', 'mock-token')
    server.use(
      http.patch('*/auth/password', () =>
        HttpResponse.json({
          result: true,
          statusCode: 200,
          data: true,
          message: [],
        })
      )
    )

    const result = await changePassword({
      currentPassword: 'oldpass123',
      newPassword: 'newpass123',
    })
    expect(result.statusCode).toBe(200)
  })

  it('토큰 없으면 401 에러를 던진다', async () => {
    sessionStorage.clear()
    server.use(
      http.patch('*/auth/password', () =>
        HttpResponse.json(
          {
            result: false,
            statusCode: 401,
            data: null,
            message: ['인증이 필요합니다.'],
          },
          { status: 401 }
        )
      )
    )

    await expect(
      changePassword({
        currentPassword: 'oldpass123',
        newPassword: 'newpass123',
      })
    ).rejects.toThrow('인증이 필요합니다.')
  })

  it('현재 비밀번호가 틀리면 에러를 던진다', async () => {
    sessionStorage.setItem('accessToken', 'mock-token')
    server.use(
      http.patch('*/auth/password', () =>
        HttpResponse.json(
          {
            result: false,
            statusCode: 400,
            data: null,
            message: ['현재 비밀번호가 일치하지 않습니다.'],
          },
          { status: 400 }
        )
      )
    )

    await expect(
      changePassword({
        currentPassword: 'wrongpass',
        newPassword: 'newpass123',
      })
    ).rejects.toThrow('현재 비밀번호가 일치하지 않습니다.')
  })
})

describe('loginWithEmailVerificationCode API', () => {
  beforeEach(() => {
    sessionStorage.clear()
    server.resetHandlers()
  })

  it('성공 시 token을 포함한 응답을 반환한다', async () => {
    server.use(
      http.post('*/user/email-verification-login', () =>
        HttpResponse.json({
          result: true,
          statusCode: 200,
          data: { token: 'email-verification-token-xyz' },
          message: [],
        })
      )
    )

    const result = await loginWithEmailVerificationCode({
      email: 'test@test.com',
      code: '123456',
      rememberDevice: false,
      trustDurationDays: 30,
    })
    expect(result.statusCode).toBe(200)
    expect(result.data?.token).toBe('email-verification-token-xyz')
  })

  it('잘못된 인증번호 시 에러를 던진다', async () => {
    server.use(
      http.post('*/user/email-verification-login', () =>
        HttpResponse.json(
          {
            result: false,
            statusCode: 400,
            data: null,
            message: ['잘못된 인증번호입니다.'],
          },
          { status: 400 }
        )
      )
    )

    await expect(
      loginWithEmailVerificationCode({
        email: 'test@test.com',
        code: '000000',
        rememberDevice: false,
        trustDurationDays: 30,
      })
    ).rejects.toThrow('잘못된 인증번호입니다.')
  })

  it('인증번호 만료 시 에러를 던진다', async () => {
    server.use(
      http.post('*/user/email-verification-login', () =>
        HttpResponse.json(
          {
            result: false,
            statusCode: 400,
            data: null,
            message: ['인증번호가 만료되었습니다.'],
          },
          { status: 400 }
        )
      )
    )

    await expect(
      loginWithEmailVerificationCode({
        email: 'test@test.com',
        code: '123456',
        rememberDevice: false,
        trustDurationDays: 30,
      })
    ).rejects.toThrow('인증번호가 만료되었습니다.')
  })

  it('rememberDevice와 trustDurationDays 값이 요청 body에 포함된다', async () => {
    let capturedBody: Record<string, unknown> | null = null
    server.use(
      http.post('*/user/email-verification-login', async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({
          result: true,
          statusCode: 200,
          data: { token: 'tok' },
          message: [],
        })
      })
    )

    await loginWithEmailVerificationCode({
      email: 'test@test.com',
      code: '123456',
      rememberDevice: true,
      trustDurationDays: 30,
    })
    expect(capturedBody).toMatchObject({ rememberDevice: true, trustDurationDays: 30 })
  })

  it('이메일 인증 로그인 요청에 Authorization 헤더가 포함되지 않는다', async () => {
    sessionStorage.setItem('accessToken', 'existing-token')
    let authHeader: string | null = null
    server.use(
      http.post('*/user/email-verification-login', ({ request }) => {
        authHeader = request.headers.get('Authorization')
        return HttpResponse.json({
          result: true,
          statusCode: 200,
          data: { token: 'tok' },
          message: [],
        })
      })
    )

    await loginWithEmailVerificationCode({
      email: 'test@test.com',
      code: '123456',
      rememberDevice: false,
      trustDurationDays: 30,
    })
    expect(authHeader).toBeNull()
  })
})
