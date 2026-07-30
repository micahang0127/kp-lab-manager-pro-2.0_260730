// [TEMP] 26.07.27 디자인 미확정 — 스타일은 최소한만 적용. Figma 디자인 확정 후 클래스만 교체할 것
import type {
  ColumnDef,
  OnChangeFn,
  PaginationState,
  RowSelectionState,
  SortingState,
} from '@tanstack/react-table'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useEffect, useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DataTableProps<TData> {
  columns: ColumnDef<TData>[]
  data: TData[]

  /** 서버 사이드 페이지네이션 사용 여부. true면 pageCount와 pagination/onPaginationChange를 함께 넘겨야 한다. */
  manualPagination?: boolean
  pageCount?: number
  pagination?: PaginationState
  onPaginationChange?: OnChangeFn<PaginationState>

  /** 서버 사이드 필터링 사용 여부. true면 data를 이미 필터링된 상태로 넘겨야 한다. */
  manualFiltering?: boolean
  globalFilter?: string
  onGlobalFilterChange?: OnChangeFn<string>

  /** 서버 사이드 정렬 사용 여부. true면 sorting/onSortingChange를 함께 넘기고, 정렬 기준을 API 파라미터로 변환하는 것은 호출 측 책임이다. */
  manualSorting?: boolean
  sorting?: SortingState
  onSortingChange?: OnChangeFn<SortingState>

  /** 총 개수 요약("N개 중 X - Y") 표시용. 서버 모드(manualPagination)에서는 API 응답의 total을 반드시 넘겨야 한다. 생략 시(클라이언트 모드) 필터링된 행 수로 자동 계산. */
  totalCount?: number
  /** 페이지당 표시 개수 select 옵션 (기본: 10/50/100/150/200/250/300) */
  pageSizeOptions?: number[]

  /** 행 선택(체크박스) 상태. DataTable은 상태만 관리하며, 체크박스 UI는 호출 측이 `id: 'select'` 컬럼을 정의해 `row.getIsSelected()`/`row.getToggleSelectedHandler()`(헤더는 `table.getIsAllRowsSelected()`/`table.getToggleAllRowsSelectedHandler()`)로 직접 렌더링해야 한다. */
  rowSelection?: RowSelectionState
  onRowSelectionChange?: OnChangeFn<RowSelectionState>
}

const DEFAULT_PAGE_SIZE = 50
const DEFAULT_PAGE_SIZE_OPTIONS = [10, 50, 100, 150, 200, 250, 300]
const MAX_VISIBLE_PAGE_NUMBERS = 5

// ─── Icons ────────────────────────────────────────────────────────────────────

function ChevronIcon({ double = false, className = '' }: { double?: boolean; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className={`h-4 w-4 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12.5 15.5 7 10l5.5-5.5" />
      {double && <path strokeLinecap="round" strokeLinejoin="round" d="M17 15.5 11.5 10 17 4.5" />}
    </svg>
  )
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function DataTable<TData>({
  columns,
  data,
  manualPagination = false,
  pageCount,
  pagination,
  onPaginationChange,
  manualFiltering = false,
  globalFilter,
  onGlobalFilterChange,
  manualSorting = false,
  sorting,
  onSortingChange,
  totalCount,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  rowSelection,
  onRowSelectionChange,
}: DataTableProps<TData>) {
  const [internalPagination, setInternalPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  })
  const [internalGlobalFilter, setInternalGlobalFilter] = useState('')
  const [internalSorting, setInternalSorting] = useState<SortingState>([])
  const [internalRowSelection, setInternalRowSelection] = useState<RowSelectionState>({})

  const paginationState = pagination ?? internalPagination
  const globalFilterState = globalFilter ?? internalGlobalFilter
  const setGlobalFilterState = onGlobalFilterChange ?? setInternalGlobalFilter
  const sortingState = sorting ?? internalSorting
  const setSortingState = onSortingChange ?? setInternalSorting
  const setPaginationState = onPaginationChange ?? setInternalPagination
  const rowSelectionState = rowSelection ?? internalRowSelection
  const setRowSelectionState = onRowSelectionChange ?? setInternalRowSelection

  // 검색어 입력값은 실제 필터 상태와 분리한다 — 타이핑마다 globalFilterState가 바뀌면
  // (서버 검색 모드에서는 API 재조회까지 트리거되어) 테이블 전체가 리렌더링되며 화면이 깜빡인다.
  // "검색" 버튼을 눌렀을 때만 실제 필터 상태로 반영한다.
  const [searchInput, setSearchInput] = useState(globalFilterState)

  useEffect(() => {
    setSearchInput(globalFilterState)
  }, [globalFilterState])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setGlobalFilterState(searchInput)
  }

  const table = useReactTable({
    data,
    columns,
    state: {
      pagination: paginationState,
      globalFilter: globalFilterState,
      sorting: sortingState,
      rowSelection: rowSelectionState,
    },
    onPaginationChange: setPaginationState,
    onGlobalFilterChange: setGlobalFilterState,
    onSortingChange: setSortingState,
    onRowSelectionChange: setRowSelectionState,
    manualPagination,
    manualFiltering,
    manualSorting,
    enableRowSelection: true,
    pageCount: manualPagination ? pageCount : undefined,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
  })

  const totalPages = Math.max(table.getPageCount(), 1)
  const currentPageNumber = table.getState().pagination.pageIndex + 1
  let windowStart = Math.max(1, currentPageNumber - Math.floor(MAX_VISIBLE_PAGE_NUMBERS / 2))
  const windowEnd = Math.min(totalPages, windowStart + MAX_VISIBLE_PAGE_NUMBERS - 1)
  windowStart = Math.max(1, windowEnd - MAX_VISIBLE_PAGE_NUMBERS + 1)
  const pageNumbers = Array.from({ length: windowEnd - windowStart + 1 }, (_, i) => windowStart + i)

  const resolvedTotalCount = totalCount ?? table.getFilteredRowModel().rows.length
  const rangeStart =
    resolvedTotalCount === 0 ? 0 : paginationState.pageIndex * paginationState.pageSize + 1
  const rangeEnd =
    resolvedTotalCount === 0
      ? 0
      : Math.min(rangeStart + paginationState.pageSize - 1, resolvedTotalCount)

  return (
    <div>
      {/* 전역 필터 — 입력만으로는 검색되지 않고, "검색" 버튼을 눌러야 실제 필터 상태에 반영된다 */}
      <form onSubmit={handleSearchSubmit} className="mb-3 flex">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="검색..."
          aria-label="테이블 검색"
          className="rounded border border-gray-300 px-3 py-1.5 text-sm"
        />
        <button
          type="submit"
          className="rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100"
        >
          검색
        </button>
      </form>

      {/* 테이블: 컬럼이 넓어지면 이 영역만 좌우 스크롤되고, 페이지네이션/표시 개수 select는 스크롤 영역 밖에 유지된다 */}
      <div className="overflow-x-auto">
        <table className="border-collapse text-sm" style={{ width: table.getTotalSize() }}>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const sortDirection = header.column.getIsSorted()
                  const ariaSort = !header.column.getCanSort()
                    ? undefined
                    : sortDirection === 'asc'
                      ? 'ascending'
                      : sortDirection === 'desc'
                        ? 'descending'
                        : 'none'

                  return (
                    <th
                      key={header.id}
                      colSpan={header.colSpan}
                      style={{ width: header.getSize() }}
                      aria-sort={ariaSort}
                      className="relative border-b border-gray-200 px-3 py-2 text-left font-medium text-gray-700"
                    >
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          data-testid={`column-sort-button-${header.id}`}
                          className="flex items-center gap-1"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {sortDirection && (
                            <span aria-hidden="true">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                          )}
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}

                      {header.column.getCanResize() && (
                        <div
                          aria-hidden="true"
                          data-testid={`column-resize-handle-${header.id}`}
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          className={`absolute right-0 top-0 h-full w-1 cursor-col-resize touch-none select-none ${
                            header.column.getIsResizing() ? 'bg-indigo-500' : 'hover:bg-indigo-300'
                          }`}
                        />
                      )}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={table.getVisibleLeafColumns().length}
                  className="border-b border-gray-100 px-3 py-8 text-center text-gray-500"
                >
                  데이터가 없습니다.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      style={{ width: cell.column.getSize() }}
                      className="border-b border-gray-100 px-3 py-2"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 컨트롤 */}
      <div className="mt-3 grid grid-cols-3 items-center text-sm text-gray-600">
        <div />

        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            aria-label="처음 페이지"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="rounded border border-gray-300 p-1 disabled:opacity-40"
          >
            <ChevronIcon double />
          </button>
          <button
            type="button"
            aria-label="이전 페이지"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="rounded border border-gray-300 p-1 disabled:opacity-40"
          >
            <ChevronIcon />
          </button>

          {pageNumbers.map((page) => (
            <button
              key={page}
              type="button"
              aria-current={page === currentPageNumber ? 'page' : undefined}
              onClick={() => table.setPageIndex(page - 1)}
              className={`rounded px-2 py-1 ${
                page === currentPageNumber
                  ? 'bg-orange-100 font-semibold text-orange-600'
                  : 'hover:bg-gray-100'
              }`}
            >
              {page}
            </button>
          ))}

          <button
            type="button"
            aria-label="다음 페이지"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="rounded border border-gray-300 p-1 disabled:opacity-40"
          >
            <ChevronIcon className="scale-x-[-1]" />
          </button>
          <button
            type="button"
            aria-label="마지막 페이지"
            onClick={() => table.setPageIndex(totalPages - 1)}
            disabled={!table.getCanNextPage()}
            className="rounded border border-gray-300 p-1 disabled:opacity-40"
          >
            <ChevronIcon double className="scale-x-[-1]" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2">
          <span>
            {resolvedTotalCount}개 중 {rangeStart} - {rangeEnd}
          </span>
          <select
            aria-label="페이지당 표시 개수"
            value={paginationState.pageSize}
            onChange={(e) => setPaginationState({ pageIndex: 0, pageSize: Number(e.target.value) })}
            className="rounded border border-gray-300 px-2 py-1"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}개
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
