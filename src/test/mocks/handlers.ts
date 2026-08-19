import { http, HttpResponse } from 'msw'

const BASE_URL = 'http://localhost:3000'

export const handlers = [
  // 로그인 성공 핸들러
  http.post(`${BASE_URL}/auth/login`, ({ request }) => {
    const body = request.headers.get('authorization')
    if (!body) {
      return HttpResponse.json(
        {
          result: false,
          statusCode: 400,
          data: null,
          message: ['이메일 또는 비밀번호가 틀렸습니다.'],
        },
        { status: 400 }
      )
    }
    return HttpResponse.json({
      result: true,
      statusCode: 200,
      data: { accessToken: 'mock-token-success' },
      message: [],
    })
  }),

  // 테스트 GET 요청 (API 클라이언트 테스트용)
  http.get(`${BASE_URL}/test`, ({ request }) => {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return HttpResponse.json(
        {
          result: false,
          statusCode: 401,
          data: null,
          message: ['인증이 필요합니다.'],
        },
        { status: 401 }
      )
    }
    return HttpResponse.json({
      result: true,
      statusCode: 200,
      data: null,
      message: [],
    })
  }),

  // 회원가입 핸들러
  http.post(`${BASE_URL}/users`, () =>
    HttpResponse.json({
      result: true,
      statusCode: 200,
      data: { userId: 'test-user-id' },
      message: [],
    })
  ),

  // 비밀번호 변경 핸들러
  http.patch(`${BASE_URL}/users/password`, ({ request }) => {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return HttpResponse.json(
        {
          result: false,
          statusCode: 401,
          data: null,
          message: ['인증이 필요합니다.'],
        },
        { status: 401 }
      )
    }
    return HttpResponse.json({
      result: true,
      statusCode: 200,
      data: true,
      message: [],
    })
  }),

  // 회원탈퇴 핸들러
  http.delete(`${BASE_URL}/users`, ({ request }) => {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return HttpResponse.json(
        {
          result: false,
          statusCode: 401,
          data: null,
          message: ['인증이 필요합니다.'],
        },
        { status: 401 }
      )
    }
    return HttpResponse.json({
      result: true,
      statusCode: 200,
      data: true,
      message: [],
    })
  }),
]
