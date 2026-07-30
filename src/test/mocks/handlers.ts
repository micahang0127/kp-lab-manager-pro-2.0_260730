import { http, HttpResponse } from 'msw'

const BASE_URL = 'http://localhost:3000'

export const handlers = [
  // 로그인 성공 핸들러
  http.post(`${BASE_URL}/auth/login`, ({ request }) => {
    const body = request.headers.get('authorization')
    if (!body) {
      return HttpResponse.json(
        {
          statusCode: 400,
          data: null,
          error: ['이메일 또는 비밀번호가 틀렸습니다.'],
        },
        { status: 400 }
      )
    }
    return HttpResponse.json({
      statusCode: 200,
      data: { accessToken: 'mock-token-success' },
      error: [],
    })
  }),

  // 테스트 GET 요청 (API 클라이언트 테스트용)
  http.get(`${BASE_URL}/test`, ({ request }) => {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return HttpResponse.json(
        {
          statusCode: 401,
          data: null,
          error: ['인증이 필요합니다.'],
        },
        { status: 401 }
      )
    }
    return HttpResponse.json({
      statusCode: 200,
      data: null,
      error: [],
    })
  }),

  // 회원가입 핸들러
  http.post(`${BASE_URL}/users`, () =>
    HttpResponse.json({
      statusCode: 200,
      data: { userId: 'test-user-id' },
      error: [],
    })
  ),

  // 비밀번호 변경 핸들러
  http.patch(`${BASE_URL}/users/password`, ({ request }) => {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return HttpResponse.json(
        {
          statusCode: 401,
          data: null,
          error: ['인증이 필요합니다.'],
        },
        { status: 401 }
      )
    }
    return HttpResponse.json({
      statusCode: 200,
      data: true,
      error: [],
    })
  }),

  // 회원탈퇴 핸들러
  http.delete(`${BASE_URL}/users`, ({ request }) => {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return HttpResponse.json(
        {
          statusCode: 401,
          data: null,
          error: ['인증이 필요합니다.'],
        },
        { status: 401 }
      )
    }
    return HttpResponse.json({
      statusCode: 200,
      data: true,
      error: [],
    })
  }),
]
