import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { fireEvent, render, screen } from '../../test/test-utils'
import { PasswordField } from './PasswordField'

/** value를 스스로 들고 있는 컨트롤드 래퍼 — 실제 사용 화면처럼 onChange로 값이 반영되는지 확인할 때 사용 */
function ControlledPasswordField() {
  const [value, setValue] = useState('')
  return <PasswordField id="password" label="비밀번호" value={value} onChange={setValue} />
}

describe('PasswordField', () => {
  it('label과 placeholder를 렌더링한다', () => {
    render(<PasswordField id="password" label="비밀번호 *" value="" onChange={vi.fn()} />)

    expect(screen.getByLabelText('비밀번호 *')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('비밀번호를 입력해 주세요')).toBeInTheDocument()
  })

  it('항상 마스킹(type=password)되고, 표시/숨기기 토글 버튼을 렌더링하지 않는다', () => {
    render(<PasswordField id="password" label="비밀번호" value="abcd1234" onChange={vi.fn()} />)

    expect(screen.getByLabelText('비밀번호')).toHaveAttribute('type', 'password')
    expect(screen.queryByRole('button', { name: '비밀번호 표시' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '비밀번호 숨기기' })).not.toBeInTheDocument()
  })

  it('값이 없으면 지우기 버튼을 렌더링하지 않는다', () => {
    render(<PasswordField id="password" label="비밀번호" value="" onChange={vi.fn()} />)

    expect(screen.queryByRole('button', { name: '입력값 지우기' })).not.toBeInTheDocument()
  })

  it('값이 있으면 지우기 버튼을 렌더링하고, 클릭하면 onChange에 빈 문자열을 전달한다', async () => {
    const handleChange = vi.fn()
    render(
      <PasswordField id="password" label="비밀번호" value="abcd1234" onChange={handleChange} />
    )

    await userEvent.click(screen.getByRole('button', { name: '입력값 지우기' }))

    expect(handleChange).toHaveBeenCalledWith('')
  })

  it('입력 시 한글·공백 등 허용되지 않는 문자가 제거된 값을 onChange로 전달한다', async () => {
    render(<ControlledPasswordField />)

    await userEvent.type(screen.getByLabelText('비밀번호'), 'ab한글 12')

    expect(screen.getByLabelText('비밀번호')).toHaveValue('ab12')
  })

  it('한글 입력을 시도하면 전용 안내 문구를 표시하고 테두리를 빨간색으로 강조한다', async () => {
    render(<PasswordField id="password" label="비밀번호" value="" onChange={vi.fn()} />)

    const input = screen.getByLabelText('비밀번호')
    await userEvent.type(input, '한글')

    expect(screen.getByText('한글은 입력할 수 없습니다.')).toBeInTheDocument()
  })

  it('한글 입력 시도 후 정상 문자를 입력하면 한글 안내 문구가 사라진다', async () => {
    render(<PasswordField id="password" label="비밀번호" value="" onChange={vi.fn()} />)

    const input = screen.getByLabelText('비밀번호')
    await userEvent.type(input, '한글')
    expect(screen.getByText('한글은 입력할 수 없습니다.')).toBeInTheDocument()

    await userEvent.type(input, 'a')
    expect(screen.queryByText('한글은 입력할 수 없습니다.')).not.toBeInTheDocument()
  })

  it('한글 입력 시도가 없으면 error prop으로 전달된 메시지를 표시한다', () => {
    render(
      <PasswordField
        id="password"
        label="비밀번호"
        value="abc"
        onChange={vi.fn()}
        error="비밀번호는 영문과 숫자를 포함하여 8자리 이상 입력해주세요."
      />
    )

    expect(
      screen.getByText('비밀번호는 영문과 숫자를 포함하여 8자리 이상 입력해주세요.')
    ).toBeInTheDocument()
  })

  it('한글 입력 시도 중에는 error prop 대신 한글 안내 문구를 우선 표시한다', async () => {
    render(
      <PasswordField
        id="password"
        label="비밀번호"
        value="abc"
        onChange={vi.fn()}
        error="비밀번호는 영문과 숫자를 포함하여 8자리 이상 입력해주세요."
      />
    )

    await userEvent.type(screen.getByLabelText('비밀번호'), '한')

    expect(screen.getByText('한글은 입력할 수 없습니다.')).toBeInTheDocument()
    expect(
      screen.queryByText('비밀번호는 영문과 숫자를 포함하여 8자리 이상 입력해주세요.')
    ).not.toBeInTheDocument()
  })

  it('한글(IME) 조합이 시작된 것만으로는 안내 문구를 표시하지 않는다 — 영문 입력 중 오탐 방지', () => {
    const handleChange = vi.fn()
    render(<PasswordField id="password" label="비밀번호" value="ab" onChange={handleChange} />)

    const input = screen.getByLabelText('비밀번호')
    fireEvent.compositionStart(input)

    expect(screen.queryByText('한글은 입력할 수 없습니다.')).not.toBeInTheDocument()
  })

  it('한글(IME) 조합 중 실제로 한글이 포함된 값이 오면 즉시 안내 문구를 표시하고, 값을 바꾸지 않는다', () => {
    const handleChange = vi.fn()
    render(<PasswordField id="password" label="비밀번호" value="ab" onChange={handleChange} />)

    const input = screen.getByLabelText('비밀번호')
    fireEvent.compositionStart(input)

    // 조합 중에는 매 키 입력마다 오는 change 이벤트를 무시해야 브라우저의 IME 조합이
    // 깨지지 않는다(조합이 깨지면 엉뚱한 영문자가 커밋되는 문제가 있었음)
    fireEvent.change(input, { target: { value: 'abㄱ' } })
    expect(screen.getByText('한글은 입력할 수 없습니다.')).toBeInTheDocument()
    expect(handleChange).not.toHaveBeenCalled()
  })

  it('한글(IME) 조합 이벤트가 발생해도 조합 중인 값에 한글이 없으면(영문 조합 등) 값을 그대로 반영한다', () => {
    const handleChange = vi.fn()
    render(<PasswordField id="password" label="비밀번호" value="ab" onChange={handleChange} />)

    const input = screen.getByLabelText('비밀번호')
    fireEvent.compositionStart(input)
    fireEvent.change(input, { target: { value: 'abc' } })

    expect(screen.queryByText('한글은 입력할 수 없습니다.')).not.toBeInTheDocument()
    expect(handleChange).toHaveBeenCalledWith('abc')
  })

  it('한글(IME) 조합이 끝나면 그 시점의 최종 값에서 한글을 제거해 반영한다', () => {
    const handleChange = vi.fn()
    render(<PasswordField id="password" label="비밀번호" value="ab" onChange={handleChange} />)

    const input = screen.getByLabelText('비밀번호')
    fireEvent.compositionStart(input)
    fireEvent.compositionEnd(input, { target: { value: 'ab가1' } })

    expect(handleChange).toHaveBeenCalledWith('ab1')
  })

  it('에러가 없으면 안내 문구를 렌더링하지 않는다', () => {
    render(<PasswordField id="password" label="비밀번호" value="abcd1234" onChange={vi.fn()} />)

    expect(screen.queryByText(/./, { selector: 'p.text-red-600' })).not.toBeInTheDocument()
  })

  it('hint prop이 있고 에러가 없으면 hint 문구를 항상 표시한다', () => {
    render(
      <PasswordField
        id="password"
        label="비밀번호"
        value=""
        onChange={vi.fn()}
        hint="영문과 숫자를 포함하여 8자리 이상 입력해주세요."
      />
    )

    expect(screen.getByText('영문과 숫자를 포함하여 8자리 이상 입력해주세요.')).toBeInTheDocument()
  })

  it('error가 있으면 hint 대신 error 문구를 표시한다', () => {
    render(
      <PasswordField
        id="password"
        label="비밀번호"
        value="abc"
        onChange={vi.fn()}
        error="비밀번호는 영문과 숫자를 포함하여 8자리 이상 입력해주세요."
        hint="힌트 문구"
      />
    )

    expect(
      screen.getByText('비밀번호는 영문과 숫자를 포함하여 8자리 이상 입력해주세요.')
    ).toBeInTheDocument()
    expect(screen.queryByText('힌트 문구')).not.toBeInTheDocument()
  })

  it('한글 입력 시도 중에는 hint 대신 한글 안내 문구를 표시한다', async () => {
    render(
      <PasswordField id="password" label="비밀번호" value="" onChange={vi.fn()} hint="힌트 문구" />
    )

    await userEvent.type(screen.getByLabelText('비밀번호'), '한글')

    expect(screen.getByText('한글은 입력할 수 없습니다.')).toBeInTheDocument()
    expect(screen.queryByText('힌트 문구')).not.toBeInTheDocument()
  })
})
