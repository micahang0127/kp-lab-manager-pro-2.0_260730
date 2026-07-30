import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import { server } from '../test/mocks/server'
import { changePassword, login, otpLogin, signup, withdraw } from './user'

describe('login API', () => {
  beforeEach(() => {
    sessionStorage.clear()
    server.resetHandlers()
  })

  it('type T 응답 시 token을 포함한 응답을 반환한다', async () => {
    server.use(
      http.post('*/user/login', () =>
        HttpResponse.json({
          statusCode: 200,
          data: { type: 'T', token: 'real-token-xyz' },
          error: [],
        })
      )
    )

    const result = await login(
      { email: 'test@test.com', password: '1234', deviceType: 'WEB' },
      null
    )
    expect(result.statusCode).toBe(200)
    expect(result.data?.type).toBe('T')
    expect(result.data?.token).toBe('real-token-xyz')
  })

  it('type O 응답 시 token 없이 응답을 반환한다', async () => {
    server.use(
      http.post('*/user/login', () =>
        HttpResponse.json({
          statusCode: 200,
          data: { type: 'O' },
          error: [],
        })
      )
    )

    const result = await login(
      { email: 'test@test.com', password: '1234', deviceType: 'WEB' },
      null
    )
    expect(result.statusCode).toBe(200)
    expect(result.data?.type).toBe('O')
    expect(result.data?.token).toBeUndefined()
  })

  it('실패 시 에러를 던진다', async () => {
    server.use(
      http.post('*/user/login', () =>
        HttpResponse.json(
          {
            statusCode: 400,
            data: {},
            error: ['이메일 또는 비밀번호가 틀렸습니다.'],
          },
          { status: 400 }
        )
      )
    )

    await expect(
      login({ email: 'wrong@test.com', password: 'wrong', deviceType: 'WEB' }, null)
    ).rejects.toThrow('이메일 또는 비밀번호가 틀렸습니다.')
  })

  it('서버 오류 시 에러를 던진다', async () => {
    server.use(
      http.post('*/user/login', () =>
        HttpResponse.json(
          {
            statusCode: 500,
            data: {},
            error: ['서버 오류가 발생했습니다.'],
          },
          { status: 500 }
        )
      )
    )

    await expect(
      login({ email: 'test@test.com', password: 'test', deviceType: 'WEB' }, null)
    ).rejects.toThrow('서버 오류가 발생했습니다.')
  })

  it('KPMFP 헤더가 요청에 포함된다', async () => {
    let capturedHeader: string | null = null
    server.use(
      http.post('*/user/login', ({ request }) => {
        capturedHeader = request.headers.get('KPMFP')
        return HttpResponse.json({
          statusCode: 200,
          data: { type: 'T', token: 'tok' },
          error: [],
        })
      })
    )

    await login({ email: 'a@b.com', password: 'pw', deviceType: 'WEB' }, 'mock-fp-abc123')
    expect(capturedHeader).toBe('mock-fp-abc123')
  })

  it('로그인 요청에 Authorization 헤더가 포함되지 않는다', async () => {
    sessionStorage.setItem('accessToken', 'existing-token')
    let authHeader: string | null = null
    server.use(
      http.post('*/user/login', ({ request }) => {
        authHeader = request.headers.get('Authorization')
        return HttpResponse.json({
          statusCode: 200,
          data: { type: 'T', token: 'tok' },
          error: [],
        })
      })
    )

    await login({ email: 'a@b.com', password: 'pw', deviceType: 'WEB' }, null)
    expect(authHeader).toBeNull()
  })
})

describe('signup API', () => {
  beforeEach(() => {
    sessionStorage.clear()
    server.resetHandlers()
  })

  it('성공 시 statusCode 200을 반환한다', async () => {
    server.use(
      http.post('*/auth/signup', () =>
        HttpResponse.json({
          statusCode: 200,
          data: true,
          error: [],
        })
      )
    )

    const result = await signup({
      email: 'newuser@test.com',
      password: 'password123',
      name: '새사용자',
    })
    expect(result.statusCode).toBe(200)
    expect(result.data).toBe(true)
  })

  it('중복 이메일로 가입하면 에러를 던진다', async () => {
    server.use(
      http.post('*/auth/signup', () =>
        HttpResponse.json(
          {
            statusCode: 409,
            data: false,
            error: ['이미 가입된 이메일입니다.'],
          },
          { status: 409 }
        )
      )
    )

    await expect(
      signup({
        email: 'exists@test.com',
        password: 'password123',
        name: '사용자',
      })
    ).rejects.toThrow('이미 가입된 이메일입니다.')
  })

  it('유효하지 않은 입력으로 가입하면 에러를 던진다', async () => {
    server.use(
      http.post('*/auth/signup', () =>
        HttpResponse.json(
          {
            statusCode: 400,
            data: false,
            error: ['입력값이 올바르지 않습니다.'],
          },
          { status: 400 }
        )
      )
    )

    await expect(
      signup({
        email: 'invalid-email',
        password: '123',
        name: '',
      })
    ).rejects.toThrow('입력값이 올바르지 않습니다.')
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
          statusCode: 200,
          data: true,
          error: [],
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
            statusCode: 401,
            data: false,
            error: ['인증이 필요합니다.'],
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
            statusCode: 500,
            data: false,
            error: ['회원탈퇴 처리 중 오류가 발생했습니다.'],
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
          statusCode: 200,
          data: true,
          error: [],
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
            statusCode: 401,
            data: false,
            error: ['인증이 필요합니다.'],
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
            statusCode: 400,
            data: false,
            error: ['현재 비밀번호가 일치하지 않습니다.'],
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

describe('otpLogin API', () => {
  beforeEach(() => {
    sessionStorage.clear()
    server.resetHandlers()
  })

  it('성공 시 token을 포함한 응답을 반환한다', async () => {
    server.use(
      http.post('*/user/otplogin', () =>
        HttpResponse.json({
          statusCode: 200,
          data: { token: 'otp-token-xyz' },
          error: [],
        })
      )
    )

    const result = await otpLogin(
      { email: 'test@test.com', otpCode: '123456', deviceType: 'WEB' },
      null
    )
    expect(result.statusCode).toBe(200)
    expect(result.data?.token).toBe('otp-token-xyz')
  })

  it('잘못된 OTP 코드 시 에러를 던진다', async () => {
    server.use(
      http.post('*/user/otplogin', () =>
        HttpResponse.json(
          {
            statusCode: 400,
            data: {},
            error: ['잘못된 OTP 코드입니다.'],
          },
          { status: 400 }
        )
      )
    )

    await expect(
      otpLogin({ email: 'test@test.com', otpCode: '000000', deviceType: 'WEB' }, null)
    ).rejects.toThrow('잘못된 OTP 코드입니다.')
  })

  it('OTP 만료 시 에러를 던진다', async () => {
    server.use(
      http.post('*/user/otplogin', () =>
        HttpResponse.json(
          {
            statusCode: 400,
            data: {},
            error: ['인증번호가 만료되었습니다.'],
          },
          { status: 400 }
        )
      )
    )

    await expect(
      otpLogin({ email: 'test@test.com', otpCode: '123456', deviceType: 'WEB' }, null)
    ).rejects.toThrow('인증번호가 만료되었습니다.')
  })

  it('KPMFP 헤더가 요청에 포함될 수 있다', async () => {
    let capturedHeader: string | null = null
    server.use(
      http.post('*/user/otplogin', ({ request }) => {
        capturedHeader = request.headers.get('KPMFP')
        return HttpResponse.json({
          statusCode: 200,
          data: { token: 'tok' },
          error: [],
        })
      })
    )

    await otpLogin(
      { email: 'test@test.com', otpCode: '123456', deviceType: 'WEB' },
      'mock-fp-abc123'
    )
    expect(capturedHeader).toBe('mock-fp-abc123')
  })

  it('OTP 로그인 요청에 Authorization 헤더가 포함되지 않는다', async () => {
    sessionStorage.setItem('accessToken', 'existing-token')
    let authHeader: string | null = null
    server.use(
      http.post('*/user/otplogin', ({ request }) => {
        authHeader = request.headers.get('Authorization')
        return HttpResponse.json({
          statusCode: 200,
          data: { token: 'tok' },
          error: [],
        })
      })
    )

    await otpLogin({ email: 'test@test.com', otpCode: '123456', deviceType: 'WEB' }, null)
    expect(authHeader).toBeNull()
  })
})
