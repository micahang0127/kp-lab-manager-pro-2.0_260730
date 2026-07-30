import { afterEach, describe, expect, it, vi } from 'vitest'

import { cleanup, render, screen } from '../test/test-utils'
import { SafetyHazardousChemicalPage } from './SafetyHazardousChemicalPage'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../components/layout/Layout', () => ({
  Layout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SafetyHazardousChemicalPage', () => {
  afterEach(() => {
    cleanup()
  })

  it('제목과 플레이스홀더 컬럼이 렌더링되고, 데이터가 없으면 안내 문구가 표시된다', () => {
    render(<SafetyHazardousChemicalPage />)

    expect(screen.getByRole('heading', { name: '유해화학물질' })).toBeInTheDocument()
    expect(screen.getByText('컬럼1')).toBeInTheDocument()
    expect(screen.getByText('컬럼2')).toBeInTheDocument()
    expect(screen.getByText('컬럼3')).toBeInTheDocument()
    expect(screen.getByText('컬럼4')).toBeInTheDocument()
    expect(screen.getByText('컬럼5')).toBeInTheDocument()
    expect(screen.getByText('컬럼6')).toBeInTheDocument()
    expect(screen.getByText('컬럼7')).toBeInTheDocument()
    expect(screen.getByText('컬럼8')).toBeInTheDocument()
    expect(screen.getByText('데이터가 없습니다.')).toBeInTheDocument()
  })
})
