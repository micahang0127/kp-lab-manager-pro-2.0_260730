import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Sidebar } from './Sidebar'

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockUseLocation = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    to,
    className,
  }: {
    children: React.ReactNode
    to: string
    className?: string
  }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
  useLocation: () => mockUseLocation(),
}))

describe('Sidebar', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('홈 링크와 모든 대메뉴 버튼이 렌더링된다', () => {
    mockUseLocation.mockReturnValue({ pathname: '/main' })
    render(<Sidebar />)

    expect(screen.getByRole('link', { name: '홈' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /물품관리/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /안전관리/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /기관관리/ })).toBeInTheDocument()
  })

  it('현재 경로와 무관한 대메뉴는 초기에 접혀 있다', () => {
    mockUseLocation.mockReturnValue({ pathname: '/main' })
    render(<Sidebar />)

    expect(screen.getByRole('button', { name: /물품관리/ })).toHaveAttribute(
      'aria-expanded',
      'false'
    )
    expect(screen.getByRole('button', { name: /안전관리/ })).toHaveAttribute(
      'aria-expanded',
      'false'
    )
    expect(screen.getByRole('button', { name: /기관관리/ })).toHaveAttribute(
      'aria-expanded',
      'false'
    )
  })

  it('현재 경로에 해당하는 대메뉴는 초기에 펼쳐진다', () => {
    mockUseLocation.mockReturnValue({ pathname: '/items/register' })
    render(<Sidebar />)

    expect(screen.getByRole('button', { name: /물품관리/ })).toHaveAttribute(
      'aria-expanded',
      'true'
    )
    expect(screen.getByRole('link', { name: '물품목록' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '입고등록대기' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /안전관리/ })).toHaveAttribute(
      'aria-expanded',
      'false'
    )
    expect(screen.getByRole('button', { name: /기관관리/ })).toHaveAttribute(
      'aria-expanded',
      'false'
    )
  })

  it('대메뉴 버튼 클릭 시 소메뉴가 토글된다', async () => {
    mockUseLocation.mockReturnValue({ pathname: '/main' })
    render(<Sidebar />)

    const safetyButton = screen.getByRole('button', { name: /안전관리/ })
    expect(safetyButton).toHaveAttribute('aria-expanded', 'false')

    await userEvent.click(safetyButton)
    expect(safetyButton).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('link', { name: 'MSDS' })).toBeVisible()

    await userEvent.click(safetyButton)
    expect(safetyButton).toHaveAttribute('aria-expanded', 'false')
  })

  it('여러 대메뉴를 동시에 펼칠 수 있다', async () => {
    mockUseLocation.mockReturnValue({ pathname: '/main' })
    render(<Sidebar />)

    await userEvent.click(screen.getByRole('button', { name: /물품관리/ }))
    await userEvent.click(screen.getByRole('button', { name: /안전관리/ }))

    expect(screen.getByRole('button', { name: /물품관리/ })).toHaveAttribute(
      'aria-expanded',
      'true'
    )
    expect(screen.getByRole('button', { name: /안전관리/ })).toHaveAttribute(
      'aria-expanded',
      'true'
    )
    expect(screen.getByRole('link', { name: '물품목록' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'MSDS' })).toBeVisible()
  })
})
