import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { DaumPostcodeOptions } from './types'

// loadPromise가 모듈 스코프 캐시이므로 테스트마다 모듈을 새로 불러와 격리한다.

const SCRIPT_ID = 'daum-postcode-script'

class FakePostcode {
  constructor(_options: DaumPostcodeOptions) {}
  open() {}
}

describe('loadDaumPostcodeScript', () => {
  beforeEach(() => {
    vi.resetModules()
    document.head.innerHTML = ''
    window.daum = undefined
  })

  afterEach(() => {
    document.head.innerHTML = ''
    window.daum = undefined
  })

  it('이미 daum.Postcode가 있으면 스크립트를 추가하지 않고 즉시 resolve한다', async () => {
    window.daum = { Postcode: FakePostcode }
    const { loadDaumPostcodeScript } = await import('./loadDaumPostcodeScript')

    await expect(loadDaumPostcodeScript()).resolves.toBeUndefined()
    expect(document.getElementById(SCRIPT_ID)).toBeNull()
  })

  it('스크립트가 없으면 head에 <script>를 추가하고 로드 성공 시 resolve한다', async () => {
    const { loadDaumPostcodeScript } = await import('./loadDaumPostcodeScript')

    const promise = loadDaumPostcodeScript()
    const script = document.getElementById(SCRIPT_ID)
    expect(script).not.toBeNull()

    script?.dispatchEvent(new Event('load'))
    await expect(promise).resolves.toBeUndefined()
  })

  it('스크립트 로드에 실패하면 reject한다', async () => {
    const { loadDaumPostcodeScript } = await import('./loadDaumPostcodeScript')

    const promise = loadDaumPostcodeScript()
    const script = document.getElementById(SCRIPT_ID)

    script?.dispatchEvent(new Event('error'))
    await expect(promise).rejects.toThrow('주소 검색 서비스를 불러오지 못했습니다.')
  })

  it('동시에 여러 번 호출해도 스크립트는 한 번만 추가된다', async () => {
    const { loadDaumPostcodeScript } = await import('./loadDaumPostcodeScript')

    const promise1 = loadDaumPostcodeScript()
    const promise2 = loadDaumPostcodeScript()

    expect(document.querySelectorAll(`#${SCRIPT_ID}`)).toHaveLength(1)

    document.getElementById(SCRIPT_ID)?.dispatchEvent(new Event('load'))
    await Promise.all([promise1, promise2])
  })
})
