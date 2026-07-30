import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { SafetyHazardousQuantityPage } from './SafetyHazardousQuantityPage'

vi.mock('../components/layout/Layout', () => ({
  Layout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

describe('SafetyHazardousQuantityPage', () => {
  afterEach(() => {
    cleanup()
  })

  it('제목과 준비중 안내 문구를 렌더링한다', () => {
    render(<SafetyHazardousQuantityPage />)
    expect(screen.getByRole('heading', { name: '위험물 지정수량 배수' })).toBeInTheDocument()
    expect(screen.getByText('준비중입니다.')).toBeInTheDocument()
  })
})
