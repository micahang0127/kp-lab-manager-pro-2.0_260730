import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getCookie } from '../utils/cookie'
import { useFingerprintStore } from './fingerprintStore'

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365

describe('fingerprintStore', () => {
  beforeEach(() => {
    // 각 테스트 전 쿠키 + store 초기화
    document.cookie = 'fingerprintCode=; max-age=0; path=/'
    useFingerprintStore.setState({ fingerprintCode: null })
  })

  it('saveFingerprintCode()는 쿠키와 상태를 동시에 갱신한다', () => {
    useFingerprintStore.getState().saveFingerprintCode('904eT9hCwnwkSmjiDYeGnxmLdkMuHNQs')

    expect(getCookie('fingerprintCode')).toBe('904eT9hCwnwkSmjiDYeGnxmLdkMuHNQs')
    expect(useFingerprintStore.getState().fingerprintCode).toBe('904eT9hCwnwkSmjiDYeGnxmLdkMuHNQs')
  })

  it('saveFingerprintCode()로 저장한 값을 다시 saveFingerprintCode()로 덮어쓸 수 있다', () => {
    useFingerprintStore.getState().saveFingerprintCode('first-code')
    useFingerprintStore.getState().saveFingerprintCode('second-code')

    expect(getCookie('fingerprintCode')).toBe('second-code')
    expect(useFingerprintStore.getState().fingerprintCode).toBe('second-code')
  })

  describe('만료 슬라이딩 연장', () => {
    it('앱 로드(스토어 초기화) 시 쿠키에 기존 값이 있으면 만료 시각을 다시 1년 뒤로 연장한다', async () => {
      document.cookie = 'fingerprintCode=existing-code; path=/'

      // 스토어는 모듈 최상단에서 1회 생성되므로, "앱 재로드"를 재현하려면 모듈을 초기화 상태로
      // 되돌리고 다시 import해야 한다. fingerprintStore.ts가 내부에서 import하는 '../utils/cookie'도
      // 함께 새로 불러와야 같은 모듈 인스턴스의 setCookie를 스파이할 수 있다.
      vi.resetModules()
      const freshCookieUtils = await import('../utils/cookie')
      const setCookieSpy = vi.spyOn(freshCookieUtils, 'setCookie')
      const { useFingerprintStore: freshFingerprintStore } = await import('./fingerprintStore')

      expect(freshFingerprintStore.getState().fingerprintCode).toBe('existing-code')
      expect(setCookieSpy).toHaveBeenCalledWith(
        'fingerprintCode',
        'existing-code',
        ONE_YEAR_IN_SECONDS
      )
    })

    it('쿠키에 값이 없으면(브라우저 최초 방문) 만료 연장을 시도하지 않는다', async () => {
      vi.resetModules()
      const freshCookieUtils = await import('../utils/cookie')
      const setCookieSpy = vi.spyOn(freshCookieUtils, 'setCookie')
      const { useFingerprintStore: freshFingerprintStore } = await import('./fingerprintStore')

      expect(freshFingerprintStore.getState().fingerprintCode).toBeNull()
      expect(setCookieSpy).not.toHaveBeenCalled()
    })
  })
})
