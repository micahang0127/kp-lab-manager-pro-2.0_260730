import { describe, expect, it } from 'vitest'

import { render, screen } from '../../test/test-utils'
import { ServerErrorBanner } from './ServerErrorBanner'

describe('ServerErrorBanner', () => {
  it('message가 있으면 그대로 표시한다', () => {
    render(<ServerErrorBanner message="이메일 또는 비밀번호가 올바르지 않습니다." />)

    expect(screen.getByRole('alert')).toHaveTextContent('이메일 또는 비밀번호가 올바르지 않습니다.')
  })

  it('message가 없으면 아무것도 렌더링하지 않는다', () => {
    const { container } = render(<ServerErrorBanner message={null} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('message가 빈 문자열이면 아무것도 렌더링하지 않는다', () => {
    const { container } = render(<ServerErrorBanner message="" />)

    expect(container).toBeEmptyDOMElement()
  })

  it('children을 함께 전달하면 배너 안에 노출한다', () => {
    render(
      <ServerErrorBanner message="계정이 잠겼습니다.">
        <button type="button">비밀번호 찾기</button>
      </ServerErrorBanner>
    )

    expect(screen.getByRole('button', { name: '비밀번호 찾기' })).toBeInTheDocument()
  })
})
