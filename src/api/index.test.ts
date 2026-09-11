import { delay, http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { server } from '../test/mocks/server'
import { ApiError, api } from './index'

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

  it('CommonResponsePayload 포맷을 거치지 않은 원본 예외(message가 순수 문자열)는 그대로 던진다', async () => {
    // Nest 기본 예외 필터가 그대로 내려주는 형태 — result/data 필드 자체가 없고 message도
    // 배열/객체가 아닌 순수 문자열이다. Object.values(문자열)로 잘못 처리하면 첫 글자만
    // 남는 버그가 있었다(예: "등록되지 않은 메세지 코드입니다: E_001" → "등").
    server.use(
      http.post('*/test', () =>
        HttpResponse.json(
          {
            statusCode: 500,
            error: 'Internal Server Error',
            message: '등록되지 않은 메세지 코드입니다: E_001',
          },
          { status: 500 }
        )
      )
    )

    await expect(api.post('/test', {})).rejects.toThrow('등록되지 않은 메세지 코드입니다: E_001')
  })

  it('message가 순수 문자열이면 ApiError.fieldErrors는 undefined다', async () => {
    server.use(
      http.post('*/test', () =>
        HttpResponse.json(
          { statusCode: 500, error: 'Internal Server Error', message: '알 수 없는 오류' },
          { status: 500 }
        )
      )
    )

    await expect(api.post('/test', {})).rejects.toSatisfy((err: unknown) => {
      expect(err).toBeInstanceOf(ApiError)
      expect((err as ApiError).fieldErrors).toBeUndefined()
      return true
    })
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

  it('DTO 검증 실패 응답은 ApiError.fieldErrors에 필드별 메시지 원본을 보존한다', async () => {
    server.use(
      http.post('*/test', () =>
        HttpResponse.json(
          {
            result: false,
            statusCode: 400,
            data: null,
            message: {
              email: ['올바른 이메일 형식이 아닙니다'],
              password: ['비밀번호는 8자 이상이어야 합니다'],
            },
          },
          { status: 400 }
        )
      )
    )

    await expect(api.post('/test', {})).rejects.toSatisfy((err: unknown) => {
      expect(err).toBeInstanceOf(ApiError)
      expect((err as ApiError).fieldErrors).toEqual({
        email: ['올바른 이메일 형식이 아닙니다'],
        password: ['비밀번호는 8자 이상이어야 합니다'],
      })
      return true
    })
  })

  it('서비스 로직 에러(message가 배열)는 ApiError.fieldErrors가 undefined다', async () => {
    server.use(
      http.post('*/test', () =>
        HttpResponse.json(
          { result: false, statusCode: 400, data: null, message: ['발송 횟수를 초과했습니다.'] },
          { status: 400 }
        )
      )
    )

    await expect(api.post('/test', {})).rejects.toSatisfy((err: unknown) => {
      expect(err).toBeInstanceOf(ApiError)
      expect((err as ApiError).fieldErrors).toBeUndefined()
      return true
    })
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

  describe('401 자동 로그아웃', () => {
    // jsdom의 window.location.replace는 non-configurable이라 vi.spyOn으로 직접 모킹할 수 없다 —
    // location 객체 자체를 테스트용 모킹 객체로 교체한다.
    const originalLocation = window.location

    afterEach(() => {
      Object.defineProperty(window, 'location', { value: originalLocation, writable: true })
      vi.restoreAllMocks()
    })

    it('토큰이 있고 메시지에 "만료"가 포함되면 토큰을 지우고 /login으로 리다이렉트한다', async () => {
      sessionStorage.setItem('accessToken', 'expired-token')
      const replaceSpy = vi.fn()
      Object.defineProperty(window, 'location', {
        value: { ...originalLocation, replace: replaceSpy },
        writable: true,
      })
      server.use(
        http.get('*/test', () =>
          HttpResponse.json(
            { result: false, statusCode: 401, data: null, message: ['토큰이 만료되었습니다.'] },
            { status: 401 }
          )
        )
      )

      await expect(api.get('/test')).rejects.toThrow('토큰이 만료되었습니다.')

      expect(sessionStorage.getItem('accessToken')).toBeNull()
      expect(replaceSpy).toHaveBeenCalledWith('/login')
    })

    it('토큰이 없는데 메시지에 "만료"가 포함돼도(예: 로그인 2차 인증 코드 만료) 리다이렉트하지 않는다', async () => {
      const replaceSpy = vi.fn()
      Object.defineProperty(window, 'location', {
        value: { ...originalLocation, replace: replaceSpy },
        writable: true,
      })
      server.use(
        http.post('*/test', () =>
          HttpResponse.json(
            {
              result: false,
              statusCode: 401,
              data: null,
              message: ['인증코드가 만료되었습니다. 인증코드를 다시 요청해주세요'],
            },
            { status: 401 }
          )
        )
      )

      await expect(api.post('/test', {})).rejects.toThrow('인증코드가 만료되었습니다')

      expect(replaceSpy).not.toHaveBeenCalled()
    })
  })
})
