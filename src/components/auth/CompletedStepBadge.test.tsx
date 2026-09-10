import { describe, expect, it } from 'vitest'

import { render, screen } from '../../test/test-utils'
import { CompletedStepBadge } from './CompletedStepBadge'

describe('CompletedStepBadge', () => {
  it('label 텍스트를 렌더링한다', () => {
    render(<CompletedStepBadge label="본인인증 완료" />)

    expect(screen.getByText('본인인증 완료')).toBeInTheDocument()
  })
})
