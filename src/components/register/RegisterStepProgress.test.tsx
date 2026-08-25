import { describe, expect, it } from 'vitest'

import { render, screen } from '../../test/test-utils'
import { RegisterStepProgress } from './RegisterStepProgress'

describe('RegisterStepProgress', () => {
  it('현재 단계와 전체 단계를 "n/m" 형식으로 표시한다', () => {
    render(<RegisterStepProgress currentStep={1} totalSteps={3} />)

    expect(screen.getByText('1/3')).toBeInTheDocument()
  })

  it('전체 단계 수만큼 진행 바 세그먼트를 렌더링한다', () => {
    const { container } = render(<RegisterStepProgress currentStep={2} totalSteps={3} />)

    expect(container.querySelectorAll('[aria-hidden]')).toHaveLength(3)
  })

  it('현재 단계 이전(포함) 세그먼트만 강조 색상으로 표시한다', () => {
    const { container } = render(<RegisterStepProgress currentStep={2} totalSteps={3} />)

    const segments = container.querySelectorAll('[aria-hidden]')
    expect(segments[0]).toHaveClass('bg-[#fec741]')
    expect(segments[1]).toHaveClass('bg-[#fec741]')
    expect(segments[2]).toHaveClass('bg-[#c9c9c4]')
  })
})
