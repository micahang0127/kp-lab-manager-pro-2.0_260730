import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { cleanup, render, screen } from '../../test/test-utils'
import { FormFileInput } from './FormFileInput'

afterEach(() => {
  cleanup()
})

describe('FormFileInput', () => {
  it('label과 input이 접근성 있게 연결되어 렌더링된다', () => {
    render(<FormFileInput id="license" label="사업자등록증" file={null} onChange={vi.fn()} />)

    expect(screen.getByLabelText('사업자등록증')).toBeInTheDocument()
  })

  it('파일 미선택 시 안내 문구를 표시한다', () => {
    render(<FormFileInput id="license" label="사업자등록증" file={null} onChange={vi.fn()} />)

    expect(screen.getByDisplayValue('선택된 파일이 없습니다.')).toBeInTheDocument()
  })

  it('파일을 선택하면 onChange가 File 객체로 호출된다', async () => {
    const handleChange = vi.fn()
    const file = new File(['dummy'], 'license.pdf', { type: 'application/pdf' })
    render(<FormFileInput id="license" label="사업자등록증" file={null} onChange={handleChange} />)

    await userEvent.upload(screen.getByLabelText('사업자등록증'), file)

    expect(handleChange).toHaveBeenCalledWith(file)
  })

  it('file prop이 주어지면 파일명을 표시한다', () => {
    const file = new File(['dummy'], 'license.pdf', { type: 'application/pdf' })
    render(<FormFileInput id="license" label="사업자등록증" file={file} onChange={vi.fn()} />)

    expect(screen.getByDisplayValue('license.pdf')).toBeInTheDocument()
  })

  it('파일명 표시 input은 항상 disabled 상태라 사용자가 직접 수정할 수 없다', () => {
    const file = new File(['dummy'], 'license.pdf', { type: 'application/pdf' })
    render(<FormFileInput id="license" label="사업자등록증" file={file} onChange={vi.fn()} />)

    expect(screen.getByDisplayValue('license.pdf')).toBeDisabled()
  })

  it('파일이 없으면 삭제 버튼이 렌더링되지 않는다', () => {
    render(<FormFileInput id="license" label="사업자등록증" file={null} onChange={vi.fn()} />)

    expect(screen.queryByRole('button', { name: '첨부 파일 삭제' })).not.toBeInTheDocument()
  })

  it('파일이 있으면 삭제 버튼이 렌더링되고, 클릭하면 onChange가 null로 호출된다', async () => {
    const handleChange = vi.fn()
    const file = new File(['dummy'], 'license.pdf', { type: 'application/pdf' })
    render(<FormFileInput id="license" label="사업자등록증" file={file} onChange={handleChange} />)

    await userEvent.click(screen.getByRole('button', { name: '첨부 파일 삭제' }))

    expect(handleChange).toHaveBeenCalledWith(null)
  })

  it('disabled가 true이면 파일이 있어도 삭제 버튼이 렌더링되지 않는다', () => {
    const file = new File(['dummy'], 'license.pdf', { type: 'application/pdf' })
    render(
      <FormFileInput id="license" label="사업자등록증" file={file} onChange={vi.fn()} disabled />
    )

    expect(screen.queryByRole('button', { name: '첨부 파일 삭제' })).not.toBeInTheDocument()
  })

  it('disabled가 true이면 파일 선택 버튼이 렌더링되지 않고 파일 input도 비활성화된다', () => {
    render(
      <FormFileInput id="license" label="사업자등록증" file={null} onChange={vi.fn()} disabled />
    )

    expect(screen.queryByRole('button', { name: '파일 선택' })).not.toBeInTheDocument()
    expect(screen.getByLabelText('사업자등록증')).toBeDisabled()
  })

  it('message가 있으면 기본 색상(red)으로 렌더링된다', () => {
    render(
      <FormFileInput
        id="license"
        label="사업자등록증"
        file={null}
        onChange={vi.fn()}
        message="파일을 첨부해주세요."
      />
    )

    expect(screen.getByText('파일을 첨부해주세요.')).toHaveClass('text-red-600')
  })

  it('messageColor를 지정하면 해당 색상 클래스가 적용된다', () => {
    render(
      <FormFileInput
        id="license"
        label="사업자등록증"
        file={null}
        onChange={vi.fn()}
        message="업로드 완료"
        messageColor="green"
      />
    )

    expect(screen.getByText('업로드 완료')).toHaveClass('text-green-600')
  })

  it('labelDescription이 있으면 라벨 우측에 표시된다', () => {
    render(
      <FormFileInput
        id="license"
        label="사업자등록증"
        file={null}
        onChange={vi.fn()}
        labelDescription="필수 안내 문구"
      />
    )

    expect(screen.getByText('필수 안내 문구')).toBeInTheDocument()
  })

  it('labelDescription이 없으면 렌더링하지 않는다', () => {
    render(<FormFileInput id="license" label="사업자등록증" file={null} onChange={vi.fn()} />)

    expect(screen.queryByText(/필수 안내 문구/)).not.toBeInTheDocument()
  })

  it('required가 true이면 라벨 옆에 필수 표시가 렌더링되고 label 접근성 텍스트는 그대로 유지된다', () => {
    const { container } = render(
      <FormFileInput id="license" label="사업자등록증" file={null} onChange={vi.fn()} required />
    )

    expect(screen.getByLabelText('사업자등록증')).toBeInTheDocument()
    expect(container.querySelector('label')).toHaveTextContent('사업자등록증')
    expect(container.textContent).toContain('*')
  })

  it('required가 없으면 필수 표시가 렌더링되지 않는다', () => {
    const { container } = render(
      <FormFileInput id="license" label="사업자등록증" file={null} onChange={vi.fn()} />
    )

    expect(container.textContent).not.toContain('*')
  })
})
