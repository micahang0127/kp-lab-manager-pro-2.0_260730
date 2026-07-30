import { useQuery } from '@tanstack/react-query'
import type { ColumnDef, PaginationState, SortingState } from '@tanstack/react-table'
import { useState } from 'react'

import type { Item } from '../api/item'
import { getItems } from '../api/item'
import { Layout } from '../components/layout/Layout'
import { PAGE_TITLES } from '../components/layout/sidebarMenu'
import { DataTable } from '../components/table/DataTable'
import { formatDate } from '../utils/date'

// ─── Columns ──────────────────────────────────────────────────────────────────

const columns: ColumnDef<Item>[] = [
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
  { accessorKey: 'itemCode', header: '물품코드' },
  { accessorKey: 'itemName', header: '물품명' },
  { accessorKey: 'spec', header: '규격' },
  { accessorKey: 'unit', header: '단위' },
  {
    accessorKey: 'quantity',
    header: '수량',
    cell: (info) => info.getValue<number>().toLocaleString(),
  },
  { accessorKey: 'location', header: '보관장소' },
  {
    accessorKey: 'registeredAt',
    header: '등록일',
    cell: (info) => formatDate(info.getValue<string>()),
  },
]

// ─── Component ─────────────────────────────────────────────────────────────────

export function ItemRegisterPage() {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 50 })
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])

  const { data, isLoading, isError } = useQuery({
    queryKey: ['items', pagination, globalFilter, sorting],
    queryFn: () =>
      getItems({
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
      <section aria-labelledby="item-register-page-title" className="w-full">
        <h1 id="item-register-page-title" className="text-2xl font-bold text-gray-900">
          {PAGE_TITLES['/items/register']}
        </h1>

        {isLoading && <p className="mt-2 text-sm text-gray-600">불러오는 중...</p>}
        {isError && (
          <p role="alert" className="mt-2 text-sm text-red-600">
            물품 목록을 불러오지 못했습니다.
          </p>
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
          />
        </div>
      </section>
    </Layout>
  )
}
