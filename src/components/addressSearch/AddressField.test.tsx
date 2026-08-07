import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { cleanup, render, screen } from '../../test/test-utils'
import { AddressField } from './AddressField'

// ─── Mocks ────────────────────────────────────────────────────────────────────
// Daum 팝업은 jsdom에서 실행 불가하므로 주소검색 버튼을 텍스트 버튼으로 모킹한다.

vi.mock('./AddressSearchButton', () => ({
  AddressSearchButton: ({ onComplete }: { onComplete: (address: string) => void }) => (
    <button type="button" onClick={() => onComplete('서울시 강남구 테헤란로 1')}>
      address-search-mock
    </button>
  ),
}))

afterEach(() => {
  cleanup()
})

describe('AddressField', () => {
  it('대표 주소 입력창은 항상 disabled 상태라 직접 수정할 수 없다', () => {
    render(
      <AddressField
        id="businessAddress"
        label="사업장 소재지"
        address=""
        onAddressChange={vi.fn()}
        addressDetail=""
        onAddressDetailChange={vi.fn()}
      />
    )

    expect(screen.getByLabelText('사업장 소재지')).toBeDisabled()
  })

  it('주소검색 버튼을 클릭하면 대표 주소가 onAddressChange로 전달된다', async () => {
    const handleAddressChange = vi.fn()
    render(
      <AddressField
        id="businessAddress"
        label="사업장 소재지"
        address=""
        onAddressChange={handleAddressChange}
        addressDetail=""
        onAddressDetailChange={vi.fn()}
      />
    )

    await userEvent.click(screen.getByText('address-search-mock'))

    expect(handleAddressChange).toHaveBeenCalledWith('서울시 강남구 테헤란로 1')
  })

  it('상세주소는 별도 라벨 텍스트 없이 aria-label로만 접근할 수 있다', () => {
    render(
      <AddressField
        id="businessAddress"
        label="사업장 소재지"
        address=""
        onAddressChange={vi.fn()}
        addressDetail=""
        onAddressDetailChange={vi.fn()}
      />
    )

    expect(screen.getByLabelText('상세주소')).toBeInTheDocument()
    expect(screen.queryByText('상세주소')).not.toBeInTheDocument()
  })

  it('상세주소를 입력하면 onAddressDetailChange가 호출된다', async () => {
    const handleAddressDetailChange = vi.fn()
    render(
      <AddressField
        id="businessAddress"
        label="사업장 소재지"
        address=""
        onAddressChange={vi.fn()}
        addressDetail=""
        onAddressDetailChange={handleAddressDetailChange}
      />
    )

    await userEvent.type(screen.getByLabelText('상세주소'), '3')

    expect(handleAddressDetailChange).toHaveBeenCalledWith('3')
  })

  it('message가 있으면 기본 색상(red)으로 렌더링된다', () => {
    render(
      <AddressField
        id="businessAddress"
        label="사업장 소재지"
        address=""
        onAddressChange={vi.fn()}
        addressDetail=""
        onAddressDetailChange={vi.fn()}
        message="주소를 입력해주세요."
      />
    )

    expect(screen.getByText('주소를 입력해주세요.')).toHaveClass('text-red-600')
  })

  it('disabled 시 주소검색 버튼이 렌더링되지 않는다', () => {
    render(
      <AddressField
        id="businessAddress"
        label="사업장 소재지"
        disabled
        address="서울시 강남구 테헤란로 1"
        onAddressChange={vi.fn()}
        addressDetail=""
        onAddressDetailChange={vi.fn()}
      />
    )

    expect(screen.queryByText('address-search-mock')).not.toBeInTheDocument()
  })

  it('상세주소는 100자를 초과하여 입력할 수 없다', () => {
    render(
      <AddressField
        id="businessAddress"
        label="사업장 소재지"
        address=""
        onAddressChange={vi.fn()}
        addressDetail=""
        onAddressDetailChange={vi.fn()}
      />
    )

    expect(screen.getByLabelText('상세주소')).toHaveAttribute('maxLength', '100')
  })

  it('disabled 시 상세주소 입력창도 잠긴다', () => {
    render(
      <AddressField
        id="businessAddress"
        label="사업장 소재지"
        disabled
        address="서울시 강남구 테헤란로 1"
        onAddressChange={vi.fn()}
        addressDetail="3층 301호"
        onAddressDetailChange={vi.fn()}
      />
    )

    expect(screen.getByLabelText('상세주소')).toBeDisabled()
  })
})
