import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { render, screen } from '../../test/test-utils'
import { EmailCodeInput } from './EmailCodeInput'

describe('EmailCodeInput', () => {
  it('length만큼 입력칸을 렌더링한다', () => {
    render(<EmailCodeInput value="" onChange={vi.fn()} ariaLabel="인증번호" />)

    expect(screen.getAllByRole('textbox')).toHaveLength(6)
  })

  it('첫 번째 칸에 숫자를 입력하면 전체 값이 갱신되고 다음 칸으로 포커스가 이동한다', async () => {
    const handleChange = vi.fn()
    render(<EmailCodeInput value="" onChange={handleChange} ariaLabel="인증번호" />)

    const firstBox = screen.getByLabelText('인증번호 1번째 자리')
    const secondBox = screen.getByLabelText('인증번호 2번째 자리')

    await userEvent.type(firstBox, '1')

    expect(handleChange).toHaveBeenCalledWith('1')
    expect(secondBox).toHaveFocus()
  })

  it('숫자가 아닌 문자는 입력되지 않는다', async () => {
    const handleChange = vi.fn()
    render(<EmailCodeInput value="" onChange={handleChange} ariaLabel="인증번호" />)

    await userEvent.type(screen.getByLabelText('인증번호 1번째 자리'), 'a')

    expect(handleChange).not.toHaveBeenCalled()
  })

  it('빈 칸에서 Backspace를 누르면 이전 칸으로 포커스가 이동하고 이전 칸 값이 지워진다', async () => {
    const handleChange = vi.fn()
    render(<EmailCodeInput value="12" onChange={handleChange} ariaLabel="인증번호" />)

    const thirdBox = screen.getByLabelText('인증번호 3번째 자리')
    thirdBox.focus()

    await userEvent.keyboard('{Backspace}')

    expect(handleChange).toHaveBeenCalledWith('1')
    expect(screen.getByLabelText('인증번호 2번째 자리')).toHaveFocus()
  })

  it('첫 번째 칸에 6자리 인증번호를 붙여넣으면 전체 칸에 분배되고 마지막 칸으로 포커스가 이동한다', async () => {
    const handleChange = vi.fn()
    render(<EmailCodeInput value="" onChange={handleChange} ariaLabel="인증번호" />)

    const firstBox = screen.getByLabelText('인증번호 1번째 자리')
    firstBox.focus()
    await userEvent.paste('123456')

    expect(handleChange).toHaveBeenCalledWith('123456')
    expect(screen.getByLabelText('인증번호 6번째 자리')).toHaveFocus()
  })

  it('숫자가 아닌 문자가 섞여 붙여넣어져도 숫자만 추출해 채운다', async () => {
    const handleChange = vi.fn()
    render(<EmailCodeInput value="" onChange={handleChange} ariaLabel="인증번호" />)

    screen.getByLabelText('인증번호 1번째 자리').focus()
    await userEvent.paste('12-34 56')

    expect(handleChange).toHaveBeenCalledWith('123456')
  })

  it('중간 칸에 붙여넣으면 해당 칸부터 이어서 채운다', async () => {
    const handleChange = vi.fn()
    render(<EmailCodeInput value="12" onChange={handleChange} ariaLabel="인증번호" />)

    screen.getByLabelText('인증번호 3번째 자리').focus()
    await userEvent.paste('3456')

    expect(handleChange).toHaveBeenCalledWith('123456')
    expect(screen.getByLabelText('인증번호 6번째 자리')).toHaveFocus()
  })

  it('error가 true면 모든 칸이 빨간색 테두리와 배경으로 표시된다', () => {
    render(<EmailCodeInput value="12" onChange={vi.fn()} ariaLabel="인증번호" error />)

    screen.getAllByRole('textbox').forEach((box) => {
      expect(box).toHaveClass('border-[#d44038]')
      expect(box).toHaveClass('bg-[#d44038]/20')
    })
  })

  it('disabled면 모든 입력칸이 비활성화된다', () => {
    render(<EmailCodeInput value="" onChange={vi.fn()} ariaLabel="인증번호" disabled />)

    screen.getAllByRole('textbox').forEach((box) => {
      expect(box).toBeDisabled()
    })
  })

  it('값이 채워진 칸은 강조 테두리(노란색)와 옅은 배경으로 표시된다', () => {
    render(<EmailCodeInput value="12" onChange={vi.fn()} ariaLabel="인증번호" />)

    expect(screen.getByLabelText('인증번호 1번째 자리')).toHaveClass('border-[#fec741]')
    expect(screen.getByLabelText('인증번호 1번째 자리')).toHaveClass('bg-[#fec741]/20')
    expect(screen.getByLabelText('인증번호 3번째 자리')).toHaveClass('border-[#c9c9c4]')
  })
})
