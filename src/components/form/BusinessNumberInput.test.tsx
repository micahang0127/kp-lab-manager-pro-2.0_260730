import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { cleanup, render, screen } from '../../test/test-utils'
import { BusinessNumberInput } from './BusinessNumberInput'

afterEach(() => {
  cleanup()
})

/** userEvent로 여러 글자를 입력했을 때의 결과를 확인하기 위해 실제 사용처처럼 상태를 들고 있는 래퍼 */
function ControlledBusinessNumberInput({
  initialValue = '',
  onChange,
}: {
  initialValue?: string
  onChange: (value: string) => void
}) {
  const [value, setValue] = useState(initialValue)

  return (
    <BusinessNumberInput
      id="bizNo"
      label="사업자등록번호"
      value={value}
      onChange={(next) => {
        setValue(next)
        onChange(next)
      }}
    />
  )
}

describe('BusinessNumberInput', () => {
  it('3칸이 각각 접근성 있게 렌더링된다', () => {
    render(<BusinessNumberInput id="bizNo" label="사업자등록번호" value="" onChange={vi.fn()} />)

    expect(screen.getByLabelText('사업자등록번호 앞 3자리')).toBeInTheDocument()
    expect(screen.getByLabelText('사업자등록번호 중간 2자리')).toBeInTheDocument()
    expect(screen.getByLabelText('사업자등록번호 뒤 5자리')).toBeInTheDocument()
  })

  it('각 칸에 입력한 값이 하이픈으로 합쳐져 onChange로 전달된다', async () => {
    const handleChange = vi.fn()
    render(<ControlledBusinessNumberInput onChange={handleChange} />)

    await userEvent.type(screen.getByLabelText('사업자등록번호 앞 3자리'), '123')
    await userEvent.type(screen.getByLabelText('사업자등록번호 중간 2자리'), '45')
    await userEvent.type(screen.getByLabelText('사업자등록번호 뒤 5자리'), '67890')

    expect(handleChange).toHaveBeenLastCalledWith('123-45-67890')
  })

  it('숫자 이외의 문자는 필터링된다', async () => {
    const handleChange = vi.fn()
    render(<ControlledBusinessNumberInput onChange={handleChange} />)

    await userEvent.type(screen.getByLabelText('사업자등록번호 앞 3자리'), 'a1b2c')

    expect(handleChange).toHaveBeenLastCalledWith('12--')
  })

  it('각 칸은 maxLength(3/2/5)로 제한된다', () => {
    render(<BusinessNumberInput id="bizNo" label="사업자등록번호" value="" onChange={vi.fn()} />)

    expect(screen.getByLabelText('사업자등록번호 앞 3자리')).toHaveAttribute('maxlength', '3')
    expect(screen.getByLabelText('사업자등록번호 중간 2자리')).toHaveAttribute('maxlength', '2')
    expect(screen.getByLabelText('사업자등록번호 뒤 5자리')).toHaveAttribute('maxlength', '5')
  })

  it('첫째 칸을 다 채우면 둘째 칸으로 자동 포커스 이동한다', async () => {
    render(<ControlledBusinessNumberInput onChange={vi.fn()} />)

    await userEvent.type(screen.getByLabelText('사업자등록번호 앞 3자리'), '123')

    expect(screen.getByLabelText('사업자등록번호 중간 2자리')).toHaveFocus()
  })

  it('둘째 칸을 다 채우면 셋째 칸으로 자동 포커스 이동한다', async () => {
    render(<ControlledBusinessNumberInput initialValue="123" onChange={vi.fn()} />)

    await userEvent.type(screen.getByLabelText('사업자등록번호 중간 2자리'), '45')

    expect(screen.getByLabelText('사업자등록번호 뒤 5자리')).toHaveFocus()
  })

  it('disabled가 true이면 3칸 모두 비활성화된다', () => {
    render(
      <BusinessNumberInput id="bizNo" label="사업자등록번호" value="" onChange={vi.fn()} disabled />
    )

    expect(screen.getByLabelText('사업자등록번호 앞 3자리')).toBeDisabled()
    expect(screen.getByLabelText('사업자등록번호 중간 2자리')).toBeDisabled()
    expect(screen.getByLabelText('사업자등록번호 뒤 5자리')).toBeDisabled()
  })

  it('message가 있으면 기본 색상(red)으로 렌더링된다', () => {
    render(
      <BusinessNumberInput
        id="bizNo"
        label="사업자등록번호"
        value="123"
        onChange={vi.fn()}
        message="형식이 올바르지 않습니다."
      />
    )

    expect(screen.getByText('형식이 올바르지 않습니다.')).toHaveClass('text-red-600')
  })

  it('messageColor를 지정하면 해당 색상 클래스가 적용된다', () => {
    render(
      <BusinessNumberInput
        id="bizNo"
        label="사업자등록번호"
        value="123-45-67890"
        onChange={vi.fn()}
        message="확인되었습니다."
        messageColor="green"
      />
    )

    expect(screen.getByText('확인되었습니다.')).toHaveClass('text-green-600')
  })

  it('required가 true이면 라벨 옆에 필수 표시가 렌더링된다', () => {
    const { container } = render(
      <BusinessNumberInput id="bizNo" label="사업자등록번호" value="" onChange={vi.fn()} required />
    )

    expect(container.querySelector('span')).toHaveTextContent('사업자등록번호*')
  })

  it('required가 없으면 필수 표시가 렌더링되지 않는다', () => {
    const { container } = render(
      <BusinessNumberInput id="bizNo" label="사업자등록번호" value="" onChange={vi.fn()} />
    )

    expect(container.querySelector('span')).not.toHaveTextContent('*')
  })
})
