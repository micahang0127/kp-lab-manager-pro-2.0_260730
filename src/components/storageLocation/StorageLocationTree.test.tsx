// 드래그 순서변경(onMove)은 react-dnd의 HTML5 네이티브 드래그 이벤트에 의존해 jsdom에서
// 신뢰성 있게 시뮬레이션할 수 없다 — 순서변경 로직 자체는 src/utils/storageLocationTree.test.ts에서
// 순수 함수 단위로 검증한다. 여기서는 추가/삭제/이름변경 상호작용만 다룬다.
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { StorageLocationNode } from '../../api/storageLocation'
import { StorageLocationTree } from './StorageLocationTree'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../../api/storageLocation', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../api/storageLocation')>()
  return {
    ...actual,
    createStorageLocation: vi
      .fn()
      .mockResolvedValue({ result: true, statusCode: 200, data: true, message: [] }),
    renameStorageLocation: vi
      .fn()
      .mockResolvedValue({ result: true, statusCode: 200, data: true, message: [] }),
    deleteStorageLocation: vi
      .fn()
      .mockResolvedValue({ result: true, statusCode: 200, data: true, message: [] }),
    updateStorageLocationOrder: vi
      .fn()
      .mockResolvedValue({ result: true, statusCode: 200, data: true, message: [] }),
  }
})

import {
  createStorageLocation,
  deleteStorageLocation,
  renameStorageLocation,
} from '../../api/storageLocation'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const buildData = (): StorageLocationNode[] => [
  {
    id: 'loc-1',
    name: '본관',
    children: [{ id: 'loc-1-1', name: '1층' }],
  },
  { id: 'loc-2', name: '별관' },
]

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('StorageLocationTree', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('최상위/하위 보관위치 이름을 렌더링한다', () => {
    render(<StorageLocationTree initialData={buildData()} />)

    expect(screen.getByText('본관')).toBeInTheDocument()
    expect(screen.getByText('별관')).toBeInTheDocument()
    expect(screen.getByText('1층')).toBeInTheDocument()
  })

  it('보관위치가 없으면 안내 문구를 표시한다', () => {
    render(<StorageLocationTree initialData={[]} />)

    expect(
      screen.getByText('등록된 보관위치가 없습니다. 최상위 보관위치를 추가해주세요.')
    ).toBeInTheDocument()
  })

  it('"+ 최상위 보관위치 추가"를 클릭하면 새 노드가 생성되고 이름을 입력할 수 있다', async () => {
    render(<StorageLocationTree initialData={buildData()} />)

    await userEvent.click(screen.getByRole('button', { name: '+ 최상위 보관위치 추가' }))

    const input = await screen.findByLabelText('보관위치 이름 수정')
    await userEvent.type(input, '신관')
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(await screen.findByText('신관')).toBeInTheDocument()
    await waitFor(() => {
      expect(createStorageLocation).toHaveBeenCalledWith({ parentId: null, name: '' })
    })
  })

  it('노드의 "하위 위치 추가" 버튼을 클릭하면 그 노드의 자식으로 새 노드가 추가된다 (depth 증가)', async () => {
    render(<StorageLocationTree initialData={buildData()} />)

    await userEvent.click(screen.getByRole('button', { name: '별관 하위 위치 추가' }))

    const input = await screen.findByLabelText('보관위치 이름 수정')
    await userEvent.type(input, '1층 창고')
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(await screen.findByText('1층 창고')).toBeInTheDocument()
    await waitFor(() => {
      expect(createStorageLocation).toHaveBeenCalledWith({ parentId: 'loc-2', name: '' })
    })
  })

  it('이름을 더블클릭하면 수정할 수 있다', async () => {
    render(<StorageLocationTree initialData={buildData()} />)

    fireEvent.doubleClick(screen.getByText('별관'))

    const input = await screen.findByLabelText('별관 이름 수정')
    await userEvent.clear(input)
    await userEvent.type(input, '새 별관')
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(await screen.findByText('새 별관')).toBeInTheDocument()
    await waitFor(() => {
      expect(renameStorageLocation).toHaveBeenCalledWith({ id: 'loc-2', name: '새 별관' })
    })
  })

  it('삭제 버튼을 클릭하면 노드(와 하위 노드)가 사라진다', async () => {
    render(<StorageLocationTree initialData={buildData()} />)

    await userEvent.click(screen.getByRole('button', { name: '본관 삭제' }))

    expect(screen.queryByText('본관')).not.toBeInTheDocument()
    expect(screen.queryByText('1층')).not.toBeInTheDocument()
    expect(screen.getByText('별관')).toBeInTheDocument()
    await waitFor(() => {
      expect(deleteStorageLocation).toHaveBeenCalledWith('loc-1')
    })
  })

  it('initialData로 넘긴 원본 객체(예: React Query 캐시)는 중첩 노드를 편집해도 오염되지 않는다', async () => {
    const initialData = buildData()

    render(<StorageLocationTree initialData={initialData} />)

    await userEvent.click(screen.getByRole('button', { name: '본관 하위 위치 추가' }))
    const input = await screen.findByLabelText('보관위치 이름 수정')
    await userEvent.type(input, '시약보관실 A')
    fireEvent.keyDown(input, { key: 'Enter' })
    await screen.findByText('시약보관실 A')

    const originalRoot = initialData.find((node) => node.id === 'loc-1')
    expect(originalRoot?.children).toEqual([{ id: 'loc-1-1', name: '1층' }])
  })
})
