import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { SettingsInventoryConfigPage } from './SettingsInventoryConfigPage'

vi.mock('../components/layout/Layout', () => ({
  Layout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

describe('SettingsInventoryConfigPage', () => {
  afterEach(() => {
    cleanup()
  })

  it('제목과 준비중 안내 문구를 렌더링한다', () => {
    render(<SettingsInventoryConfigPage />)
    expect(screen.getByRole('heading', { name: '재고 관리 설정' })).toBeInTheDocument()
    expect(screen.getByText('준비중입니다.')).toBeInTheDocument()
  })
})
