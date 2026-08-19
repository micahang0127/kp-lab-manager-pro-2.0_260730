import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { ApiResponse } from '../api'
import type { ItemListResult } from '../api/item'
import { getItems } from '../api/item'
import { cleanup, render, screen, waitFor } from '../test/test-utils'
import { ItemRegisterPage } from './ItemRegisterPage'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../components/layout/Layout', () => ({
  Layout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('../api/item', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/item')>()
  return { ...actual, getItems: vi.fn() }
})

const buildResponse = (overrides?: Partial<ItemListResult>): ApiResponse<ItemListResult> => ({
  result: true,
  statusCode: 200,
  message: [],
  data: {
    data: [
      {
        id: 1,
        itemCode: 'CHM-0001',
        itemName: '에탄올',
        spec: '99.5% 500mL',
        unit: '병',
        quantity: 24,
        location: '시약보관실 A-1',
        registeredAt: '2026-01-05T00:00:00.000Z',
      },
    ],
    total: 1,
    page: 0,
    limit: 10,
    totalPages: 1,
    ...overrides,
  },
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ItemRegisterPage', () => {
  beforeEach(() => {
    vi.mocked(getItems).mockResolvedValue(buildResponse())
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('제목과 물품 목록이 렌더링된다', async () => {
    render(<ItemRegisterPage />)

    expect(screen.getByRole('heading', { name: '물품목록' })).toBeInTheDocument()
    expect(await screen.findByText('에탄올')).toBeInTheDocument()
    expect(screen.getByText('물품코드')).toBeInTheDocument()
  })

  it('검색어를 입력만 하고 검색 버튼을 누르지 않으면 getItems가 재호출되지 않는다', async () => {
    render(<ItemRegisterPage />)
    await screen.findByText('에탄올')
    vi.clearAllMocks()
    vi.mocked(getItems).mockResolvedValue(buildResponse())

    await userEvent.type(screen.getByLabelText('테이블 검색'), '에탄올')

    expect(getItems).not.toHaveBeenCalled()
  })

  it('검색어를 입력하고 검색 버튼을 누르면 getItems가 새 keyword로 재호출된다', async () => {
    render(<ItemRegisterPage />)
    await screen.findByText('에탄올')

    await userEvent.type(screen.getByLabelText('테이블 검색'), '에탄올')
    await userEvent.click(screen.getByRole('button', { name: '검색' }))

    await waitFor(() => {
      expect(getItems).toHaveBeenCalledWith(expect.objectContaining({ keyword: '에탄올' }))
    })
  })

  it('"다음 페이지" 클릭 시 getItems가 다음 page로 재호출된다', async () => {
    vi.mocked(getItems).mockResolvedValue(buildResponse({ totalPages: 2 }))
    render(<ItemRegisterPage />)
    await screen.findByText('에탄올')

    await userEvent.click(screen.getByRole('button', { name: '다음 페이지' }))

    await waitFor(() => {
      expect(getItems).toHaveBeenCalledWith(expect.objectContaining({ page: 1 }))
    })
  })

  it('로딩 중에는 안내 문구가 표시된다', async () => {
    let resolveItems: (value: ApiResponse<ItemListResult>) => void = () => {}
    const pending = new Promise<ApiResponse<ItemListResult>>((resolve) => {
      resolveItems = resolve
    })
    vi.mocked(getItems).mockReturnValue(pending)

    render(<ItemRegisterPage />)

    expect(screen.getByText('불러오는 중...')).toBeInTheDocument()

    resolveItems(buildResponse())
    await screen.findByText('에탄올')
  })

  it('getItems가 실패하면 에러 메시지가 표시된다', async () => {
    vi.mocked(getItems).mockRejectedValue(new Error('네트워크 오류'))

    render(<ItemRegisterPage />)

    expect(await screen.findByRole('alert')).toHaveTextContent('물품 목록을 불러오지 못했습니다.')
  })
})
