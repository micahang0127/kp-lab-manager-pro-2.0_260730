import { delay, http, HttpResponse } from 'msw'
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
        return HttpResponse.json({ result: true, statusCode: 200, data: null, message: [] })
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
        return HttpResponse.json({ result: true, statusCode: 200, data: null, message: [] })
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
        return HttpResponse.json({ result: true, statusCode: 200, data: null, message: [] })
      })
    )

    await api.post('/test', { key: 'value' })
    expect(receivedBody).toEqual({ key: 'value' })
  })

  it('HTTP 에러 응답(401)을 처리한다', async () => {
    server.use(
      http.get('*/test', () =>
        HttpResponse.json(
          { result: false, statusCode: 401, data: null, message: ['인증이 필요합니다.'] },
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
          { result: false, statusCode: 500, data: null, message: ['서버 오류가 발생했습니다.'] },
          { status: 500 }
        )
      )
    )

    await expect(api.get('/test')).rejects.toThrow('서버 오류가 발생했습니다.')
  })

  it('result가 false이면 HTTP 상태와 무관하게 에러를 던진다', async () => {
    server.use(
      http.get('*/test', () =>
        HttpResponse.json(
          { result: false, statusCode: 400, data: null, message: ['잘못된 요청입니다.'] },
          { status: 200 } // HTTP 상태는 200이지만 result는 false
        )
      )
    )

    await expect(api.get('/test')).rejects.toThrow('잘못된 요청입니다.')
  })

  it('네트워크 에러 시 사용자 친화적인 공통 메시지로 대체한다', async () => {
    server.use(http.get('*/test', () => HttpResponse.error()))

    await expect(api.get('/test')).rejects.toThrow('일시적인 오류가 발생했습니다.')
  })

  it('응답 본문이 JSON이 아니면 원본 파싱 에러 대신 공통 메시지를 던진다', async () => {
    server.use(http.get('*/test', () => new HttpResponse('not-json', { status: 200 })))

    await expect(api.get('/test')).rejects.toThrow('일시적인 오류가 발생했습니다.')
  })

  it('메시지 배열이 비어있으면 기본 에러 메시지를 사용한다', async () => {
    server.use(
      http.get('*/test', () =>
        HttpResponse.json(
          { result: false, statusCode: 400, data: null, message: [] },
          { status: 400 }
        )
      )
    )

    await expect(api.get('/test')).rejects.toThrow('알 수 없는 오류가 발생했습니다.')
  })

  it('DTO 검증 실패 응답(message가 { 필드명: [메시지] } 객체)이면 첫 번째 필드의 첫 메시지를 던진다', async () => {
    server.use(
      http.post('*/test', () =>
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

    await expect(api.post('/test', {})).rejects.toThrow('올바른 이메일 형식이 아닙니다')
  })

  it('message가 null이어도(정상 흐름에서는 성공 응답에만 오지만) 안전하게 기본 에러 메시지로 대체한다', async () => {
    server.use(
      http.get('*/test', () =>
        HttpResponse.json(
          { result: false, statusCode: 400, data: null, message: null },
          { status: 400 }
        )
      )
    )

    await expect(api.get('/test')).rejects.toThrow('알 수 없는 오류가 발생했습니다.')
  })

  it('성공 응답의 message가 null이어도 정상적으로 data를 반환한다', async () => {
    server.use(
      http.get('*/test', () =>
        HttpResponse.json({ result: true, statusCode: 200, data: { ok: true }, message: null })
      )
    )

    const res = await api.get<{ ok: boolean }>('/test')
    expect(res.data?.ok).toBe(true)
  })

  it('timeoutMs를 넘겨주면 그 시간을 기준으로 타임아웃한다', async () => {
    server.use(
      http.get('*/test', async () => {
        await delay(100)
        return HttpResponse.json({ result: true, statusCode: 200, data: null, message: [] })
      })
    )

    await expect(api.get('/test', { timeoutMs: 20 })).rejects.toThrow(
      '요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.'
    )
  })

  it('timeoutMs를 생략하면 기본 타임아웃(10초) 안에 끝나는 요청은 정상적으로 완료된다', async () => {
    server.use(
      http.get('*/test', () =>
        HttpResponse.json({ result: true, statusCode: 200, data: { ok: true }, message: [] })
      )
    )

    const res = await api.get<{ ok: boolean }>('/test')
    expect(res.data?.ok).toBe(true)
  })
})
