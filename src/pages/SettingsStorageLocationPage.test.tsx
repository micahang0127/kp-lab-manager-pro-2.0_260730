import { afterEach, describe, expect, it, vi } from 'vitest'

import type { ApiResponse } from '../api'
import type { StorageLocationNode } from '../api/storageLocation'
import { getStorageLocations } from '../api/storageLocation'
import { cleanup, render, screen } from '../test/test-utils'
import { SettingsStorageLocationPage } from './SettingsStorageLocationPage'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../components/layout/Layout', () => ({
  Layout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('../api/storageLocation', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/storageLocation')>()
  return { ...actual, getStorageLocations: vi.fn() }
})

const buildResponse = (data: StorageLocationNode[]): ApiResponse<StorageLocationNode[]> => ({
  result: true,
  statusCode: 200,
  data,
  message: [],
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SettingsStorageLocationPage', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('제목과 보관위치 트리를 렌더링한다', async () => {
    vi.mocked(getStorageLocations).mockResolvedValue(buildResponse([{ id: 'loc-1', name: '본관' }]))

    render(<SettingsStorageLocationPage />)

    expect(screen.getByRole('heading', { name: '보관위치 관리' })).toBeInTheDocument()
    expect(await screen.findByText('본관')).toBeInTheDocument()
  })

  it('로딩 중에는 안내 문구가 표시된다', async () => {
    let resolveData: (value: ApiResponse<StorageLocationNode[]>) => void = () => {}
    const pending = new Promise<ApiResponse<StorageLocationNode[]>>((resolve) => {
      resolveData = resolve
    })
    vi.mocked(getStorageLocations).mockReturnValue(pending)

    render(<SettingsStorageLocationPage />)

    expect(screen.getByText('불러오는 중...')).toBeInTheDocument()

    resolveData(buildResponse([{ id: 'loc-1', name: '본관' }]))
    await screen.findByText('본관')
  })

  it('조회가 실패하면 에러 메시지가 표시된다', async () => {
    vi.mocked(getStorageLocations).mockRejectedValue(new Error('네트워크 오류'))

    render(<SettingsStorageLocationPage />)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '보관위치 목록을 불러오지 못했습니다.'
    )
  })
})
