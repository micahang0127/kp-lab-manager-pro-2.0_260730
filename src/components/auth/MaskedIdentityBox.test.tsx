import { describe, expect, it } from 'vitest'

import { render, screen } from '../../test/test-utils'
import { MaskedIdentityBox } from './MaskedIdentityBox'

describe('MaskedIdentityBox', () => {
  it('maskedIdentity 값이 있으면 렌더링한다', () => {
    render(<MaskedIdentityBox maskedIdentity="홍길동 / 1990-**-**" />)

    expect(screen.getByText('홍길동 / 1990-**-**')).toBeInTheDocument()
  })

  it('maskedIdentity가 빈 문자열이면 아무것도 렌더링하지 않는다', () => {
    const { container } = render(<MaskedIdentityBox maskedIdentity="" />)

    expect(container).toBeEmptyDOMElement()
  })
})
