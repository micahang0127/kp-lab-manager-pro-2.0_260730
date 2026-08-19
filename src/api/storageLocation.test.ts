// [TEMP] 26.08.18 아래 함수들은 백엔드 미연동 stub으로 항상 성공만 반환하므로 에러 케이스 테스트는 없음.
// 실제 백엔드 연동 후에는 MSW 기반 성공/에러 케이스 테스트로 교체할 것 (src/api/CLAUDE.md 참고)
import { describe, expect, it } from 'vitest'

import {
  createStorageLocation,
  deleteStorageLocation,
  getStorageLocations,
  renameStorageLocation,
  updateStorageLocationOrder,
} from './storageLocation'

describe('storageLocation API', () => {
  it('보관위치 트리(최상위 2개, 하위 계층 포함)를 조회한다', async () => {
    const res = await getStorageLocations()
    const data = res.data!

    expect(res.statusCode).toBe(200)
    expect(data).toHaveLength(2)
    expect(data[0].name).toBe('본관')
    expect(data[0].children?.[0].children?.[0].name).toBe('시약보관실 A')
  })

  it('조회할 때마다 독립된 트리를 반환한다 (호출 측 변경이 다음 조회에 영향을 주지 않음)', async () => {
    const first = await getStorageLocations()
    first.data![0].name = '변경된 이름'

    const second = await getStorageLocations()
    expect(second.data![0].name).toBe('본관')
  })

  it('보관위치를 생성하면 성공 응답을 반환한다', async () => {
    const res = await createStorageLocation({ parentId: 'loc-1', name: '새 위치' })
    expect(res.statusCode).toBe(200)
    expect(res.data).toBe(true)
  })

  it('보관위치 이름을 변경하면 성공 응답을 반환한다', async () => {
    const res = await renameStorageLocation({ id: 'loc-1', name: '변경된 이름' })
    expect(res.statusCode).toBe(200)
    expect(res.data).toBe(true)
  })

  it('보관위치를 삭제하면 성공 응답을 반환한다', async () => {
    const res = await deleteStorageLocation('loc-1')
    expect(res.statusCode).toBe(200)
    expect(res.data).toBe(true)
  })

  it('보관위치 순서를 변경하면 성공 응답을 반환한다', async () => {
    const res = await updateStorageLocationOrder({ id: 'loc-1-1', parentId: 'loc-2', index: 0 })
    expect(res.statusCode).toBe(200)
    expect(res.data).toBe(true)
  })
})
