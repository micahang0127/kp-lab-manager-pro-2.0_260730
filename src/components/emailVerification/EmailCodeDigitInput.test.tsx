import { createRef } from 'react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { render, screen } from '../../test/test-utils'
import { EmailCodeDigitInput } from './EmailCodeDigitInput'

describe('EmailCodeDigitInput', () => {
  it('ariaLabel로 접근 가능한 입력칸을 렌더링한다', () => {
    render(
      <EmailCodeDigitInput
        value=""
        onChange={vi.fn()}
        onKeyDown={vi.fn()}
        onPaste={vi.fn()}
        ariaLabel="인증번호 1번째 자리"
      />
    )

    expect(screen.getByLabelText('인증번호 1번째 자리')).toBeInTheDocument()
  })

  it('너비가 35px로 고정되어 있다', () => {
    render(
      <EmailCodeDigitInput
        value=""
        onChange={vi.fn()}
        onKeyDown={vi.fn()}
        onPaste={vi.fn()}
        ariaLabel="인증번호 1번째 자리"
      />
    )

    expect(screen.getByLabelText('인증번호 1번째 자리')).toHaveClass('w-[35px]')
  })

  it('값이 있으면 노란색 강조 테두리와 옅은 배경으로 표시된다', () => {
    render(
      <EmailCodeDigitInput
        value="1"
        onChange={vi.fn()}
        onKeyDown={vi.fn()}
        onPaste={vi.fn()}
        ariaLabel="인증번호 1번째 자리"
      />
    )

    const input = screen.getByLabelText('인증번호 1번째 자리')
    expect(input).toHaveClass('border-[#fec741]')
    expect(input).toHaveClass('bg-[#fec741]/20')
  })

  it('값이 없으면 회색 테두리로 표시된다', () => {
    render(
      <EmailCodeDigitInput
        value=""
        onChange={vi.fn()}
        onKeyDown={vi.fn()}
        onPaste={vi.fn()}
        ariaLabel="인증번호 1번째 자리"
      />
    )

    expect(screen.getByLabelText('인증번호 1번째 자리')).toHaveClass('border-[#c9c9c4]')
  })

  it('입력 시 onChange에 입력값을 그대로 전달한다', async () => {
    const handleChange = vi.fn()
    render(
      <EmailCodeDigitInput
        value=""
        onChange={handleChange}
        onKeyDown={vi.fn()}
        onPaste={vi.fn()}
        ariaLabel="인증번호 1번째 자리"
      />
    )

    await userEvent.type(screen.getByLabelText('인증번호 1번째 자리'), '1')

    expect(handleChange).toHaveBeenCalledWith('1')
  })

  it('붙여넣기 시 onPaste에 붙여넣은 텍스트를 그대로 전달하고 기본 붙여넣기 동작은 막는다', async () => {
    const handlePaste = vi.fn()
    render(
      <EmailCodeDigitInput
        value=""
        onChange={vi.fn()}
        onKeyDown={vi.fn()}
        onPaste={handlePaste}
        ariaLabel="인증번호 1번째 자리"
      />
    )

    const input = screen.getByLabelText('인증번호 1번째 자리')
    input.focus()
    await userEvent.paste('123456')

    expect(handlePaste).toHaveBeenCalledWith('123456')
    // maxLength=1인 input에 기본 붙여넣기가 그대로 동작했다면 첫 글자만 남았을 것 —
    // preventDefault로 막혔는지 확인 (분배 자체는 onPaste를 받는 상위 컴포넌트 책임)
    expect(input).toHaveValue('')
  })

  it('disabled면 입력칸이 비활성화된다', () => {
    render(
      <EmailCodeDigitInput
        value=""
        onChange={vi.fn()}
        onKeyDown={vi.fn()}
        onPaste={vi.fn()}
        ariaLabel="인증번호 1번째 자리"
        disabled
      />
    )

    expect(screen.getByLabelText('인증번호 1번째 자리')).toBeDisabled()
  })

  it('전달된 ref로 input DOM 노드에 접근할 수 있다', () => {
    const ref = createRef<HTMLInputElement>()
    render(
      <EmailCodeDigitInput
        ref={ref}
        value=""
        onChange={vi.fn()}
        onKeyDown={vi.fn()}
        onPaste={vi.fn()}
        ariaLabel="인증번호 1번째 자리"
      />
    )

    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })
})
