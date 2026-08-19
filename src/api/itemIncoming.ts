import type { ApiResponse, PagedData } from '.'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface IncomingItem {
  id: number
  quantity: number
  location: string
  purchaseRoute: string
  itemName: string
  category: string
  brand: string | null
  productNumber: string | null
  packageQuantity: string | null
  shippingInfo: string | null
}

export interface GetIncomingItemsParams {
  /** 0-based 페이지 인덱스 */
  page?: number
  limit?: number
  /** 정보(itemName)/카테고리/구매처 부분 일치 검색어 */
  keyword?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface IncomingItemListResult extends PagedData {
  data: IncomingItem[]
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

// [TEMP] 26.07.28
const seedIncomingItems: IncomingItem[] = [
  {
    id: 1,
    quantity: 5,
    location: '테스트 보관함',
    purchaseRoute: '수기 등록',
    itemName: 'y7',
    category: '보호구',
    brand: null,
    productNumber: null,
    packageQuantity: null,
    shippingInfo: null,
  },
  {
    id: 2,
    quantity: 4,
    location: '테스트 보관함',
    purchaseRoute: '수기 등록',
    itemName: 'q1',
    category: '보호구',
    brand: null,
    productNumber: null,
    packageQuantity: null,
    shippingInfo: null,
  },
  {
    id: 3,
    quantity: 2,
    location: '테스트 보관함',
    purchaseRoute: '수기 등록',
    itemName: 't1',
    category: '분석용칼럼',
    brand: null,
    productNumber: null,
    packageQuantity: null,
    shippingInfo: null,
  },
  {
    id: 4,
    quantity: 2,
    location: '테스트 보관함',
    purchaseRoute: '수기 등록',
    itemName: 'ㄱ',
    category: '시약',
    brand: null,
    productNumber: null,
    packageQuantity: '50g',
    shippingInfo: null,
  },
  {
    id: 5,
    quantity: 1,
    location: '테스트 보관함',
    purchaseRoute: '수기 등록',
    itemName: '테스트시약',
    category: '제조시약',
    brand: null,
    productNumber: null,
    packageQuantity: '1g',
    shippingInfo: null,
  },
  {
    id: 6,
    quantity: 1,
    location: '테스트 보관함',
    purchaseRoute: '수기 등록',
    itemName: 'test',
    category: '시약',
    brand: null,
    productNumber: null,
    packageQuantity: '1g',
    shippingInfo: null,
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

/** 입고등록대기 목록 조회 (정보/카테고리/구매처 검색, 정렬, 페이지네이션 지원) */
// [TEMP] 26.07.28 백엔드 미연동 — 시드 데이터를 in-memory로 필터/정렬/페이징해 반환. 연동 완료 시 아래 stub 제거
// export const getIncomingItems = (
//   params: GetIncomingItemsParams
// ): Promise<ApiResponse<IncomingItemListResult>> =>
//   api.get<IncomingItemListResult>(
//     `/items/incoming?page=${params.page ?? 0}&limit=${params.limit ?? DEFAULT_LIMIT}` +
//       `&keyword=${params.keyword ?? ''}&sortBy=${params.sortBy ?? ''}&sortOrder=${params.sortOrder ?? ''}`
//   )

// [TEMP] 26.07.28
export const getIncomingItems = (
  params: GetIncomingItemsParams
): Promise<ApiResponse<IncomingItemListResult>> => {
  const page = params.page ?? DEFAULT_PAGE
  const limit = params.limit ?? DEFAULT_LIMIT

  const sortBy = params.sortBy
  const sorted = sortBy
    ? [...seedIncomingItems].sort((a, b) => {
        const result = compareValues(
          a[sortBy as keyof IncomingItem],
          b[sortBy as keyof IncomingItem]
        )
        return params.sortOrder === 'desc' ? -result : result
      })
    : seedIncomingItems

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
