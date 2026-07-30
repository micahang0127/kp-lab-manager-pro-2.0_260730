// [TEMP] 26.07.28 getItems는 백엔드 미연동 stub으로 항상 성공만 반환하므로 에러 케이스 테스트는 없음.
// 실제 백엔드 연동 후에는 MSW 기반 성공/에러 케이스 테스트로 교체할 것 (src/api/CLAUDE.md 참고)
import { describe, expect, it } from 'vitest'

import { getItems } from './item'

describe('item API', () => {
  it('기본 조회 시 첫 페이지(10건)와 전체 통계를 반환한다', async () => {
    const res = await getItems({})

    expect(res.statusCode).toBe(200)
    expect(res.data.data).toHaveLength(10)
    expect(res.data.total).toBe(20)
    expect(res.data.totalPages).toBe(2)
    expect(res.data.data.map((item) => item.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  })

  it('page로 다음 페이지 데이터를 슬라이싱한다', async () => {
    const res = await getItems({ page: 1, limit: 10 })

    expect(res.data.data).toHaveLength(10)
    expect(res.data.data.map((item) => item.id)).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20])
  })

  it('범위를 넘는 page를 요청하면 빈 배열을 반환하지만 statusCode는 200이다', async () => {
    const res = await getItems({ page: 5, limit: 10 })

    expect(res.statusCode).toBe(200)
    expect(res.data.data).toEqual([])
    expect(res.data.total).toBe(20)
  })

  it('sortBy/sortOrder로 오름차순 정렬된 결과를 반환한다', async () => {
    const res = await getItems({ limit: 20, sortBy: 'quantity', sortOrder: 'asc' })

    const quantities = res.data.data.map((item) => item.quantity)
    const sortedAscending = [...quantities].sort((a, b) => a - b)
    expect(quantities).toEqual(sortedAscending)
  })

  it('sortBy/sortOrder로 내림차순 정렬된 결과를 반환한다', async () => {
    const res = await getItems({ limit: 20, sortBy: 'quantity', sortOrder: 'desc' })

    const quantities = res.data.data.map((item) => item.quantity)
    const sortedDescending = [...quantities].sort((a, b) => b - a)
    expect(quantities).toEqual(sortedDescending)
  })
})
