import type { ApiResponse, PagedData } from '.'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Item {
  id: number
  itemCode: string
  itemName: string
  spec: string
  unit: string
  quantity: number
  location: string
  registeredAt: string
}

export interface GetItemsParams {
  /** 0-based 페이지 인덱스 */
  page?: number
  limit?: number
  /** 물품코드/물품명 부분 일치 검색어 */
  keyword?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface ItemListResult extends PagedData {
  data: Item[]
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

// [TEMP] 26.07.28
const seedItems: Item[] = [
  {
    id: 1,
    itemCode: 'CHM-0001',
    itemName: '에탄올',
    spec: '99.5% 500mL',
    unit: '병',
    quantity: 24,
    location: '시약보관실 A-1',
    registeredAt: '2026-01-05T00:00:00.000Z',
  },
  {
    id: 2,
    itemCode: 'CHM-0002',
    itemName: '메탄올',
    spec: '99.9% 500mL',
    unit: '병',
    quantity: 18,
    location: '시약보관실 A-1',
    registeredAt: '2026-01-06T00:00:00.000Z',
  },
  {
    id: 3,
    itemCode: 'CHM-0003',
    itemName: '아세톤',
    spec: '99.5% 1L',
    unit: '병',
    quantity: 12,
    location: '시약보관실 A-2',
    registeredAt: '2026-01-08T00:00:00.000Z',
  },
  {
    id: 4,
    itemCode: 'CHM-0004',
    itemName: '염산',
    spec: '35% 500mL',
    unit: '병',
    quantity: 9,
    location: '시약보관실 B-1',
    registeredAt: '2026-01-10T00:00:00.000Z',
  },
  {
    id: 5,
    itemCode: 'CHM-0005',
    itemName: '황산',
    spec: '95% 500mL',
    unit: '병',
    quantity: 7,
    location: '시약보관실 B-1',
    registeredAt: '2026-01-12T00:00:00.000Z',
  },
  {
    id: 6,
    itemCode: 'CHM-0006',
    itemName: '질산',
    spec: '65% 500mL',
    unit: '병',
    quantity: 6,
    location: '시약보관실 B-2',
    registeredAt: '2026-01-14T00:00:00.000Z',
  },
  {
    id: 7,
    itemCode: 'CHM-0007',
    itemName: '수산화나트륨',
    spec: '98% 1kg',
    unit: '통',
    quantity: 15,
    location: '시약보관실 B-2',
    registeredAt: '2026-01-16T00:00:00.000Z',
  },
  {
    id: 8,
    itemCode: 'CHM-0008',
    itemName: '염화나트륨',
    spec: '99% 1kg',
    unit: '통',
    quantity: 30,
    location: '시약보관실 C-1',
    registeredAt: '2026-01-18T00:00:00.000Z',
  },
  {
    id: 9,
    itemCode: 'GLS-0001',
    itemName: '비커',
    spec: '500mL',
    unit: '개',
    quantity: 40,
    location: '기구보관실 1',
    registeredAt: '2026-01-20T00:00:00.000Z',
  },
  {
    id: 10,
    itemCode: 'GLS-0002',
    itemName: '삼각플라스크',
    spec: '250mL',
    unit: '개',
    quantity: 35,
    location: '기구보관실 1',
    registeredAt: '2026-01-22T00:00:00.000Z',
  },
  {
    id: 11,
    itemCode: 'GLS-0003',
    itemName: '메스실린더',
    spec: '100mL',
    unit: '개',
    quantity: 20,
    location: '기구보관실 2',
    registeredAt: '2026-01-24T00:00:00.000Z',
  },
  {
    id: 12,
    itemCode: 'GLS-0004',
    itemName: '피펫',
    spec: '10mL',
    unit: '개',
    quantity: 50,
    location: '기구보관실 2',
    registeredAt: '2026-01-26T00:00:00.000Z',
  },
  {
    id: 13,
    itemCode: 'CSM-0001',
    itemName: '라텍스 장갑',
    spec: 'M 사이즈 100매',
    unit: '박스',
    quantity: 22,
    location: '소모품보관실 1',
    registeredAt: '2026-01-28T00:00:00.000Z',
  },
  {
    id: 14,
    itemCode: 'CSM-0002',
    itemName: '마스크',
    spec: 'KF94 50매',
    unit: '박스',
    quantity: 16,
    location: '소모품보관실 1',
    registeredAt: '2026-01-30T00:00:00.000Z',
  },
  {
    id: 15,
    itemCode: 'CSM-0003',
    itemName: '알루미늄 호일',
    spec: '30cm x 20m',
    unit: '롤',
    quantity: 10,
    location: '소모품보관실 2',
    registeredAt: '2026-02-01T00:00:00.000Z',
  },
  {
    id: 16,
    itemCode: 'CSM-0004',
    itemName: '파라필름',
    spec: '10cm x 20m',
    unit: '롤',
    quantity: 8,
    location: '소모품보관실 2',
    registeredAt: '2026-02-03T00:00:00.000Z',
  },
  {
    id: 17,
    itemCode: 'CHM-0009',
    itemName: '톨루엔',
    spec: '99.8% 1L',
    unit: '병',
    quantity: 11,
    location: '시약보관실 C-2',
    registeredAt: '2026-02-05T00:00:00.000Z',
  },
  {
    id: 18,
    itemCode: 'CHM-0010',
    itemName: '자일렌',
    spec: '99% 1L',
    unit: '병',
    quantity: 9,
    location: '시약보관실 C-2',
    registeredAt: '2026-02-07T00:00:00.000Z',
  },
  {
    id: 19,
    itemCode: 'GLS-0005',
    itemName: '페트리 접시',
    spec: '90mm',
    unit: '개',
    quantity: 60,
    location: '기구보관실 3',
    registeredAt: '2026-02-09T00:00:00.000Z',
  },
  {
    id: 20,
    itemCode: 'GLS-0006',
    itemName: '시험관',
    spec: '15mL',
    unit: '개',
    quantity: 80,
    location: '기구보관실 3',
    registeredAt: '2026-02-11T00:00:00.000Z',
  },
]

// ─── API ─────────────────────────────────────────────────────────────────────

const DEFAULT_PAGE = 0
const DEFAULT_LIMIT = 10

const compareValues = (a: unknown, b: unknown): number => {
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b
  }
  return String(a).localeCompare(String(b))
}

/** 물품 목록 조회 (물품코드/물품명 검색, 정렬, 페이지네이션 지원) */
// [TEMP] 26.07.28 백엔드 미연동 — 시드 데이터를 in-memory로 필터/정렬/페이징해 반환. 연동 완료 시 아래 stub 제거
// export const getItems = (params: GetItemsParams): Promise<ApiResponse<ItemListResult>> =>
//   api.get<ItemListResult>(
//     `/items?page=${params.page ?? 0}&limit=${params.limit ?? DEFAULT_LIMIT}` +
//       `&keyword=${params.keyword ?? ''}&sortBy=${params.sortBy ?? ''}&sortOrder=${params.sortOrder ?? ''}`
//   )

// [TEMP] 26.07.28
export const getItems = (params: GetItemsParams): Promise<ApiResponse<ItemListResult>> => {
  const page = params.page ?? DEFAULT_PAGE
  const limit = params.limit ?? DEFAULT_LIMIT

  const sortBy = params.sortBy
  const sorted = sortBy
    ? [...seedItems].sort((a, b) => {
        const result = compareValues(a[sortBy as keyof Item], b[sortBy as keyof Item])
        return params.sortOrder === 'desc' ? -result : result
      })
    : seedItems

  const total = sorted.length
  const totalPages = Math.max(Math.ceil(total / limit), 1)
  const start = page * limit
  const data = sorted.slice(start, start + limit)

  return Promise.resolve({
    result: true,
    statusCode: 200,
    data: { data, total, page, limit, totalPages },
    message: [],
  })
}
