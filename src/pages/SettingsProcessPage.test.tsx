import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { SettingsProcessPage } from './SettingsProcessPage'

vi.mock('../components/layout/Layout', () => ({
  Layout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

describe('SettingsProcessPage', () => {
  afterEach(() => {
    cleanup()
  })

  it('제목과 준비중 안내 문구를 렌더링한다', () => {
    render(<SettingsProcessPage />)
    expect(screen.getByRole('heading', { name: '프로세스 관리' })).toBeInTheDocument()
    expect(screen.getByText('준비중입니다.')).toBeInTheDocument()
  })
})
