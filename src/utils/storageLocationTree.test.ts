import { describe, expect, it } from 'vitest'

import type { StorageLocationNode } from '../api/storageLocation'
import {
  createStorageLocationNode,
  createTempStorageLocationId,
  deleteStorageLocationNode,
  moveStorageLocationNode,
  renameStorageLocationNode,
} from './storageLocationTree'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const buildTree = (): StorageLocationNode[] => [
  {
    id: 'a',
    name: '본관',
    children: [
      { id: 'a-1', name: '1층' },
      { id: 'a-2', name: '2층' },
    ],
  },
  { id: 'b', name: '별관' },
]

describe('createTempStorageLocationId', () => {
  it('호출할 때마다 서로 다른 id를 발급한다', () => {
    const first = createTempStorageLocationId()
    const second = createTempStorageLocationId()
    expect(first).not.toBe(second)
  })
})

describe('createStorageLocationNode', () => {
  it('최상위(parentId: null)의 지정한 index에 새 노드를 추가한다', () => {
    const result = createStorageLocationNode(buildTree(), {
      parentId: null,
      index: 1,
      node: { id: 'c', name: '신관' },
    })

    expect(result.map((node) => node.id)).toEqual(['a', 'c', 'b'])
  })

  it('특정 노드의 하위(child)로 새 노드를 추가한다 — depth가 계속 늘어날 수 있다', () => {
    const result = createStorageLocationNode(buildTree(), {
      parentId: 'a-1',
      index: 0,
      node: { id: 'a-1-1', name: '시약보관실 A' },
    })

    const target = result
      .find((node) => node.id === 'a')
      ?.children?.find((node) => node.id === 'a-1')
    expect(target?.children).toEqual([{ id: 'a-1-1', name: '시약보관실 A' }])
  })

  it('원본 트리를 변경하지 않는다 (최상위)', () => {
    const original = buildTree()
    createStorageLocationNode(original, {
      parentId: null,
      index: 0,
      node: { id: 'c', name: '신관' },
    })

    expect(original.map((node) => node.id)).toEqual(['a', 'b'])
  })

  it('원본 트리를 변경하지 않는다 (중첩 노드 하위에 추가해도 원본의 children 배열은 그대로) — react-arborist의 SimpleTree는 root가 아닌 노드의 children을 in-place로 splice하므로, structuredClone 없이 넘기면 원본이 오염된다', () => {
    const original = buildTree()
    createStorageLocationNode(original, {
      parentId: 'a-1',
      index: 0,
      node: { id: 'a-1-1', name: '시약보관실 A' },
    })

    const a = original.find((node) => node.id === 'a')
    const a1 = a?.children?.find((node) => node.id === 'a-1')
    expect(a1?.children).toBeUndefined()
    expect(a?.children).toHaveLength(2)
  })
})

describe('renameStorageLocationNode', () => {
  it('최상위 노드의 이름을 변경한다', () => {
    const result = renameStorageLocationNode(buildTree(), { id: 'b', name: '새 별관' })
    expect(result.find((node) => node.id === 'b')?.name).toBe('새 별관')
  })

  it('하위 노드의 이름을 변경해도 형제 순서는 유지된다', () => {
    const result = renameStorageLocationNode(buildTree(), { id: 'a-1', name: '지하 1층' })
    const children = result.find((node) => node.id === 'a')?.children
    expect(children?.map((node) => node.name)).toEqual(['지하 1층', '2층'])
  })

  it('중첩 노드의 이름을 변경해도 원본의 형제 배열은 그대로다', () => {
    const original = buildTree()
    renameStorageLocationNode(original, { id: 'a-1', name: '지하 1층' })

    const children = original.find((node) => node.id === 'a')?.children
    expect(children?.map((node) => node.name)).toEqual(['1층', '2층'])
  })
})

describe('deleteStorageLocationNode', () => {
  it('노드를 삭제하면 하위 노드까지 함께 제거된다', () => {
    const result = deleteStorageLocationNode(buildTree(), ['a'])
    expect(result.map((node) => node.id)).toEqual(['b'])
  })

  it('여러 id를 한 번에 삭제할 수 있다', () => {
    const result = deleteStorageLocationNode(buildTree(), ['a-1', 'b'])
    expect(result.map((node) => node.id)).toEqual(['a'])
    expect(result[0].children?.map((node) => node.id)).toEqual(['a-2'])
  })

  it('중첩 노드를 삭제해도 원본의 children 배열은 그대로다', () => {
    const original = buildTree()
    deleteStorageLocationNode(original, ['a-1'])

    const children = original.find((node) => node.id === 'a')?.children
    expect(children?.map((node) => node.id)).toEqual(['a-1', 'a-2'])
  })
})

describe('moveStorageLocationNode', () => {
  it('같은 부모 안에서 순서만 바꾼다', () => {
    const { data, changes } = moveStorageLocationNode(buildTree(), {
      dragIds: ['b'],
      parentId: null,
      index: 0,
    })

    expect(data.map((node) => node.id)).toEqual(['b', 'a'])
    expect(changes).toEqual([{ id: 'b', parentId: null, index: 0 }])
  })

  it('다른 부모의 하위로 옮긴다 (재배치) — 원래 부모의 children에서는 제거된다', () => {
    const { data, changes } = moveStorageLocationNode(buildTree(), {
      dragIds: ['a-1'],
      parentId: 'b',
      index: 0,
    })

    const a = data.find((node) => node.id === 'a')
    const b = data.find((node) => node.id === 'b')
    expect(a?.children?.map((node) => node.id)).toEqual(['a-2'])
    expect(b?.children?.map((node) => node.id)).toEqual(['a-1'])
    expect(changes).toEqual([{ id: 'a-1', parentId: 'b', index: 0 }])
  })

  it('최상위 노드를 다른 최상위 노드의 하위로 옮겨 depth를 늘릴 수 있다', () => {
    const { data, changes } = moveStorageLocationNode(buildTree(), {
      dragIds: ['b'],
      parentId: 'a',
      index: 2,
    })

    const a = data.find((node) => node.id === 'a')
    expect(data.map((node) => node.id)).toEqual(['a'])
    expect(a?.children?.map((node) => node.id)).toEqual(['a-1', 'a-2', 'b'])
    expect(changes).toEqual([{ id: 'b', parentId: 'a', index: 2 }])
  })

  it('반환된 데이터는 원본과 다른 배열 참조를 가진다 (React 상태 갱신을 위해 새 참조가 필요)', () => {
    const original = buildTree()
    const { data } = moveStorageLocationNode(original, {
      dragIds: ['a-1'],
      parentId: 'b',
      index: 0,
    })

    expect(data).not.toBe(original)
  })

  it('중첩 노드를 다른 부모로 옮겨도 원본의 children 배열은 그대로다', () => {
    const original = buildTree()
    moveStorageLocationNode(original, { dragIds: ['a-1'], parentId: 'b', index: 0 })

    const a = original.find((node) => node.id === 'a')
    const b = original.find((node) => node.id === 'b')
    expect(a?.children?.map((node) => node.id)).toEqual(['a-1', 'a-2'])
    expect(b?.children).toBeUndefined()
  })
})
