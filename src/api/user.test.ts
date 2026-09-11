import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import { server } from '../test/mocks/server'
import {
  changePassword,
  checkEmailDuplicate,
  getInvitedOrgs,
  issueFingerprint,
  resetPassword,
  signUp,
  withdraw,
} from './user'

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

  /** 새 조직 만들기(regFile)로 가입할 때 공통으로 쓰는 요청 필드 */
  const NEW_ORG_REQUEST = {
    email: 'test@koreapetroleum.com',
    password: 'abcd1234',
    verificationCode: 'identity-verification-abc123',
    code: '123456',
    joinType: 0 as const,
    termsYn: 'Y' as const,
    marketingYn: 'Y' as const,
  }

  /** 기존 조직 가입(orgIdx+invitedIdx)으로 가입할 때 공통으로 쓰는 요청 필드 */
  const EXISTING_ORG_REQUEST = {
    email: 'test@koreapetroleum.com',
    password: 'abcd1234',
    verificationCode: 'identity-verification-abc123',
    code: '123456',
    joinType: 1 as const,
    termsYn: 'Y' as const,
    marketingYn: 'Y' as const,
  }

  /** 성공(201) 응답 데이터 — API 문서(UserSignUpPayload)의 예시를 그대로 사용 */
  const SIGN_UP_SUCCESS_DATA = {
    userIdx: '1',
    email: 'test@koreapetroleum.com',
    marketingYn: 'Y' as const,
    createdAt: '2026-09-11T00:00:00.000Z',
    orgIdx: '1',
    orgName: '회사명',
    orgGrade: 'SYSTEM',
    groupIdx: '1',
    acceptedInvitedIdx: null,
    rejectedInviteCount: 0,
  }

  it('새 조직 만들기(regFile)로 회원가입에 성공하면 userIdx/email을 반환한다', async () => {
    server.use(
      http.post('*/v1/user/signUp', () =>
        HttpResponse.json({
          result: true,
          statusCode: 201,
          data: SIGN_UP_SUCCESS_DATA,
          message: [],
        })
      )
    )

    const result = await signUp({
      ...NEW_ORG_REQUEST,
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
        ...NEW_ORG_REQUEST,
        verificationCode: '',
        regFile: 'PRODUCTION/BusinessRegistration/260901/xxxxxxxx.pdf',
      })
    ).rejects.toThrow('본인인증 키를 입력해주세요')
  })

  it('이메일 인증을 완료하지 않았으면(401) 에러를 던진다', async () => {
    server.use(
      http.post('*/v1/user/signUp', () =>
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
      signUp({
        ...NEW_ORG_REQUEST,
        regFile: 'PRODUCTION/BusinessRegistration/260901/xxxxxxxx.pdf',
      })
    ).rejects.toThrow('이메일 인증을 먼저 완료해주세요')
  })

  it('필수 약관에 동의하지 않았으면(409) 서버 메시지로 에러를 던진다', async () => {
    server.use(
      http.post('*/v1/user/signUp', () =>
        HttpResponse.json(
          {
            result: false,
            statusCode: 409,
            data: null,
            message: ['필수 약관에 동의해야 가입할 수 있습니다'],
          },
          { status: 409 }
        )
      )
    )

    await expect(
      signUp({
        ...NEW_ORG_REQUEST,
        termsYn: 'N',
        regFile: 'PRODUCTION/BusinessRegistration/260901/xxxxxxxx.pdf',
      })
    ).rejects.toThrow('필수 약관에 동의해야 가입할 수 있습니다')
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
        ...NEW_ORG_REQUEST,
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
        ...NEW_ORG_REQUEST,
        regFile: 'PRODUCTION/BusinessRegistration/260901/xxxxxxxx.pdf',
      })
    ).rejects.toThrow('이미 가입된 사용자입니다')
  })

  it('초대된 회사가 아니면(409) 서버 메시지로 에러를 던진다', async () => {
    server.use(
      http.post('*/v1/user/signUp', () =>
        HttpResponse.json(
          { result: false, statusCode: 409, data: null, message: ['초대된 회사가 아닙니다'] },
          { status: 409 }
        )
      )
    )

    await expect(
      signUp({
        ...EXISTING_ORG_REQUEST,
        orgIdx: 1,
        invitedIdx: 1,
      })
    ).rejects.toThrow('초대된 회사가 아닙니다')
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
        ...EXISTING_ORG_REQUEST,
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
        ...NEW_ORG_REQUEST,
        regFile: 'PRODUCTION/BusinessRegistration/260901/xxxxxxxx.pdf',
      })
    ).rejects.toThrow('서버 오류가 발생했습니다')
  })

  it('orgIdx와 regFile을 모두 입력하면(XOR 위반) 요청 전에 에러를 던진다', async () => {
    await expect(
      signUp({
        ...EXISTING_ORG_REQUEST,
        orgIdx: 1,
        invitedIdx: 1,
        regFile: 'PRODUCTION/BusinessRegistration/260901/xxxxxxxx.pdf',
      })
    ).rejects.toThrow(
      'orgIdx(기존 조직에 가입)와 regFile(새 조직 만들기) 중 정확히 하나만 입력해야 합니다.'
    )
  })

  it('orgIdx와 regFile을 둘 다 입력하지 않으면(XOR 위반) 요청 전에 에러를 던진다', async () => {
    await expect(signUp(NEW_ORG_REQUEST)).rejects.toThrow(
      'orgIdx(기존 조직에 가입)와 regFile(새 조직 만들기) 중 정확히 하나만 입력해야 합니다.'
    )
  })

  it('orgIdx만 입력하고 invitedIdx를 입력하지 않으면 요청 전에 에러를 던진다', async () => {
    await expect(
      signUp({
        ...EXISTING_ORG_REQUEST,
        orgIdx: 1,
      })
    ).rejects.toThrow('orgIdx로 가입할 때는 invitedIdx를 반드시 함께 입력해야 합니다.')
  })

  it('orgIdx 없이 invitedIdx만 입력하면 요청 전에 에러를 던진다', async () => {
    await expect(
      signUp({
        ...EXISTING_ORG_REQUEST,
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
          data: SIGN_UP_SUCCESS_DATA,
          message: [],
        })
      )
    )

    const result = await signUp({
      ...EXISTING_ORG_REQUEST,
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
          data: SIGN_UP_SUCCESS_DATA,
          message: [],
        })
      })
    )

    await signUp({
      ...NEW_ORG_REQUEST,
      regFile: 'PRODUCTION/BusinessRegistration/260901/xxxxxxxx.pdf',
    })
    expect(authHeader).toBeNull()
  })
})

describe('resetPassword API', () => {
  beforeEach(() => {
    sessionStorage.clear()
    server.resetHandlers()
  })

  it('성공 시 success: true를 반환한다', async () => {
    server.use(
      http.post('*/v1/user/password/reset', () =>
        HttpResponse.json({
          result: true,
          statusCode: 201,
          data: { success: true },
          message: null,
        })
      )
    )

    const result = await resetPassword({
      identityVerificationId: 'identity-verification-abc123',
      password: 'abcd1234',
      passwordConfirm: 'abcd1234',
    })

    expect(result.statusCode).toBe(201)
    expect(result.data?.success).toBe(true)
  })

  it('요청 값 검증 실패(400) 시 에러를 던진다', async () => {
    server.use(
      http.post('*/v1/user/password/reset', () =>
        HttpResponse.json(
          {
            result: false,
            statusCode: 400,
            data: null,
            message: { password: ['새 비밀번호를 입력해주세요'] },
          },
          { status: 400 }
        )
      )
    )

    await expect(
      resetPassword({
        identityVerificationId: 'identity-verification-abc123',
        password: '',
        passwordConfirm: '',
      })
    ).rejects.toThrow('새 비밀번호를 입력해주세요')
  })

  it('새 비밀번호와 확인이 일치하지 않으면(409) 서버 메시지로 에러를 던진다', async () => {
    server.use(
      http.post('*/v1/user/password/reset', () =>
        HttpResponse.json(
          {
            result: false,
            statusCode: 409,
            data: null,
            message: ['새 비밀번호가 일치하지 않습니다'],
          },
          { status: 409 }
        )
      )
    )

    await expect(
      resetPassword({
        identityVerificationId: 'identity-verification-abc123',
        password: 'abcd1234',
        passwordConfirm: 'different1',
      })
    ).rejects.toThrow('새 비밀번호가 일치하지 않습니다')
  })

  it('본인인증 결과가 VERIFIED가 아니면(409) 서버 메시지로 에러를 던진다', async () => {
    server.use(
      http.post('*/v1/user/password/reset', () =>
        HttpResponse.json(
          { result: false, statusCode: 409, data: null, message: ['본인인증에 실패했습니다'] },
          { status: 409 }
        )
      )
    )

    await expect(
      resetPassword({
        identityVerificationId: 'identity-verification-abc123',
        password: 'abcd1234',
        passwordConfirm: 'abcd1234',
      })
    ).rejects.toThrow('본인인증에 실패했습니다')
  })

  it('CI 해시로 조회한 가입 계정이 없으면(404) 서버 메시지로 에러를 던진다', async () => {
    server.use(
      http.post('*/v1/user/password/reset', () =>
        HttpResponse.json(
          {
            result: false,
            statusCode: 404,
            data: null,
            message: ['가입된 계정을 찾을 수 없습니다'],
          },
          { status: 404 }
        )
      )
    )

    await expect(
      resetPassword({
        identityVerificationId: 'identity-verification-abc123',
        password: 'abcd1234',
        passwordConfirm: 'abcd1234',
      })
    ).rejects.toThrow('가입된 계정을 찾을 수 없습니다')
  })

  it('예상하지 못한 서버 오류(500) 시 고정 메시지로 에러를 던진다', async () => {
    server.use(
      http.post('*/v1/user/password/reset', () =>
        HttpResponse.json(
          { result: false, statusCode: 500, data: null, message: ['서버 오류가 발생했습니다'] },
          { status: 500 }
        )
      )
    )

    await expect(
      resetPassword({
        identityVerificationId: 'identity-verification-abc123',
        password: 'abcd1234',
        passwordConfirm: 'abcd1234',
      })
    ).rejects.toThrow('서버 오류가 발생했습니다')
  })

  it('요청에 Authorization 헤더가 포함되지 않는다', async () => {
    sessionStorage.setItem('accessToken', 'existing-token')
    let authHeader: string | null = null
    server.use(
      http.post('*/v1/user/password/reset', ({ request }) => {
        authHeader = request.headers.get('Authorization')
        return HttpResponse.json({
          result: true,
          statusCode: 201,
          data: { success: true },
          message: null,
        })
      })
    )

    await resetPassword({
      identityVerificationId: 'identity-verification-abc123',
      password: 'abcd1234',
      passwordConfirm: 'abcd1234',
    })
    expect(authHeader).toBeNull()
  })
})
