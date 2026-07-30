import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { InstitutionLocationPage } from './InstitutionLocationPage'

vi.mock('../components/layout/Layout', () => ({
  Layout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

describe('InstitutionLocationPage', () => {
  afterEach(() => {
    cleanup()
  })

  it('제목과 준비중 안내 문구를 렌더링한다', () => {
    render(<InstitutionLocationPage />)
    expect(screen.getByRole('heading', { name: '위치 및 보관함' })).toBeInTheDocument()
    expect(screen.getByText('준비중입니다.')).toBeInTheDocument()
  })
})
