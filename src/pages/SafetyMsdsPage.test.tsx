import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { cleanup, render, screen } from '../test/test-utils'
import { SafetyMsdsPage } from './SafetyMsdsPage'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../components/layout/Layout', () => ({
  Layout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SafetyMsdsPage', () => {
  afterEach(() => {
    cleanup()
  })

  it('제목과 컬럼, 샘플 데이터가 렌더링된다', () => {
    render(<SafetyMsdsPage />)

    expect(screen.getByRole('heading', { name: 'MSDS' })).toBeInTheDocument()
    expect(screen.getByText('상태')).toBeInTheDocument()
    expect(screen.getByText('물품정보')).toBeInTheDocument()
    expect(screen.getByText('제품번호')).toBeInTheDocument()
    expect(screen.getByText('CAS No')).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'MSDS' })).toBeInTheDocument()
    expect(screen.getByText('업로드 된 MSDS 관리')).toBeInTheDocument()
    expect(screen.getByText('업데이트일')).toBeInTheDocument()
    expect(screen.getByText('아세톤 (Acetone)')).toBeInTheDocument()
  })

  it('업로드 버튼으로 파일을 선택하면 파일명이 표시된다', async () => {
    render(<SafetyMsdsPage />)

    const file = new File(['dummy'], 'msds-sample.pdf', { type: 'application/pdf' })
    const uploadInputs = screen.getAllByLabelText('업로드')

    await userEvent.upload(uploadInputs[0], file)

    expect(await screen.findByText('msds-sample.pdf')).toBeInTheDocument()
  })
})
