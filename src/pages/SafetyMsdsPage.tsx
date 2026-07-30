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

// [TEMP] 26.07.29 백엔드 미연동 — 샘플 데이터로 처리. 연동 완료 시 실제 API 데이터로 교체
interface MsdsRow {
  id: number
  status: string
  itemInfo: string
  productNumber: string
  casNo: string
  msds: string
  updatedAt: string
}

// [TEMP] 26.07.29 백엔드 미연동 — 샘플 데이터. 연동 완료 시 제거
const SAMPLE_ROWS: MsdsRow[] = [
  {
    id: 1,
    status: '사용중',
    itemInfo: '아세톤 (Acetone)',
    productNumber: 'PN-00123',
    casNo: '67-64-1',
    msds: 'MSDS_아세톤.pdf',
    updatedAt: '2026.07.10',
  },
  {
    id: 2,
    status: '사용중',
    itemInfo: '에탄올 (Ethanol)',
    productNumber: 'PN-00124',
    casNo: '64-17-5',
    msds: 'MSDS_에탄올.pdf',
    updatedAt: '2026.07.11',
  },
  {
    id: 3,
    status: '미등록',
    itemInfo: '톨루엔 (Toluene)',
    productNumber: 'PN-00125',
    casNo: '108-88-3',
    msds: '-',
    updatedAt: '2026.07.12',
  },
  {
    id: 4,
    status: '사용중',
    itemInfo: '황산 (Sulfuric Acid)',
    productNumber: 'PN-00126',
    casNo: '7664-93-9',
    msds: 'MSDS_황산.pdf',
    updatedAt: '2026.07.13',
  },
  {
    id: 5,
    status: '폐기예정',
    itemInfo: '염산 (Hydrochloric Acid)',
    productNumber: 'PN-00127',
    casNo: '7647-01-0',
    msds: 'MSDS_염산.pdf',
    updatedAt: '2026.07.14',
  },
  {
    id: 6,
    status: '사용중',
    itemInfo: '수산화나트륨 (Sodium Hydroxide)',
    productNumber: 'PN-00128',
    casNo: '1310-73-2',
    msds: 'MSDS_수산화나트륨.pdf',
    updatedAt: '2026.07.15',
  },
  {
    id: 7,
    status: '미등록',
    itemInfo: '메탄올 (Methanol)',
    productNumber: 'PN-00129',
    casNo: '67-56-1',
    msds: '-',
    updatedAt: '2026.07.16',
  },
  {
    id: 8,
    status: '사용중',
    itemInfo: '헥산 (n-Hexane)',
    productNumber: 'PN-00130',
    casNo: '110-54-3',
    msds: 'MSDS_헥산.pdf',
    updatedAt: '2026.07.17',
  },
]

// ─── Upload Cell ──────────────────────────────────────────────────────────────

// [TEMP] 26.07.29 백엔드 미연동 — 선택한 파일명만 화면에 표시, 실제 업로드 API 미호출
function MsdsUploadCell({ rowId }: { rowId: number }) {
  const [fileName, setFileName] = useState<string | null>(null)
  const inputId = `msds-upload-${rowId}`

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor={inputId}
        className="cursor-pointer rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-100"
      >
        업로드
      </label>
      <input
        id={inputId}
        type="file"
        className="hidden"
        onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
      />
      {fileName && <span className="truncate text-xs text-gray-600">{fileName}</span>}
    </div>
  )
}

// ─── Columns ──────────────────────────────────────────────────────────────────

const columns: ColumnDef<MsdsRow>[] = [
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
        aria-label={`${row.original.itemInfo} 선택`}
        checked={row.getIsSelected()}
        onChange={row.getToggleSelectedHandler()}
      />
    ),
    enableSorting: false,
    enableResizing: false,
    size: 40,
  },
  { accessorKey: 'status', header: '상태' },
  { accessorKey: 'itemInfo', header: '물품정보' },
  { accessorKey: 'productNumber', header: '제품번호' },
  { accessorKey: 'casNo', header: 'CAS No' },
  { accessorKey: 'msds', header: 'MSDS' },
  {
    id: 'msdsUpload',
    header: '업로드 된 MSDS 관리',
    enableSorting: false,
    cell: ({ row }) => <MsdsUploadCell rowId={row.original.id} />,
  },
  { accessorKey: 'updatedAt', header: '업데이트일' },
]

// ─── Component ─────────────────────────────────────────────────────────────────

export function SafetyMsdsPage() {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 50 })
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  return (
    <Layout>
      <section aria-labelledby="safety-msds-page-title" className="w-full">
        <h1 id="safety-msds-page-title" className="text-2xl font-bold text-gray-900">
          {PAGE_TITLES['/safety/msds']}
        </h1>

        <div className="mt-4">
          <DataTable
            columns={columns}
            data={SAMPLE_ROWS}
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
