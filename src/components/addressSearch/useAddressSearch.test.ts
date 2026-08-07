import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { act, renderHook } from '../../test/test-utils'
import { loadDaumPostcodeScript } from './loadDaumPostcodeScript'
import type { DaumPostcodeOptions } from './types'
import { useAddressSearch } from './useAddressSearch'

// ─── Mocks ────────────────────────────────────────────────────────────────────
// Daum 팝업은 jsdom에서 실행 불가하므로 스크립트 로딩과 window.daum을 모킹한다.

vi.mock('./loadDaumPostcodeScript', () => ({
  loadDaumPostcodeScript: vi.fn(),
}))

class FakePostcode {
  private options: DaumPostcodeOptions

  constructor(options: DaumPostcodeOptions) {
    this.options = options
  }

  open() {
    this.options.oncomplete({
      zonecode: '06123',
      address: '서울 강남구 역삼동',
      roadAddress: '서울 강남구 테헤란로 1',
      jibunAddress: '역삼동 1',
    })
  }
}

class FakePostcodeWithoutRoadAddress {
  private options: DaumPostcodeOptions

  constructor(options: DaumPostcodeOptions) {
    this.options = options
  }

  open() {
    this.options.oncomplete({
      zonecode: '06123',
      address: '서울 강남구 역삼동',
      roadAddress: '',
      jibunAddress: '역삼동 1',
    })
  }
}

/** 주소를 선택하지 않고 팝업을 닫는 경우(onclose만 호출됨)를 시뮬레이션한다 */
class FakePostcodeClosedWithoutSelecting {
  private options: DaumPostcodeOptions

  constructor(options: DaumPostcodeOptions) {
    this.options = options
  }

  open() {
    this.options.onclose?.()
  }
}

describe('useAddressSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.daum = undefined
  })

  afterEach(() => {
    window.daum = undefined
  })

  it('주소 선택 완료 시 도로명주소를 onComplete로 전달하고 상태가 idle로 돌아온다', async () => {
    vi.mocked(loadDaumPostcodeScript).mockResolvedValue(undefined)
    window.daum = { Postcode: FakePostcode }
    const onComplete = vi.fn()

    const { result } = renderHook(() => useAddressSearch(onComplete))
    await act(async () => {
      await result.current.search()
    })

    expect(onComplete).toHaveBeenCalledWith('서울 강남구 테헤란로 1')
  })

  it('roadAddress가 없으면 address를 onComplete로 전달한다', async () => {
    vi.mocked(loadDaumPostcodeScript).mockResolvedValue(undefined)
    window.daum = { Postcode: FakePostcodeWithoutRoadAddress }
    const onComplete = vi.fn()

    const { result } = renderHook(() => useAddressSearch(onComplete))
    await act(async () => {
      await result.current.search()
    })

    expect(onComplete).toHaveBeenCalledWith('서울 강남구 역삼동')
  })

  it('주소를 선택하지 않고 팝업을 닫으면 상태가 idle로 돌아온다', async () => {
    vi.mocked(loadDaumPostcodeScript).mockResolvedValue(undefined)
    window.daum = { Postcode: FakePostcodeClosedWithoutSelecting }
    const onComplete = vi.fn()

    const { result } = renderHook(() => useAddressSearch(onComplete))
    await act(async () => {
      await result.current.search()
    })

    expect(result.current.status).toBe('idle')
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('스크립트 로드에 실패하면 에러 상태와 메시지를 노출한다', async () => {
    vi.mocked(loadDaumPostcodeScript).mockRejectedValue(
      new Error('주소 검색 서비스를 불러오지 못했습니다.')
    )

    const { result } = renderHook(() => useAddressSearch(vi.fn()))
    await act(async () => {
      await result.current.search()
    })

    expect(result.current.status).toBe('error')
    expect(result.current.error).toBe('주소 검색 서비스를 불러오지 못했습니다.')
  })
})
