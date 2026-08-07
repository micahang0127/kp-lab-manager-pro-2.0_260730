import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { cleanup, render, screen } from '../../test/test-utils'
import { AddressSearchButton } from './AddressSearchButton'
import { loadDaumPostcodeScript } from './loadDaumPostcodeScript'
import type { DaumPostcodeOptions } from './types'

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

describe('AddressSearchButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.daum = undefined
  })

  afterEach(() => {
    cleanup()
    window.daum = undefined
  })

  it('버튼 클릭 시 주소 선택 완료되면 onComplete로 주소를 전달한다', async () => {
    vi.mocked(loadDaumPostcodeScript).mockResolvedValue(undefined)
    window.daum = { Postcode: FakePostcode }
    const onComplete = vi.fn()

    render(<AddressSearchButton onComplete={onComplete} />)
    await userEvent.click(screen.getByRole('button', { name: '주소검색' }))

    expect(onComplete).toHaveBeenCalledWith('서울 강남구 테헤란로 1')
  })

  it('스크립트 로드에 실패하면 에러 문구를 표시한다', async () => {
    vi.mocked(loadDaumPostcodeScript).mockRejectedValue(
      new Error('주소 검색 서비스를 불러오지 못했습니다.')
    )

    render(<AddressSearchButton onComplete={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: '주소검색' }))

    expect(await screen.findByText('주소 검색 서비스를 불러오지 못했습니다.')).toBeInTheDocument()
  })

  it('주소를 선택하지 않고 팝업을 닫으면 버튼이 다시 클릭 가능한 상태로 돌아온다', async () => {
    vi.mocked(loadDaumPostcodeScript).mockResolvedValue(undefined)
    window.daum = { Postcode: FakePostcodeClosedWithoutSelecting }

    render(<AddressSearchButton onComplete={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: '주소검색' }))

    expect(await screen.findByRole('button', { name: '주소검색' })).not.toBeDisabled()
  })

  it('label prop으로 버튼 문구를 바꿀 수 있다', () => {
    render(<AddressSearchButton label="주소 찾기" onComplete={vi.fn()} />)

    expect(screen.getByRole('button', { name: '주소 찾기' })).toBeInTheDocument()
  })
})
