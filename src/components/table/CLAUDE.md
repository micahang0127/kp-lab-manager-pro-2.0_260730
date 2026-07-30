# src/components/table — 테이블 컴포넌트 규칙

## 라이브러리

`@tanstack/react-table` (headless). 자체 스타일이 없어 Tailwind로 자유롭게 마크업할 수 있고,
이미 쓰는 `@tanstack/react-query`/`@tanstack/react-router`와 같은 설계 철학(선언적 옵션 객체)을 공유한다.

- 새 UI 컴포넌트 라이브러리(MUI/AntD 등)나 별도 그리드 라이브러리를 추가로 들여오지 말 것 — 시각 디자인은 추후 Figma 작업물로 확정된다.

## 파일 구조

- `DataTable.tsx` — 재사용 가능한 얇은 래퍼 컴포넌트 (리사이즈/페이징/필터/정렬 포함)
- `DataTable.test.tsx` — RTL 테스트 (네트워크 없음, 순수 UI 동작만 검증)

## `DataTable` 사용법

```tsx
import type { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '../components/table/DataTable'

interface Item {
  id: number
  name: string
}

const columns: ColumnDef<Item>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: '이름' },
]

// 클라이언트 모드 (기본) — data 전체를 넘기면 페이징/필터링을 컴포넌트가 알아서 처리
<DataTable columns={columns} data={items} />
```

### 서버 페이지네이션/필터링/정렬로 전환

목록 API가 `PagedData`(`src/api/index.ts`)를 실제로 반환하게 되면 아래처럼 `manual*` 옵션으로 전환한다.
이때 `data`는 **현재 페이지 분량만** 넘기고, 페이지 이동/검색/정렬은 React Query의 `queryKey`에 `pagination`/`globalFilter`/`sorting`을 포함시켜 다시 fetch하는 방식으로 연결한다.

`useQuery`의 `queryFn`은 `ApiResponse<T>`(`{ statusCode, data, error }`)를 그대로 반환하므로, 아래 예시의 `paged?.data`/`paged?.totalPages`처럼 곧바로 접근하려면 **`select: (res) => res.data`로 한 번 벗겨내야 한다** (안 그러면 `paged`가 `ApiResponse` 자체라 `paged.data`는 목록이 아니라 페이지 메타를 포함한 객체가 됨).

```tsx
const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 50 })
const [globalFilter, setGlobalFilter] = useState('')
const [sorting, setSorting] = useState<SortingState>([])

const { data: paged } = useQuery({
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

<DataTable
  columns={columns}
  data={paged?.data ?? []}
  manualPagination
  pageCount={paged?.totalPages ?? 0}
  pagination={pagination}
  onPaginationChange={setPagination}
  manualFiltering
  globalFilter={globalFilter}
  onGlobalFilterChange={setGlobalFilter}
  manualSorting
  sorting={sorting}
  onSortingChange={setSorting}
  totalCount={paged?.total ?? 0}
/>
```

- 서버 응답 데이터를 Zustand에 복제 저장하지 말 것 — 위 예시처럼 React Query 캐시가 곧 상태다.
- `totalCount`는 "N개 중 X - Y" 요약 텍스트용으로, 서버 모드에서는 API 응답의 `total`을 반드시 연결해야 정확한 값이 나온다(생략 시 현재 페이지 행 수만 보임). 클라이언트 모드에서는 생략하면 필터링된 전체 행 수로 자동 계산된다.

## 페이지네이션 UI

- 표 하단은 "이전"/"다음" 텍스트 버튼이 아니라 **처음(«)/이전(‹)/페이지 번호들/다음(›)/마지막(»)** 형태의 넘버 페이지네이션이다. 아이콘은 별도 라이브러리 없이 컴포넌트 내부 `ChevronIcon`(인라인 SVG)로 구현되어 있다.
- 페이지 번호는 현재 페이지를 중심으로 최대 5개까지만 보여주는 윈도우 방식(`MAX_VISIBLE_PAGE_NUMBERS`)이며 말줄임표는 없다.
- 기본 페이지 크기는 **50개** (`DEFAULT_PAGE_SIZE`), select 옵션은 **10/50/100/150/200/250/300** (`pageSizeOptions` prop, 기본값 `DEFAULT_PAGE_SIZE_OPTIONS`). 다른 값이 필요하면 `pageSizeOptions`로 재정의.
- 우측에는 `totalCount`/현재 페이지 상태로 계산한 "N개 중 X - Y" 요약과 페이지 크기 select가 있다. select에서 크기를 바꾸면 항상 1페이지로 리셋된다(범위 초과 페이지 방지).
- 접근성: 아이콘 버튼은 `aria-label`("처음 페이지"/"이전 페이지"/"다음 페이지"/"마지막 페이지"), 현재 페이지 번호 버튼은 `aria-current="page"`.
- 좌우 스크롤은 `<table>` 요소만 감싼 내부 `overflow-x-auto` 래퍼에 적용된다 — 컬럼이 많아 표가 넓어져도 검색 input과 페이지네이션/표시 개수 select는 스크롤 영역 밖에 고정되어 항상 보인다. 호출 측(페이지)에서 `DataTable`을 다시 `overflow-x-auto`로 감쌀 필요 없음(오히려 페이지네이션까지 스크롤 영역에 들어가 버리므로 하지 말 것).

## 컬럼 리사이즈

- `enableColumnResizing`/`columnResizeMode: 'onChange'`가 컴포넌트 내부에 항상 켜져 있음 — 컬럼 정의에서 별도 설정 불필요.
- 컬럼별 최소/기본/최대 너비를 바꾸고 싶으면 `ColumnDef`에 `size`/`minSize`/`maxSize`를 지정 (기본값: `size: 150, minSize: 20`).
- 리사이즈 핸들을 테스트할 때는 `mousedown`/`mousemove`/`mouseup` 각각에 **`bubbles: true`와 동일한 `clientX`(mouseup 포함)**를 반드시 넘길 것 — `mouseup`에 `clientX`를 빠뜨리면 라이브러리 내부 로직이 드래그 종료 시점에 델타를 0으로 재계산해 원래 크기로 되돌아간다. `DataTable.test.tsx`의 리사이즈 테스트 참고.

## 컬럼 정렬

- 기본적으로 모든 컬럼이 정렬 가능(헤더 클릭 시 오름차순 → 내림차순 → 정렬 해제 순환). 특정 컬럼을 정렬 불가로 만들려면 `ColumnDef`에 `enableSorting: false` 지정.
- 정렬 표시자: 미정렬 상태는 표시자 없음, 오름차순은 `▲`, 내림차순은 `▼` (이모지가 아닌 일반 유니코드 기호). Figma 디자인 확정 후에도 이 마크업(버튼 + 표시자 `span`) 구조는 유지한 채 `className`만 교체할 것.
- 정렬 버튼(`<button data-testid="column-sort-button-{header.id}">`)과 리사이즈 핸들(`<div data-testid="column-resize-handle-{header.id}">`)은 `<th>` 안에서 서로 다른 형제 엘리먼트로 존재한다 — 이벤트가 서로의 상위로 버블링되지 않아 드래그(리사이즈)와 클릭(정렬)이 구조적으로 충돌하지 않는다. 유지보수 시 이 둘을 하나의 엘리먼트로 합치지 말 것.

## 행 선택 (체크박스)

- `DataTable`은 `rowSelection`/`onRowSelectionChange` 상태만 관리하고(내부적으로 항상 `enableRowSelection: true`), 체크박스 UI 자체는 렌더링하지 않는다 — 필요한 페이지에서 `id: 'select'` 컬럼을 직접 정의해야 한다.
- 패턴:

  ```tsx
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
    },
    // ...나머지 컬럼
  ]

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  <DataTable columns={columns} data={data} rowSelection={rowSelection} onRowSelectionChange={setRowSelection} />
  ```

- `enableResizing: false`로 지정하면 체크박스 컬럼에는 리사이즈 핸들이 생기지 않는다. `enableSorting: false`로 정렬 버튼도 생기지 않는다(체크박스만 표시).
- `rowSelection`/`onRowSelectionChange`를 넘기지 않으면 컴포넌트 내부 상태로 동작(비제어) — 다른 페이지에서 선택 상태를 읽거나 초기화할 필요가 없다면 굳이 상위에서 상태를 들고 있지 않아도 된다.

## 스타일 (임시 상태)

`DataTable.tsx` 상단에 `[TEMP]`로 표시되어 있듯, 현재 스타일은 최소한(테두리/패딩)만 적용된 상태다.
Figma 디자인이 확정되면 마크업 구조(각 `<th>`/`<td>`에 `style={{ width: ... }}`로 컬럼 너비를 바인딩하는 부분)는 유지한 채 `className`만 교체할 것 — 너비 바인딩을 제거하면 리사이즈 기능이 깨진다.

## 체크리스트 (새 목록 페이지에서 `DataTable` 사용 시)

- [ ] `ColumnDef<TData>[]`에 `any` 사용 금지 — 제네릭 `TData`로 타입 추론
- [ ] 목록 API가 실제로 있으면 `manualPagination`/`manualFiltering`으로 전환 (없으면 클라이언트 모드 그대로 사용)
- [ ] 정렬이 필요하면 `manualSorting`/`sorting`/`onSortingChange`로 전환 (컬럼별로 끄려면 `enableSorting: false`)
- [ ] 서버 모드라면 `totalCount`에 API 응답의 `total`을 연결 (안 하면 "N개 중 X - Y" 요약이 부정확해짐)
- [ ] 테스트: 렌더링 + 최소 1개 상호작용(페이징 또는 필터) 검증
