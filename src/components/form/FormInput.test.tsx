import { createRef } from 'react'

import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { cleanup, render, screen } from '../../test/test-utils'
import { FormInput } from './FormInput'

afterEach(() => {
  cleanup()
})

describe('FormInput', () => {
  it('label과 input이 접근성 있게 연결되어 렌더링된다', () => {
    render(<FormInput id="email" label="이메일" value="" onChange={vi.fn()} />)

    expect(screen.getByLabelText('이메일')).toBeInTheDocument()
  })

  it('입력 시 onChange가 호출된다', async () => {
    const handleChange = vi.fn()
    render(<FormInput id="email" label="이메일" value="" onChange={handleChange} />)

    await userEvent.type(screen.getByLabelText('이메일'), 'a')

    expect(handleChange).toHaveBeenCalled()
  })

  it('disabled가 true이면 input이 비활성화된다', () => {
    render(<FormInput id="name" label="이름" value="홍길동" onChange={vi.fn()} disabled />)

    expect(screen.getByLabelText('이름')).toBeDisabled()
  })

  it('message가 없으면 하단 문구를 렌더링하지 않는다', () => {
    render(<FormInput id="email" label="이메일" value="" onChange={vi.fn()} />)

    expect(screen.queryByText(/./, { selector: 'p' })).not.toBeInTheDocument()
  })

  it('message가 있으면 기본 색상(red)으로 렌더링된다', () => {
    render(<FormInput id="email" label="이메일" value="" onChange={vi.fn()} message="에러 문구" />)

    expect(screen.getByText('에러 문구')).toHaveClass('text-red-600')
  })

  it('messageColor를 지정하면 해당 색상 클래스가 적용된다', () => {
    render(
      <FormInput
        id="email"
        label="이메일"
        value=""
        onChange={vi.fn()}
        message="성공 문구"
        messageColor="green"
      />
    )

    expect(screen.getByText('성공 문구')).toHaveClass('text-green-600')
  })

  it('maxLength/inputMode/inputClassName이 input에 그대로 적용된다 (OTP 입력 등 특수 케이스)', () => {
    render(
      <FormInput
        id="otp-code"
        label="인증번호"
        value=""
        onChange={vi.fn()}
        maxLength={6}
        inputMode="numeric"
        inputClassName="text-center font-mono tracking-widest"
      />
    )

    const input = screen.getByLabelText('인증번호')
    expect(input).toHaveAttribute('maxlength', '6')
    expect(input).toHaveAttribute('inputmode', 'numeric')
    expect(input).toHaveClass('text-center', 'font-mono', 'tracking-widest')
  })

  it('required가 true이면 라벨 옆에 필수 표시가 렌더링되고 label 접근성 텍스트는 그대로 유지된다', () => {
    const { container } = render(
      <FormInput id="email" label="이메일" value="" onChange={vi.fn()} required />
    )

    expect(screen.getByLabelText('이메일')).toBeInTheDocument()
    expect(container.querySelector('label')).toHaveTextContent('이메일')
    expect(container.textContent).toContain('*')
  })

  it('required가 없으면 필수 표시가 렌더링되지 않는다', () => {
    const { container } = render(
      <FormInput id="email" label="이메일" value="" onChange={vi.fn()} />
    )

    expect(container.textContent).not.toContain('*')
  })

  it('required가 true여도 hideRequiredMark가 true이면 필수 표시(*)가 렌더링되지 않는다 (input의 required 속성은 유지)', () => {
    const { container } = render(
      <FormInput id="email" label="이메일" value="" onChange={vi.fn()} required hideRequiredMark />
    )

    expect(container.textContent).not.toContain('*')
    expect(screen.getByLabelText('이메일')).toBeRequired()
  })

  it('placeholder가 지정되면 input에 표시된다', () => {
    render(
      <FormInput
        id="email"
        label="이메일"
        value=""
        onChange={vi.fn()}
        placeholder="이메일을 입력하세요."
      />
    )

    expect(screen.getByPlaceholderText('이메일을 입력하세요.')).toBeInTheDocument()
  })

  it('ref를 전달하면 input DOM에 연결된다 (마운트 시 자동 포커스 등에서 활용)', () => {
    const ref = createRef<HTMLInputElement>()
    render(<FormInput ref={ref} id="email" label="이메일" value="" onChange={vi.fn()} />)

    expect(ref.current).toBe(screen.getByLabelText('이메일'))
  })

  it('addon이 주어지면 input과 함께 렌더링된다 (예: 사업장 소재지의 주소검색 버튼)', () => {
    render(
      <FormInput
        id="address"
        label="사업장 소재지"
        value=""
        onChange={vi.fn()}
        addon={<button type="button">주소검색</button>}
      />
    )

    expect(screen.getByLabelText('사업장 소재지')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '주소검색' })).toBeInTheDocument()
  })
})
