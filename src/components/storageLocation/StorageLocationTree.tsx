import { useEffect, useRef, useState } from 'react'
import type {
  CreateHandler,
  DeleteHandler,
  MoveHandler,
  NodeApi,
  NodeRendererProps,
  RenameHandler,
  TreeApi,
} from 'react-arborist'
import { Tree } from 'react-arborist'

import type { StorageLocationNode } from '../../api/storageLocation'
import {
  createStorageLocation,
  deleteStorageLocation,
  renameStorageLocation,
  updateStorageLocationOrder,
} from '../../api/storageLocation'
import {
  createStorageLocationNode,
  createTempStorageLocationId,
  deleteStorageLocationNode,
  moveStorageLocationNode,
  renameStorageLocationNode,
} from '../../utils/storageLocationTree'

// ─── Types ────────────────────────────────────────────────────────────────────

interface StorageLocationTreeProps {
  /** 최초 조회된 보관위치 트리. 이후 변경(추가/삭제/이름변경/순서변경)은 컴포넌트가 로컬로 관리한다. */
  initialData: StorageLocationNode[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ROW_HEIGHT = 36
const INDENT = 20
const TREE_HEIGHT = 480

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * 드래그로 순서/부모를 바꿀 수 있는 보관위치 트리 (react-arborist 기반).
 * depth 제한 없이 하위 위치를 계속 추가할 수 있고, 추가/삭제/이름변경/순서변경 시
 * 각각 대응하는 API를 호출한다. 순서 변경(드래그)은 변경이 있을 때마다 매번 호출된다.
 *
 * initialData는 마운트 시 한 번만 로컬 state로 복사되므로, 이후 상위에서 같은 쿼리를
 * 백그라운드 refetch 하더라도 이 트리는 갱신되지 않는다(편집 중인 로컬 상태 우선).
 */
export function StorageLocationTree({ initialData }: StorageLocationTreeProps) {
  // initialData는 React Query 캐시가 들고 있는 객체이므로, 원본과 참조를 끊어 로컬 state로
  // 들고 있는다 — 그래야 이후 편집이 캐시를 오염시키지 않는다.
  const [data, setData] = useState<StorageLocationNode[]>(() => structuredClone(initialData))
  const treeRef = useRef<TreeApi<StorageLocationNode> | undefined>(undefined)

  const handleCreate: CreateHandler<StorageLocationNode> = ({ parentId, index }) => {
    const node: StorageLocationNode = { id: createTempStorageLocationId(), name: '' }
    setData(createStorageLocationNode(data, { parentId, index, node }))

    // [TEMP] 26.08.18 백엔드 미연동 — 생성 응답이 boolean만 반환. 실제 연동 시 서버가 내려주는
    // id로 위 임시 id를 교체(reconcile)하는 로직 추가 필요
    void createStorageLocation({ parentId, name: node.name }).catch((err: unknown) => {
      console.error('[보관위치] 생성 요청 실패', err)
    })

    return node
  }

  const handleRename: RenameHandler<StorageLocationNode> = ({ id, name }) => {
    setData(renameStorageLocationNode(data, { id, name }))

    void renameStorageLocation({ id, name }).catch((err: unknown) => {
      console.error('[보관위치] 이름 변경 요청 실패', err)
    })
  }

  const handleDelete: DeleteHandler<StorageLocationNode> = ({ ids }) => {
    setData(deleteStorageLocationNode(data, ids))

    ids.forEach((id) => {
      void deleteStorageLocation(id).catch((err: unknown) => {
        console.error('[보관위치] 삭제 요청 실패', err)
      })
    })
  }

  const handleMove: MoveHandler<StorageLocationNode> = ({ dragIds, parentId, index }) => {
    const { data: nextData, changes } = moveStorageLocationNode(data, { dragIds, parentId, index })
    setData(nextData)

    // 순서(위치)가 바뀔 때마다 변경된 결과를 매번 API로 전달한다.
    changes.forEach((change) => {
      void updateStorageLocationOrder(change).catch((err: unknown) => {
        console.error('[보관위치] 순서 변경 요청 실패', err)
      })
    })
  }

  const handleAddRoot = () => {
    void treeRef.current?.create({ parentId: null, index: data.length })
  }

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <button
          type="button"
          onClick={handleAddRoot}
          className="rounded border border-indigo-500 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
        >
          + 최상위 보관위치 추가
        </button>
      </div>

      <div className="rounded border border-gray-200 p-2">
        {data.length === 0 && (
          <p className="py-10 text-center text-sm text-gray-500">
            등록된 보관위치가 없습니다. 최상위 보관위치를 추가해주세요.
          </p>
        )}

        <Tree
          ref={treeRef}
          data={data}
          onCreate={handleCreate}
          onRename={handleRename}
          onDelete={handleDelete}
          onMove={handleMove}
          idAccessor="id"
          childrenAccessor="children"
          disableMultiSelection
          openByDefault
          width="100%"
          height={TREE_HEIGHT}
          rowHeight={ROW_HEIGHT}
          indent={INDENT}
          aria-label="보관위치 트리"
        >
          {StorageLocationNodeRenderer}
        </Tree>
      </div>

      <p className="mt-2 text-xs text-gray-500">
        드래그하여 순서를 바꿀 수 있고, 이름을 더블클릭하면 수정할 수 있습니다.
      </p>
    </div>
  )
}

// ─── Node renderer ───────────────────────────────────────────────────────────

function StorageLocationNodeRenderer({
  node,
  tree,
  style,
  dragHandle,
}: NodeRendererProps<StorageLocationNode>) {
  return (
    <div
      ref={dragHandle}
      style={style}
      className={`group flex items-center gap-1 rounded px-1 ${
        node.isSelected ? 'bg-indigo-50' : 'hover:bg-gray-50'
      }`}
    >
      <span
        className="shrink-0 cursor-grab select-none text-gray-300"
        aria-hidden="true"
        title="드래그하여 순서 변경"
      >
        ⠿
      </span>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          node.toggle()
        }}
        tabIndex={node.isLeaf ? -1 : 0}
        aria-label={node.isOpen ? `${node.data.name} 접기` : `${node.data.name} 펼치기`}
        className={`w-4 shrink-0 text-xs text-gray-400 ${node.isLeaf ? 'invisible' : ''}`}
      >
        {node.isOpen ? '▼' : '▶'}
      </button>

      {node.isEditing ? (
        <StorageLocationRenameInput node={node} />
      ) : (
        <span
          onDoubleClick={() => void node.edit()}
          className="flex-1 truncate py-1.5 text-sm text-gray-800"
        >
          {node.data.name || '(이름 없음)'}
        </span>
      )}

      <div className="flex shrink-0 gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            void tree.create({ parentId: node.id, index: node.children?.length ?? 0 })
          }}
          aria-label={`${node.data.name || '보관위치'} 하위 위치 추가`}
          className="rounded px-1 text-xs text-indigo-600 hover:bg-indigo-50"
        >
          +
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            void tree.delete(node.id)
          }}
          aria-label={`${node.data.name || '보관위치'} 삭제`}
          className="rounded px-1 text-xs text-red-500 hover:bg-red-50"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

function StorageLocationRenameInput({ node }: { node: NodeApi<StorageLocationNode> }) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  return (
    <input
      ref={inputRef}
      defaultValue={node.data.name}
      onClick={(e) => e.stopPropagation()}
      onBlur={() => node.reset()}
      onKeyDown={(e) => {
        if (e.key === 'Escape') node.reset()
        if (e.key === 'Enter') void node.submit(inputRef.current?.value ?? '')
      }}
      aria-label={`${node.data.name || '보관위치'} 이름 수정`}
      className="flex-1 rounded border border-indigo-400 px-1 py-0.5 text-sm focus:outline-none"
    />
  )
}
