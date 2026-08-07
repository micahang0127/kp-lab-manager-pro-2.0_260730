import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { cleanup, render, screen } from '../../test/test-utils'
import { FormCheckbox } from './FormCheckbox'

afterEach(() => {
  cleanup()
})

describe('FormCheckbox', () => {
  it('label과 checkbox가 접근성 있게 연결되어 렌더링된다', () => {
    render(
      <FormCheckbox id="agree-terms" label="이용약관 동의" checked={false} onChange={vi.fn()} />
    )

    expect(screen.getByLabelText('이용약관 동의')).toBeInTheDocument()
  })

  it('checked 값에 따라 체크 상태가 반영된다', () => {
    render(<FormCheckbox id="agree-terms" label="이용약관 동의" checked onChange={vi.fn()} />)

    expect(screen.getByLabelText('이용약관 동의')).toBeChecked()
  })

  it('클릭 시 반전된 checked 값으로 onChange가 호출된다', async () => {
    const handleChange = vi.fn()
    render(
      <FormCheckbox
        id="agree-terms"
        label="이용약관 동의"
        checked={false}
        onChange={handleChange}
      />
    )

    await userEvent.click(screen.getByLabelText('이용약관 동의'))

    expect(handleChange).toHaveBeenCalledWith(true)
  })

  it('disabled가 true이면 checkbox가 비활성화된다', () => {
    render(
      <FormCheckbox
        id="agree-terms"
        label="이용약관 동의"
        checked={false}
        onChange={vi.fn()}
        disabled
      />
    )

    expect(screen.getByLabelText('이용약관 동의')).toBeDisabled()
  })

  it('labelClassName을 지정하면 해당 클래스가 라벨에 적용된다 (전체 동의 강조 등)', () => {
    render(
      <FormCheckbox
        id="agree-all"
        label="전체 동의"
        checked={false}
        onChange={vi.fn()}
        labelClassName="text-sm font-medium text-gray-900"
      />
    )

    expect(screen.getByText('전체 동의')).toHaveClass('font-medium', 'text-gray-900')
  })
})
