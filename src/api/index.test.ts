import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import { server } from '../test/mocks/server'
import { api } from './index'

describe('api client', () => {
  beforeEach(() => {
    sessionStorage.clear()
    server.resetHandlers()
  })

  it('Authorization 헤더에 sessionStorage 토큰을 자동으로 포함한다', async () => {
    sessionStorage.setItem('accessToken', 'test-token-123')

    let receivedAuth: string | null = null
    server.use(
      http.get('*/test', ({ request }) => {
        receivedAuth = request.headers.get('Authorization')
        return HttpResponse.json({ statusCode: 200, data: null, error: [] })
      })
    )

    await api.get('/test')
    expect(receivedAuth).toBe('Bearer test-token-123')
  })

  it('토큰 없으면 Authorization 헤더가 없다', async () => {
    let receivedAuth: string | null = null
    server.use(
      http.get('*/test', ({ request }) => {
        receivedAuth = request.headers.get('Authorization')
        return HttpResponse.json({ statusCode: 200, data: null, error: [] })
      })
    )

    await api.get('/test')
    expect(receivedAuth).toBeNull()
  })

  it('POST 요청 시 본문을 JSON으로 전송한다', async () => {
    let receivedBody: unknown = null
    server.use(
      http.post('*/test', async ({ request }) => {
        receivedBody = await request.json()
        return HttpResponse.json({ statusCode: 200, data: null, error: [] })
      })
    )

    await api.post('/test', { key: 'value' })
    expect(receivedBody).toEqual({ key: 'value' })
  })

  it('HTTP 에러 응답(401)을 처리한다', async () => {
    server.use(
      http.get('*/test', () =>
        HttpResponse.json(
          { statusCode: 401, data: null, error: ['인증이 필요합니다.'] },
          { status: 401 }
        )
      )
    )

    await expect(api.get('/test')).rejects.toThrow('인증이 필요합니다.')
  })

  it('HTTP 에러 응답(500)을 처리한다', async () => {
    server.use(
      http.get('*/test', () =>
        HttpResponse.json(
          { statusCode: 500, data: null, error: ['서버 오류가 발생했습니다.'] },
          { status: 500 }
        )
      )
    )

    await expect(api.get('/test')).rejects.toThrow('서버 오류가 발생했습니다.')
  })

  it('statusCode가 200이 아니면 에러를 던진다', async () => {
    server.use(
      http.get('*/test', () =>
        HttpResponse.json(
          { statusCode: 400, data: null, error: ['잘못된 요청입니다.'] },
          { status: 200 } // HTTP 상태는 200이지만 statusCode는 400
        )
      )
    )

    await expect(api.get('/test')).rejects.toThrow('잘못된 요청입니다.')
  })

  it('네트워크 에러를 처리한다', async () => {
    server.use(http.get('*/test', () => HttpResponse.error()))

    await expect(api.get('/test')).rejects.toThrow()
  })

  it('에러 배열이 비어있으면 기본 에러 메시지를 사용한다', async () => {
    server.use(
      http.get('*/test', () =>
        HttpResponse.json({ statusCode: 400, data: null, error: [] }, { status: 400 })
      )
    )

    await expect(api.get('/test')).rejects.toThrow('알 수 없는 오류가 발생했습니다.')
  })
})
