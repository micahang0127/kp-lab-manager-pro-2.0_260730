import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { render, screen } from '../../test/test-utils'
import { ErrorFallback } from './ErrorFallback'

describe('ErrorFallback', () => {
  it('안내 문구와 다시 시도/새로고침 버튼을 보여준다', () => {
    render(<ErrorFallback onRetry={vi.fn()} />)

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('문제가 발생했습니다')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '다시 시도' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '새로고침' })).toBeInTheDocument()
  })

  it('"다시 시도" 클릭 시 onRetry를 호출한다', async () => {
    const onRetry = vi.fn()
    render(<ErrorFallback onRetry={onRetry} />)

    await userEvent.click(screen.getByRole('button', { name: '다시 시도' }))

    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
