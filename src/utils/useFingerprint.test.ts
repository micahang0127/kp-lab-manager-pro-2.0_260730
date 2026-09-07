import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useFingerprintStore } from '../stores/fingerprintStore'
import { server } from '../test/mocks/server'
import { AllTheProviders } from '../test/test-utils'
import { useFingerprint } from './useFingerprint'

describe('useFingerprint', () => {
  beforeEach(() => {
    document.cookie = 'fingerprintCode=; max-age=0; path=/'
    useFingerprintStore.setState({ fingerprintCode: null })
    server.resetHandlers()
  })

  it('쿠키에 이미 fingerprintCode가 있으면 발급 API를 호출하지 않고 그 값을 그대로 반환한다', async () => {
    useFingerprintStore.getState().saveFingerprintCode('existing-fingerprint')
    let callCount = 0
    server.use(
      http.get('*/v1/user/fingerprint', () => {
        callCount += 1
        return HttpResponse.json({
          result: true,
          statusCode: 200,
          data: { fingerprintCode: 'new-fingerprint' },
          message: [],
        })
      })
    )

    const { result } = renderHook(() => useFingerprint(), { wrapper: AllTheProviders })

    expect(result.current).toBe('existing-fingerprint')
    await waitFor(() => {
      expect(callCount).toBe(0)
    })
  })

  it('쿠키에 값이 없으면 마운트 시 발급 API를 호출해 값을 받아오고 쿠키에 저장한다', async () => {
    server.use(
      http.get('*/v1/user/fingerprint', () =>
        HttpResponse.json({
          result: true,
          statusCode: 200,
          data: { fingerprintCode: 'issued-fingerprint' },
          message: [],
        })
      )
    )

    const { result } = renderHook(() => useFingerprint(), { wrapper: AllTheProviders })

    expect(result.current).toBeNull()

    await waitFor(() => {
      expect(result.current).toBe('issued-fingerprint')
    })
    expect(useFingerprintStore.getState().fingerprintCode).toBe('issued-fingerprint')
  })

  it('발급에 실패하면 null을 유지하되, 원인 추적을 위해 콘솔에는 남긴다', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    let callCount = 0
    server.use(
      http.get('*/v1/user/fingerprint', () => {
        callCount += 1
        return HttpResponse.json(
          { result: false, statusCode: 500, data: null, message: ['서버 오류'] },
          { status: 500 }
        )
      })
    )

    const { result } = renderHook(() => useFingerprint(), { wrapper: AllTheProviders })

    await waitFor(() => {
      expect(callCount).toBe(1)
    })
    expect(result.current).toBeNull()
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[useFingerprint] 브라우저 지문 코드 발급 실패:',
        expect.anything()
      )
    })

    consoleErrorSpy.mockRestore()
  })
})
