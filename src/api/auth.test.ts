import { beforeEach, describe, expect, it } from 'vitest'

import { checkExistingAccount, deleteExistingAccount } from './auth'

// checkExistingAccount/deleteExistingAccount는 [TEMP] 스텁이라 실제 HTTP 호출 없이
// 항상 고정된 값을 반환한다. 백엔드 연동 완료 시 이 테스트도 MSW 기반으로 교체해야 한다.

describe('checkExistingAccount API', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('[TEMP] 항상 기존 계정이 존재하지 않는다(exists: false)고 응답한다', async () => {
    const result = await checkExistingAccount({ ci: 'mock-ci' })
    expect(result.statusCode).toBe(200)
    expect(result.data?.exists).toBe(false)
  })
})

describe('deleteExistingAccount API', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('[TEMP] 항상 성공(true) 응답한다', async () => {
    const result = await deleteExistingAccount({ ci: 'mock-ci' })
    expect(result.statusCode).toBe(200)
    expect(result.data).toBe(true)
  })
})
