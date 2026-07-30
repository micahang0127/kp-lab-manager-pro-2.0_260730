// [TEMP] 26.07.28 getIncomingItems는 백엔드 미연동 stub으로 항상 성공만 반환하므로 에러 케이스 테스트는 없음.
// 실제 백엔드 연동 후에는 MSW 기반 성공/에러 케이스 테스트로 교체할 것 (src/api/CLAUDE.md 참고)
import { describe, expect, it } from 'vitest'

import { getIncomingItems } from './itemIncoming'

describe('itemIncoming API', () => {
  it('기본 조회 시 전체 6건을 원래 순서대로 반환한다', async () => {
    const res = await getIncomingItems({})

    expect(res.statusCode).toBe(200)
    expect(res.data.data).toHaveLength(6)
    expect(res.data.total).toBe(6)
    expect(res.data.totalPages).toBe(1)
    expect(res.data.data.map((item) => item.id)).toEqual([1, 2, 3, 4, 5, 6])
  })

  it('sortBy/sortOrder로 오름차순 정렬된 결과를 반환한다', async () => {
    const res = await getIncomingItems({ sortBy: 'quantity', sortOrder: 'asc' })

    const quantities = res.data.data.map((item) => item.quantity)
    expect(quantities).toEqual([...quantities].sort((a, b) => a - b))
  })

  it('sortBy/sortOrder로 내림차순 정렬된 결과를 반환한다', async () => {
    const res = await getIncomingItems({ sortBy: 'quantity', sortOrder: 'desc' })

    const quantities = res.data.data.map((item) => item.quantity)
    expect(quantities).toEqual([...quantities].sort((a, b) => b - a))
  })
})
