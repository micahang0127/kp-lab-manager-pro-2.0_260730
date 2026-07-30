import type {
  ColumnDef,
  PaginationState,
  RowSelectionState,
  SortingState,
} from '@tanstack/react-table'
import { useState } from 'react'

import { Layout } from '../components/layout/Layout'
import { PAGE_TITLES } from '../components/layout/sidebarMenu'
import { DataTable } from '../components/table/DataTable'

// ─── Types ────────────────────────────────────────────────────────────────────

// [TEMP] 26.07.29 백엔드 미연동 — 컬럼/데이터 미확정. 연동 완료 시 실제 타입/컬럼으로 교체
interface PlaceholderRow {
  id: number
  col1: string
  col2: string
  col3: string
}

// ─── Columns ──────────────────────────────────────────────────────────────────

const columns: ColumnDef<PlaceholderRow>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <input
        type="checkbox"
        aria-label="전체 선택"
        checked={table.getIsAllRowsSelected()}
        onChange={table.getToggleAllRowsSelectedHandler()}
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        aria-label={`${row.original.id}번 행 선택`}
        checked={row.getIsSelected()}
        onChange={row.getToggleSelectedHandler()}
      />
    ),
    enableSorting: false,
    enableResizing: false,
    size: 40,
  },
  { accessorKey: 'col1', header: '컬럼1' },
  { accessorKey: 'col2', header: '컬럼2' },
  { accessorKey: 'col3', header: '컬럼3' },
]

// ─── Component ─────────────────────────────────────────────────────────────────

export function ItemPhotoPendingPage() {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 50 })
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  return (
    <Layout>
      <section aria-labelledby="item-photo-pending-page-title" className="w-full">
        <h1 id="item-photo-pending-page-title" className="text-2xl font-bold text-gray-900">
          {PAGE_TITLES['/items/photo-pending']}
        </h1>

        <div className="mt-4">
          <DataTable
            columns={columns}
            data={[]}
            pagination={pagination}
            onPaginationChange={setPagination}
            globalFilter={globalFilter}
            onGlobalFilterChange={setGlobalFilter}
            sorting={sorting}
            onSortingChange={setSorting}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
          />
        </div>
      </section>
    </Layout>
  )
}
