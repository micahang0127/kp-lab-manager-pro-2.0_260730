import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { KetcherLoader } from './KetcherLoader'

vi.mock('ketcher-standalone', () => ({
  StandaloneStructServiceProvider: class {
    // mock class
  },
}))

vi.mock('ketcher-react', () => ({
  Editor: ({ onInit }: { onInit: (k: unknown) => void }) => {
    onInit({ getSmiles: async () => 'C1=CC=CC=C1', setMolecule: vi.fn() })
    return <div data-testid="ketcher-editor" />
  },
}))

vi.mock('ketcher-react/dist/index.css', () => ({
  // CSS 파일 mock
}))

describe('KetcherLoader', () => {
  it('isOpen=false이면 렌더링하지 않는다', () => {
    render(<KetcherLoader isOpen={false} onClose={vi.fn()} onConfirm={vi.fn()} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('isOpen=true이면 모달이 렌더링된다', async () => {
    render(<KetcherLoader isOpen={true} onClose={vi.fn()} onConfirm={vi.fn()} />)
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
  })

  it('확인 버튼 클릭 시 SMILES를 onConfirm으로 전달한다', async () => {
    const onConfirm = vi.fn()
    render(<KetcherLoader isOpen={true} onClose={vi.fn()} onConfirm={onConfirm} />)
    fireEvent.click(await screen.findByText('확인'))
    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith('C1=CC=CC=C1')
    })
  })
})
