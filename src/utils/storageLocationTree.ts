import { SimpleTree } from 'react-arborist'

import type { StorageLocationNode } from '../api/storageLocation'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StorageLocationOrderChange {
  id: string
  parentId: string | null
  index: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TREE_ACCESSORS = { idAccessor: 'id', childrenAccessor: 'children' }

// react-arborist의 SimpleTree는 최상위가 아닌 노드에 한해 원본 데이터 객체를 in-place로
// mutate한다(내부적으로 raw children 배열을 직접 splice). 아래 각 함수가 넘겨받는 data는
// React Query 캐시가 들고 있는 객체일 수 있으므로, structuredClone으로 참조를 끊은 뒤에만
// SimpleTree에 넘긴다 — 그래야 이 함수들이 실제로 순수(pure)하게 동작한다.

let nextTempNodeId = 0

// ─── Id ──────────────────────────────────────────────────────────────────────

/** 백엔드 미연동 상태에서 새 보관위치 노드에 부여할 임시 id를 발급한다. */
export function createTempStorageLocationId(): string {
  nextTempNodeId += 1
  return `temp-location-${nextTempNodeId}`
}

// ─── Tree ops ─────────────────────────────────────────────────────────────────

/** 지정한 부모의 index 위치에 새 보관위치 노드를 추가한 트리를 반환한다. */
export function createStorageLocationNode(
  data: StorageLocationNode[],
  args: { parentId: string | null; index: number; node: StorageLocationNode }
): StorageLocationNode[] {
  const tree = new SimpleTree<StorageLocationNode>(structuredClone(data), TREE_ACCESSORS)
  tree.create({ parentId: args.parentId, index: args.index, data: args.node })
  return tree.data
}

/** 보관위치 노드의 이름을 변경한 트리를 반환한다. */
export function renameStorageLocationNode(
  data: StorageLocationNode[],
  args: { id: string; name: string }
): StorageLocationNode[] {
  const tree = new SimpleTree<StorageLocationNode>(structuredClone(data), TREE_ACCESSORS)
  tree.update({ id: args.id, changes: { name: args.name } })
  return tree.data
}

/** 보관위치 노드를 하위 트리까지 포함해 삭제한 트리를 반환한다. */
export function deleteStorageLocationNode(
  data: StorageLocationNode[],
  ids: string[]
): StorageLocationNode[] {
  const tree = new SimpleTree<StorageLocationNode>(structuredClone(data), TREE_ACCESSORS)
  ids.forEach((id) => tree.drop({ id }))
  return tree.data
}

/** nodes에서 id를 찾아 그 노드가 속한 부모 id와 형제 목록 내 index를 반환한다. */
function findParentIdAndIndex(
  nodes: StorageLocationNode[],
  id: string,
  parentId: string | null = null
): { parentId: string | null; index: number } | null {
  for (let i = 0; i < nodes.length; i += 1) {
    if (nodes[i].id === id) {
      return { parentId, index: i }
    }
    const children = nodes[i].children
    if (children) {
      const found = findParentIdAndIndex(children, id, nodes[i].id)
      if (found) return found
    }
  }
  return null
}

/**
 * 드래그로 옮겨진 보관위치 노드(들)를 반영한 트리와, 각 노드의 이동 결과(최종 parentId/index)를
 * 반환한다. 결과 트리에서 실제 위치를 다시 조회해 반환하므로, react-arborist의 onMove가 주는
 * index(제거 전 기준 슬롯)를 그대로 API에 전달하는 것보다 정확하다.
 */
export function moveStorageLocationNode(
  data: StorageLocationNode[],
  args: { dragIds: string[]; parentId: string | null; index: number }
): { data: StorageLocationNode[]; changes: StorageLocationOrderChange[] } {
  const tree = new SimpleTree<StorageLocationNode>(structuredClone(data), TREE_ACCESSORS)
  args.dragIds.forEach((id) => tree.move({ id, parentId: args.parentId, index: args.index }))

  const nextData = tree.data
  const changes = args.dragIds
    .map((id) => {
      const found = findParentIdAndIndex(nextData, id)
      return found ? { id, parentId: found.parentId, index: found.index } : null
    })
    .filter((change): change is StorageLocationOrderChange => change !== null)

  return { data: nextData, changes }
}
