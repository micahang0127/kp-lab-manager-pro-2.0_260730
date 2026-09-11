import { useQuery } from '@tanstack/react-query'
import type {
  ColumnDef,
  PaginationState,
  RowSelectionState,
  SortingState,
} from '@tanstack/react-table'
import { useState } from 'react'

import type { IncomingItem } from '../api/itemIncoming'
import { getIncomingItems } from '../api/itemIncoming'
import { ErrorMessage } from '../components/error/ErrorMessage'
import { Layout } from '../components/layout/Layout'
import { PAGE_TITLES } from '../components/layout/sidebarMenu'
import { DataTable } from '../components/table/DataTable'

// ─── Columns ──────────────────────────────────────────────────────────────────

const columns: ColumnDef<IncomingItem>[] = [
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
        aria-label={`${row.original.itemName} 선택`}
        checked={row.getIsSelected()}
        onChange={row.getToggleSelectedHandler()}
      />
    ),
    enableSorting: false,
    enableResizing: false,
    size: 40,
  },
  {
    accessorKey: 'quantity',
    header: '수량',
    cell: ({ row }) => <span>{row.original.quantity}개</span>,
  },
  { accessorKey: 'location', header: '위치/보관함' },
  { accessorKey: 'purchaseRoute', header: '구매처' },
  { accessorKey: 'itemName', header: '정보' },
  { accessorKey: 'category', header: '카테고리' },
  {
    accessorKey: 'brand',
    header: '브랜드',
    cell: (info) => info.getValue<string | null>() ?? '-',
  },
  {
    accessorKey: 'productNumber',
    header: '제품번호',
    cell: (info) => info.getValue<string | null>() ?? '-',
  },
  {
    accessorKey: 'packageQuantity',
    header: '용량/패키지 수량',
    cell: (info) => info.getValue<string | null>() ?? '-',
  },
  {
    accessorKey: 'shippingInfo',
    header: '배송정보',
    cell: (info) => info.getValue<string | null>() ?? '-',
  },
]

// ─── Component ─────────────────────────────────────────────────────────────────

export function ItemIncomingPendingPage() {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 50 })
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  const { data, isLoading, isError } = useQuery({
    queryKey: ['incoming-items', pagination, globalFilter, sorting],
    queryFn: () =>
      getIncomingItems({
        page: pagination.pageIndex,
        limit: pagination.pageSize,
        keyword: globalFilter,
        sortBy: sorting[0]?.id,
        sortOrder: sorting[0] ? (sorting[0].desc ? 'desc' : 'asc') : undefined,
      }),
    select: (res) => res.data,
  })

  return (
    <Layout>
      <section aria-labelledby="item-incoming-pending-page-title" className="w-full">
        <h1 id="item-incoming-pending-page-title" className="text-2xl font-bold text-gray-900">
          {PAGE_TITLES['/items/incoming-pending']}
        </h1>

        {isLoading && <p className="mt-2 text-sm text-gray-600">불러오는 중...</p>}
        {isError && (
          <ErrorMessage
            message="입고등록대기 목록을 불러오지 못했습니다."
            size="sm"
            className="mt-2"
          />
        )}

        <div className="mt-4">
          <DataTable
            columns={columns}
            data={data?.data ?? []}
            manualPagination
            pageCount={data?.totalPages ?? 0}
            pagination={pagination}
            onPaginationChange={setPagination}
            manualFiltering
            globalFilter={globalFilter}
            onGlobalFilterChange={setGlobalFilter}
            manualSorting
            sorting={sorting}
            onSortingChange={setSorting}
            totalCount={data?.total ?? 0}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
          />
        </div>
      </section>
    </Layout>
  )
}
