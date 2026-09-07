import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import { server } from '../test/mocks/server'
import {
  changePassword,
  checkEmailDuplicate,
  getInvitedOrgs,
  issueFingerprint,
  login,
  loginWithEmailVerificationCode,
  signUp,
  verifyTurnstile,
  withdraw,
} from './user'

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
    })
    expect(authHeader).toBeNull()
  })
})

describe('verifyTurnstile API', () => {
  beforeEach(() => {
    sessionStorage.clear()
    server.resetHandlers()
  })

  it('검증 성공 시 isVerified: true를 반환한다', async () => {
    server.use(
      http.post('*/v1/user/turnstile/verify', () =>
        HttpResponse.json({
          result: true,
          statusCode: 200,
          data: { isVerified: true },
          message: [],
        })
      )
    )

    const result = await verifyTurnstile({ token: 'mock-turnstile-token' })
    expect(result.statusCode).toBe(200)
    expect(result.data?.isVerified).toBe(true)
  })

  it('토큰 만료/재사용 시 isVerified: false와 errorCodes를 반환한다', async () => {
    server.use(
      http.post('*/v1/user/turnstile/verify', () =>
        HttpResponse.json({
          result: true,
          statusCode: 200,
          data: { isVerified: false, errorCodes: ['timeout-or-duplicate'] },
          message: [],
        })
      )
    )

    const result = await verifyTurnstile({ token: 'expired-token' })
    expect(result.data?.isVerified).toBe(false)
    expect(result.data?.errorCodes).toEqual(['timeout-or-duplicate'])
  })

  it('Cloudflare와 통신 자체가 실패하면(502) 에러를 던진다', async () => {
    server.use(
      http.post('*/v1/user/turnstile/verify', () =>
        HttpResponse.json(
          {
            result: false,
            statusCode: 502,
            data: null,
            message: ['Cloudflare 서버와 통신에 실패했습니다.'],
          },
          { status: 502 }
        )
      )
    )

    await expect(verifyTurnstile({ token: 'mock-turnstile-token' })).rejects.toThrow(
      'Cloudflare 서버와 통신에 실패했습니다.'
    )
  })

  it('검증 요청에 Authorization 헤더가 포함되지 않는다', async () => {
    sessionStorage.setItem('accessToken', 'existing-token')
    let authHeader: string | null = null
    server.use(
      http.post('*/v1/user/turnstile/verify', ({ request }) => {
        authHeader = request.headers.get('Authorization')
        return HttpResponse.json({
          result: true,
          statusCode: 200,
          data: { isVerified: true },
          message: [],
        })
      })
    )

    await verifyTurnstile({ token: 'mock-turnstile-token' })
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
      })
    ).rejects.toThrow('인증번호가 만료되었습니다.')
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
    })
    expect(authHeader).toBeNull()
  })
})

describe('issueFingerprint API', () => {
  beforeEach(() => {
    sessionStorage.clear()
    server.resetHandlers()
  })

  it('성공 시 fingerprintCode를 반환한다', async () => {
    server.use(
      http.get('*/v1/user/fingerprint', () =>
        HttpResponse.json({
          result: true,
          statusCode: 200,
          data: { fingerprintCode: '904eT9hCwnwkSmjiDYeGnxmLdkMuHNQs' },
          message: [],
        })
      )
    )

    const result = await issueFingerprint()
    expect(result.statusCode).toBe(200)
    expect(result.data?.fingerprintCode).toBe('904eT9hCwnwkSmjiDYeGnxmLdkMuHNQs')
  })

  it('서버 오류 시 에러를 던진다', async () => {
    server.use(
      http.get('*/v1/user/fingerprint', () =>
        HttpResponse.json(
          {
            result: false,
            statusCode: 500,
            data: null,
            message: ['핑거프린트 발급 중 오류가 발생했습니다.'],
          },
          { status: 500 }
        )
      )
    )

    await expect(issueFingerprint()).rejects.toThrow('핑거프린트 발급 중 오류가 발생했습니다.')
  })

  it('발급 요청에 Authorization 헤더가 포함되지 않는다', async () => {
    sessionStorage.setItem('accessToken', 'existing-token')
    let authHeader: string | null = null
    server.use(
      http.get('*/v1/user/fingerprint', ({ request }) => {
        authHeader = request.headers.get('Authorization')
        return HttpResponse.json({
          result: true,
          statusCode: 200,
          data: { fingerprintCode: 'mock-fingerprint-code' },
          message: [],
        })
      })
    )

    await issueFingerprint()
    expect(authHeader).toBeNull()
  })
})

describe('checkEmailDuplicate API', () => {
  beforeEach(() => {
    sessionStorage.clear()
    server.resetHandlers()
  })

  it('가입되지 않은 이메일이면 isDuplicated: false를 반환한다', async () => {
    server.use(
      http.post('*/v1/user/email/duplicate', () =>
        HttpResponse.json({
          result: true,
          statusCode: 201,
          data: { isDuplicated: false },
          message: [],
        })
      )
    )

    const result = await checkEmailDuplicate({ email: 'new@koreapetroleum.com' })
    expect(result.statusCode).toBe(201)
    expect(result.data?.isDuplicated).toBe(false)
  })

  it('이미 가입된 이메일이면 isDuplicated: true를 반환한다', async () => {
    server.use(
      http.post('*/v1/user/email/duplicate', () =>
        HttpResponse.json({
          result: true,
          statusCode: 201,
          data: { isDuplicated: true },
          message: [],
        })
      )
    )

    const result = await checkEmailDuplicate({ email: 'existing@koreapetroleum.com' })
    expect(result.data?.isDuplicated).toBe(true)
  })

  it('이메일 형식이 올바르지 않으면(400) 에러를 던진다', async () => {
    server.use(
      http.post('*/v1/user/email/duplicate', () =>
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

    await expect(checkEmailDuplicate({ email: 'invalid-email' })).rejects.toThrow(
      '올바른 이메일 형식이 아닙니다'
    )
  })

  it('이메일을 입력하지 않으면(400) 에러를 던진다', async () => {
    server.use(
      http.post('*/v1/user/email/duplicate', () =>
        HttpResponse.json(
          {
            result: false,
            statusCode: 400,
            data: null,
            message: { email: ['이메일을 입력해주세요'] },
          },
          { status: 400 }
        )
      )
    )

    await expect(checkEmailDuplicate({ email: '' })).rejects.toThrow('이메일을 입력해주세요')
  })

  it('확인 요청에 Authorization 헤더가 포함되지 않는다', async () => {
    sessionStorage.setItem('accessToken', 'existing-token')
    let authHeader: string | null = null
    server.use(
      http.post('*/v1/user/email/duplicate', ({ request }) => {
        authHeader = request.headers.get('Authorization')
        return HttpResponse.json({
          result: true,
          statusCode: 201,
          data: { isDuplicated: false },
          message: [],
        })
      })
    )

    await checkEmailDuplicate({ email: 'new@koreapetroleum.com' })
    expect(authHeader).toBeNull()
  })
})

describe('getInvitedOrgs API', () => {
  beforeEach(() => {
    sessionStorage.clear()
    server.resetHandlers()
  })

  it('대기중인 초대가 있으면 invites 목록을 반환한다', async () => {
    server.use(
      http.post('*/v1/user/invite/me', () =>
        HttpResponse.json({
          result: true,
          statusCode: 201,
          data: {
            invites: [
              {
                invitedIdx: '12',
                orgIdx: '3',
                orgName: '테스트회사',
                orgGrade: 'MEMBER',
                invitedAt: '2026-09-04T01:23:45.000Z',
              },
            ],
          },
          message: [],
        })
      )
    )

    const result = await getInvitedOrgs({ email: 'test@koreapetroleum.com', code: '123456' })
    expect(result.statusCode).toBe(201)
    expect(result.data?.invites).toEqual([
      {
        invitedIdx: '12',
        orgIdx: '3',
        orgName: '테스트회사',
        orgGrade: 'MEMBER',
        invitedAt: '2026-09-04T01:23:45.000Z',
      },
    ])
  })

  it('대기중인 초대가 없으면 빈 배열을 반환한다', async () => {
    server.use(
      http.post('*/v1/user/invite/me', () =>
        HttpResponse.json({
          result: true,
          statusCode: 201,
          data: { invites: [] },
          message: [],
        })
      )
    )

    const result = await getInvitedOrgs({ email: 'test@koreapetroleum.com', code: '123456' })
    expect(result.data?.invites).toEqual([])
  })

  it('요청 값 검증 실패(400) 시 에러를 던진다', async () => {
    server.use(
      http.post('*/v1/user/invite/me', () =>
        HttpResponse.json(
          {
            result: false,
            statusCode: 400,
            data: null,
            message: { code: ['인증코드는 6자리여야 합니다'] },
          },
          { status: 400 }
        )
      )
    )

    await expect(getInvitedOrgs({ email: 'test@koreapetroleum.com', code: '1' })).rejects.toThrow(
      '인증코드는 6자리여야 합니다'
    )
  })

  it('이메일 인증을 완료하지 않았으면(401) 에러를 던진다', async () => {
    server.use(
      http.post('*/v1/user/invite/me', () =>
        HttpResponse.json(
          {
            result: false,
            statusCode: 401,
            data: null,
            message: ['이메일 인증을 먼저 완료해주세요'],
          },
          { status: 401 }
        )
      )
    )

    await expect(
      getInvitedOrgs({ email: 'test@koreapetroleum.com', code: '123456' })
    ).rejects.toThrow('이메일 인증을 먼저 완료해주세요')
  })

  it('예상하지 못한 서버 오류(500) 시 고정 메시지로 에러를 던진다', async () => {
    server.use(
      http.post('*/v1/user/invite/me', () =>
        HttpResponse.json(
          { result: false, statusCode: 500, data: null, message: ['서버 오류가 발생했습니다'] },
          { status: 500 }
        )
      )
    )

    await expect(
      getInvitedOrgs({ email: 'test@koreapetroleum.com', code: '123456' })
    ).rejects.toThrow('서버 오류가 발생했습니다')
  })

  it('조회 요청에 Authorization 헤더가 포함되지 않는다', async () => {
    sessionStorage.setItem('accessToken', 'existing-token')
    let authHeader: string | null = null
    server.use(
      http.post('*/v1/user/invite/me', ({ request }) => {
        authHeader = request.headers.get('Authorization')
        return HttpResponse.json({
          result: true,
          statusCode: 201,
          data: { invites: [] },
          message: [],
        })
      })
    )

    await getInvitedOrgs({ email: 'test@koreapetroleum.com', code: '123456' })
    expect(authHeader).toBeNull()
  })
})

describe('signUp API', () => {
  beforeEach(() => {
    sessionStorage.clear()
    server.resetHandlers()
  })

  it('새 조직 만들기(regFile)로 회원가입에 성공하면 userIdx/email을 반환한다', async () => {
    server.use(
      http.post('*/v1/user/signUp', () =>
        HttpResponse.json({
          result: true,
          statusCode: 201,
          data: { userIdx: '1', email: 'test@koreapetroleum.com' },
          message: [],
        })
      )
    )

    const result = await signUp({
      email: 'test@koreapetroleum.com',
      password: 'abcd1234',
      verificationCode: 'identity-verification-abc123',
      regFile: 'PRODUCTION/BusinessRegistration/260901/xxxxxxxx.pdf',
      orgName: 'KP한석화학 주식회사',
      regNo: '123-45-67890',
      ceoName: '홍길동',
      address: '서울시 ...',
      bizItem: '석유제품',
      bizType: '도매',
    })

    expect(result.statusCode).toBe(201)
    expect(result.data?.userIdx).toBe('1')
    expect(result.data?.email).toBe('test@koreapetroleum.com')
  })

  it('요청 값 검증 실패(400) 시 에러를 던진다', async () => {
    server.use(
      http.post('*/v1/user/signUp', () =>
        HttpResponse.json(
          {
            result: false,
            statusCode: 400,
            data: null,
            message: { verificationCode: ['본인인증 키를 입력해주세요'] },
          },
          { status: 400 }
        )
      )
    )

    await expect(
      signUp({
        email: 'test@koreapetroleum.com',
        password: 'abcd1234',
        verificationCode: '',
        regFile: 'PRODUCTION/BusinessRegistration/260901/xxxxxxxx.pdf',
      })
    ).rejects.toThrow('본인인증 키를 입력해주세요')
  })

  it('본인인증 결과가 VERIFIED가 아니면(409) 서버 메시지로 에러를 던진다', async () => {
    server.use(
      http.post('*/v1/user/signUp', () =>
        HttpResponse.json(
          { result: false, statusCode: 409, data: null, message: ['본인인증에 실패했습니다'] },
          { status: 409 }
        )
      )
    )

    await expect(
      signUp({
        email: 'test@koreapetroleum.com',
        password: 'abcd1234',
        verificationCode: 'identity-verification-abc123',
        regFile: 'PRODUCTION/BusinessRegistration/260901/xxxxxxxx.pdf',
      })
    ).rejects.toThrow('본인인증에 실패했습니다')
  })

  it('이미 가입된 사용자(이메일/CI 중복)면(409) 서버 메시지로 에러를 던진다', async () => {
    server.use(
      http.post('*/v1/user/signUp', () =>
        HttpResponse.json(
          { result: false, statusCode: 409, data: null, message: ['이미 가입된 사용자입니다'] },
          { status: 409 }
        )
      )
    )

    await expect(
      signUp({
        email: 'test@koreapetroleum.com',
        password: 'abcd1234',
        verificationCode: 'identity-verification-abc123',
        regFile: 'PRODUCTION/BusinessRegistration/260901/xxxxxxxx.pdf',
      })
    ).rejects.toThrow('이미 가입된 사용자입니다')
  })

  it('초대받은 조직을 찾을 수 없으면(409) 서버 메시지로 에러를 던진다', async () => {
    server.use(
      http.post('*/v1/user/signUp', () =>
        HttpResponse.json(
          { result: false, statusCode: 409, data: null, message: ['존재하지 않는 회사입니다'] },
          { status: 409 }
        )
      )
    )

    await expect(
      signUp({
        email: 'test@koreapetroleum.com',
        password: 'abcd1234',
        verificationCode: 'identity-verification-abc123',
        orgIdx: 1,
        invitedIdx: 1,
      })
    ).rejects.toThrow('존재하지 않는 회사입니다')
  })

  it('예상하지 못한 서버 오류(500) 시 고정 메시지로 에러를 던진다', async () => {
    server.use(
      http.post('*/v1/user/signUp', () =>
        HttpResponse.json(
          { result: false, statusCode: 500, data: null, message: ['서버 오류가 발생했습니다'] },
          { status: 500 }
        )
      )
    )

    await expect(
      signUp({
        email: 'test@koreapetroleum.com',
        password: 'abcd1234',
        verificationCode: 'identity-verification-abc123',
        regFile: 'PRODUCTION/BusinessRegistration/260901/xxxxxxxx.pdf',
      })
    ).rejects.toThrow('서버 오류가 발생했습니다')
  })

  it('orgIdx와 regFile을 모두 입력하면(XOR 위반) 요청 전에 에러를 던진다', async () => {
    await expect(
      signUp({
        email: 'test@koreapetroleum.com',
        password: 'abcd1234',
        verificationCode: 'identity-verification-abc123',
        orgIdx: 1,
        invitedIdx: 1,
        regFile: 'PRODUCTION/BusinessRegistration/260901/xxxxxxxx.pdf',
      })
    ).rejects.toThrow(
      'orgIdx(기존 조직에 가입)와 regFile(새 조직 만들기) 중 정확히 하나만 입력해야 합니다.'
    )
  })

  it('orgIdx와 regFile을 둘 다 입력하지 않으면(XOR 위반) 요청 전에 에러를 던진다', async () => {
    await expect(
      signUp({
        email: 'test@koreapetroleum.com',
        password: 'abcd1234',
        verificationCode: 'identity-verification-abc123',
      })
    ).rejects.toThrow(
      'orgIdx(기존 조직에 가입)와 regFile(새 조직 만들기) 중 정확히 하나만 입력해야 합니다.'
    )
  })

  it('orgIdx만 입력하고 invitedIdx를 입력하지 않으면 요청 전에 에러를 던진다', async () => {
    await expect(
      signUp({
        email: 'test@koreapetroleum.com',
        password: 'abcd1234',
        verificationCode: 'identity-verification-abc123',
        orgIdx: 1,
      })
    ).rejects.toThrow('orgIdx로 가입할 때는 invitedIdx를 반드시 함께 입력해야 합니다.')
  })

  it('orgIdx 없이 invitedIdx만 입력하면 요청 전에 에러를 던진다', async () => {
    await expect(
      signUp({
        email: 'test@koreapetroleum.com',
        password: 'abcd1234',
        verificationCode: 'identity-verification-abc123',
        invitedIdx: 1,
      })
    ).rejects.toThrow(
      'orgIdx(기존 조직에 가입)와 regFile(새 조직 만들기) 중 정확히 하나만 입력해야 합니다.'
    )
  })

  it('orgIdx와 invitedIdx를 함께 입력하면(regFile 없이) 정상적으로 요청을 보낸다', async () => {
    server.use(
      http.post('*/v1/user/signUp', () =>
        HttpResponse.json({
          result: true,
          statusCode: 201,
          data: { userIdx: '1', email: 'test@koreapetroleum.com' },
          message: [],
        })
      )
    )

    const result = await signUp({
      email: 'test@koreapetroleum.com',
      password: 'abcd1234',
      verificationCode: 'identity-verification-abc123',
      orgIdx: 1,
      invitedIdx: 1,
    })

    expect(result.statusCode).toBe(201)
  })

  it('요청에 Authorization 헤더가 포함되지 않는다', async () => {
    sessionStorage.setItem('accessToken', 'existing-token')
    let authHeader: string | null = null
    server.use(
      http.post('*/v1/user/signUp', ({ request }) => {
        authHeader = request.headers.get('Authorization')
        return HttpResponse.json({
          result: true,
          statusCode: 201,
          data: { userIdx: '1', email: 'test@koreapetroleum.com' },
          message: [],
        })
      })
    )

    await signUp({
      email: 'test@koreapetroleum.com',
      password: 'abcd1234',
      verificationCode: 'identity-verification-abc123',
      regFile: 'PRODUCTION/BusinessRegistration/260901/xxxxxxxx.pdf',
    })
    expect(authHeader).toBeNull()
  })
})
