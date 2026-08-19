import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { ApiResponse } from '../api'
import type { IncomingItemListResult } from '../api/itemIncoming'
import { getIncomingItems } from '../api/itemIncoming'
import { cleanup, render, screen, waitFor } from '../test/test-utils'
import { ItemIncomingPendingPage } from './ItemIncomingPendingPage'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../components/layout/Layout', () => ({
  Layout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('../api/itemIncoming', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/itemIncoming')>()
  return { ...actual, getIncomingItems: vi.fn() }
})

const buildResponse = (
  overrides?: Partial<IncomingItemListResult>
): ApiResponse<IncomingItemListResult> => ({
  result: true,
  statusCode: 200,
  message: [],
  data: {
    data: [
      {
        id: 1,
        quantity: 5,
        location: '테스트 보관함',
        purchaseRoute: '수기 등록',
        itemName: 'y7',
        category: '보호구',
        brand: null,
        productNumber: null,
        packageQuantity: null,
        shippingInfo: null,
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

describe('ItemIncomingPendingPage', () => {
  beforeEach(() => {
    vi.mocked(getIncomingItems).mockResolvedValue(buildResponse())
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('제목과 입고등록대기 목록이 렌더링된다', async () => {
    render(<ItemIncomingPendingPage />)

    expect(screen.getByRole('heading', { name: '입고등록대기' })).toBeInTheDocument()
    expect(await screen.findByText('y7')).toBeInTheDocument()
    expect(screen.getByText('5개')).toBeInTheDocument()
  })

  it('체크박스를 클릭하면 해당 행이 선택된다', async () => {
    render(<ItemIncomingPendingPage />)
    await screen.findByText('y7')

    const checkbox = screen.getByLabelText('y7 선택')
    await userEvent.click(checkbox)

    expect(checkbox).toBeChecked()
  })

  it('검색어를 입력만 하고 검색 버튼을 누르지 않으면 getIncomingItems가 재호출되지 않는다', async () => {
    render(<ItemIncomingPendingPage />)
    await screen.findByText('y7')
    vi.clearAllMocks()
    vi.mocked(getIncomingItems).mockResolvedValue(buildResponse())

    await userEvent.type(screen.getByLabelText('테이블 검색'), '보호구')

    expect(getIncomingItems).not.toHaveBeenCalled()
  })

  it('검색어를 입력하고 검색 버튼을 누르면 getIncomingItems가 새 keyword로 재호출된다', async () => {
    render(<ItemIncomingPendingPage />)
    await screen.findByText('y7')

    await userEvent.type(screen.getByLabelText('테이블 검색'), '보호구')
    await userEvent.click(screen.getByRole('button', { name: '검색' }))

    await waitFor(() => {
      expect(getIncomingItems).toHaveBeenCalledWith(expect.objectContaining({ keyword: '보호구' }))
    })
  })

  it('"다음 페이지" 클릭 시 getIncomingItems가 다음 page로 재호출된다', async () => {
    vi.mocked(getIncomingItems).mockResolvedValue(buildResponse({ totalPages: 2 }))
    render(<ItemIncomingPendingPage />)
    await screen.findByText('y7')

    await userEvent.click(screen.getByRole('button', { name: '다음 페이지' }))

    await waitFor(() => {
      expect(getIncomingItems).toHaveBeenCalledWith(expect.objectContaining({ page: 1 }))
    })
  })

  it('로딩 중에는 안내 문구가 표시된다', async () => {
    let resolveItems: (value: ApiResponse<IncomingItemListResult>) => void = () => {}
    const pending = new Promise<ApiResponse<IncomingItemListResult>>((resolve) => {
      resolveItems = resolve
    })
    vi.mocked(getIncomingItems).mockReturnValue(pending)

    render(<ItemIncomingPendingPage />)

    expect(screen.getByText('불러오는 중...')).toBeInTheDocument()

    resolveItems(buildResponse())
    await screen.findByText('y7')
  })

  it('getIncomingItems가 실패하면 에러 메시지가 표시된다', async () => {
    vi.mocked(getIncomingItems).mockRejectedValue(new Error('네트워크 오류'))

    render(<ItemIncomingPendingPage />)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '입고등록대기 목록을 불러오지 못했습니다.'
    )
  })
})
