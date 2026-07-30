import { afterEach, describe, expect, it, vi } from 'vitest'

import { cleanup, render, screen } from '../test/test-utils'
import { SafetySpecialSubstancePage } from './SafetySpecialSubstancePage'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../components/layout/Layout', () => ({
  Layout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SafetySpecialSubstancePage', () => {
  afterEach(() => {
    cleanup()
  })

  it('제목과 플레이스홀더 컬럼이 렌더링되고, 데이터가 없으면 안내 문구가 표시된다', () => {
    render(<SafetySpecialSubstancePage />)

    expect(screen.getByRole('heading', { name: '특별관리물질' })).toBeInTheDocument()
    expect(screen.getByText('컬럼1')).toBeInTheDocument()
    expect(screen.getByText('컬럼2')).toBeInTheDocument()
    expect(screen.getByText('컬럼3')).toBeInTheDocument()
    expect(screen.getByText('데이터가 없습니다.')).toBeInTheDocument()
  })
})
