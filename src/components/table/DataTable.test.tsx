import type { ColumnDef } from '@tanstack/react-table'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'

import { DataTable } from './DataTable'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

interface Person {
  id: number
  name: string
  age: number
}

const people: Person[] = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  name: `사람${i + 1}`,
  age: 20 + i,
}))

const columns: ColumnDef<Person>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: '이름' },
  { accessorKey: 'age', header: '나이' },
]

const columnsWithSelection: ColumnDef<Person>[] = [
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
        aria-label={`${row.original.name} 선택`}
        checked={row.getIsSelected()}
        onChange={row.getToggleSelectedHandler()}
      />
    ),
    enableSorting: false,
  },
  ...columns,
]

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('DataTable', () => {
  afterEach(() => {
    cleanup()
  })

  it('헤더와 전체 행을 렌더링한다 (기본 페이지 크기 50 — 12건이라 1페이지에 모두 표시)', () => {
    render(<DataTable columns={columns} data={people} />)

    expect(screen.getByText('ID')).toBeInTheDocument()
    expect(screen.getByText('이름')).toBeInTheDocument()
    expect(screen.getByText('나이')).toBeInTheDocument()

    expect(screen.getByText('사람1')).toBeInTheDocument()
    expect(screen.getByText('사람12')).toBeInTheDocument()
    expect(screen.getByText('12개 중 1 - 12')).toBeInTheDocument()
  })

  it('페이지당 표시 개수를 10개로 바꾸면 1페이지가 다시 계산되고 총 개수 요약이 갱신된다', async () => {
    render(<DataTable columns={columns} data={people} />)

    await userEvent.selectOptions(screen.getByLabelText('페이지당 표시 개수'), '10')

    expect(screen.getByText('사람1')).toBeInTheDocument()
    expect(screen.getByText('사람10')).toBeInTheDocument()
    expect(screen.queryByText('사람11')).not.toBeInTheDocument()
    expect(screen.getByText('12개 중 1 - 10')).toBeInTheDocument()
  })

  it('페이지 번호 버튼을 클릭하면 해당 페이지로 이동한다', async () => {
    render(<DataTable columns={columns} data={people} />)
    await userEvent.selectOptions(screen.getByLabelText('페이지당 표시 개수'), '10')

    await userEvent.click(screen.getByRole('button', { name: '2' }))

    expect(screen.getByText('사람11')).toBeInTheDocument()
    expect(screen.getByText('사람12')).toBeInTheDocument()
    expect(screen.queryByText('사람1')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '2' })).toHaveAttribute('aria-current', 'page')
  })

  it('"다음 페이지"/"마지막 페이지" 아이콘 버튼으로 이동할 수 있다', async () => {
    render(<DataTable columns={columns} data={people} />)
    await userEvent.selectOptions(screen.getByLabelText('페이지당 표시 개수'), '10')

    await userEvent.click(screen.getByRole('button', { name: '다음 페이지' }))
    expect(screen.getByText('사람11')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: '처음 페이지' }))
    expect(screen.getByText('사람1')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: '마지막 페이지' }))
    expect(screen.getByText('사람12')).toBeInTheDocument()
  })

  it('검색어를 입력만 하고 검색 버튼을 누르지 않으면 필터링되지 않는다', async () => {
    render(<DataTable columns={columns} data={people} />)

    await userEvent.type(screen.getByLabelText('테이블 검색'), '사람7')

    expect(screen.getByText('사람1')).toBeInTheDocument()
    expect(screen.getByText('사람2')).toBeInTheDocument()
  })

  it('검색어를 입력하고 검색 버튼을 누르면 일치하는 행만 표시된다', async () => {
    render(<DataTable columns={columns} data={people} />)

    await userEvent.type(screen.getByLabelText('테이블 검색'), '사람7')
    await userEvent.click(screen.getByRole('button', { name: '검색' }))

    expect(screen.getByText('사람7')).toBeInTheDocument()
    expect(screen.queryByText('사람1')).not.toBeInTheDocument()
    expect(screen.queryByText('사람2')).not.toBeInTheDocument()
  })

  it('컬럼 헤더 경계를 드래그하면 해당 컬럼 너비가 변경된다', () => {
    render(<DataTable columns={columns} data={people} />)

    const idHeader = screen.getByText('ID').closest('th') as HTMLElement
    const resizeHandle = within(idHeader).getByTestId(/^column-resize-handle-/)
    const widthBefore = parseInt(idHeader.style.width, 10)

    fireEvent.mouseDown(resizeHandle, { clientX: 0, bubbles: true })
    fireEvent.mouseMove(document, { clientX: 80, bubbles: true })
    fireEvent.mouseUp(document, { clientX: 80, bubbles: true })

    const widthAfter = parseInt(idHeader.style.width, 10)
    expect(widthAfter).toBeGreaterThan(widthBefore)
  })

  it('ID 헤더를 클릭하면 오름차순, 다시 클릭하면 내림차순으로 정렬된다', async () => {
    render(<DataTable columns={columns} data={people} />)

    const sortButton = screen.getByTestId('column-sort-button-id')
    const idHeader = sortButton.closest('th') as HTMLElement

    await userEvent.click(sortButton)
    expect(idHeader).toHaveAttribute('aria-sort', 'descending')

    // 내림차순 정렬 시 데이터 행 순서가 id 12→1 순으로 뒤집힌다 (기본 페이지 크기 50이라 12건 모두 1페이지에 표시됨)
    let dataRows = screen.getAllByRole('row').slice(1)
    expect(dataRows[0]).toHaveTextContent('사람12')
    expect(dataRows[dataRows.length - 1]).toHaveTextContent('사람1')

    await userEvent.click(sortButton)
    expect(idHeader).toHaveAttribute('aria-sort', 'ascending')

    dataRows = screen.getAllByRole('row').slice(1)
    expect(dataRows[0]).toHaveTextContent('사람1')
    expect(dataRows[dataRows.length - 1]).toHaveTextContent('사람12')
  })

  it('데이터가 없으면 안내 문구가 표시된다', () => {
    render(<DataTable columns={columns} data={[]} />)

    expect(screen.getByText('데이터가 없습니다.')).toBeInTheDocument()
  })

  it('체크박스로 행을 선택하고, 전체 선택 체크박스로 모든 행을 선택할 수 있다', async () => {
    render(<DataTable columns={columnsWithSelection} data={people} />)

    const row1Checkbox = screen.getByLabelText('사람1 선택')
    await userEvent.click(row1Checkbox)
    expect(row1Checkbox).toBeChecked()

    const selectAllCheckbox = screen.getByLabelText('전체 선택')
    expect(selectAllCheckbox).not.toBeChecked()

    await userEvent.click(selectAllCheckbox)
    expect(screen.getByLabelText('사람2 선택')).toBeChecked()
    expect(screen.getByLabelText('사람12 선택')).toBeChecked()
  })
})
