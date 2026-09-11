import { describe, expect, it } from 'vitest'

import { render, screen } from '../../test/test-utils'
import { ErrorMessage } from './ErrorMessage'

describe('ErrorMessage', () => {
  it('message가 있으면 빨간 글씨로 표시한다', () => {
    render(<ErrorMessage message="휴대폰 인증에 실패했습니다." />)

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('휴대폰 인증에 실패했습니다.')
    expect(alert).toHaveClass('text-red-600')
  })

  it('message가 없으면 아무것도 렌더링하지 않는다', () => {
    const { container } = render(<ErrorMessage message={null} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('message가 빈 문자열이면 아무것도 렌더링하지 않는다', () => {
    const { container } = render(<ErrorMessage message="" />)

    expect(container).toBeEmptyDOMElement()
  })

  it('size 기본값(xs)은 text-[10px] 클래스를 사용한다', () => {
    render(<ErrorMessage message="오류" />)

    expect(screen.getByRole('alert')).toHaveClass('text-[10px]')
  })

  it("size='sm'이면 text-sm 클래스를 사용한다", () => {
    render(<ErrorMessage message="오류" size="sm" />)

    expect(screen.getByRole('alert')).toHaveClass('text-sm')
  })

  it('className을 지정하면 함께 적용된다', () => {
    render(<ErrorMessage message="오류" className="mt-4" />)

    expect(screen.getByRole('alert')).toHaveClass('mt-4')
  })
})
