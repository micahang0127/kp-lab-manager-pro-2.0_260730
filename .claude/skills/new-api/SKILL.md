---
name: new-api
description: 새 API 도메인 파일과 MSW 테스트 파일을 생성합니다
---

새 API 도메인의 함수 파일과 테스트 파일을 동시에 생성합니다.

## 입력

$ARGUMENTS — 도메인명 (예: `lab`, `sample`, `experiment`)

## 절차

1. **두 파일 생성**

### 파일 1: `src/api/{도메인}.ts`

```typescript
import type { ApiResponse } from '.'
import { api } from '.'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface {Domain} {
  id: number
  name: string
  // 필드 추가
}

// ─── API ─────────────────────────────────────────────────────────────────────

/** {도메인} 목록 조회 */
export const get{Domain}List = (): Promise<ApiResponse<{Domain}[]>> =>
  api.get<{Domain}[]>('/{도메인}')

/** {도메인} 단건 조회 */
export const get{Domain} = (id: number): Promise<ApiResponse<{Domain}>> =>
  api.get<{Domain}>(`/{도메인}/${id}`)
```

> **백엔드 미연동인 경우** `src/api/CLAUDE.md`의 `[TEMP]` 패턴 적용

### 파일 2: `src/api/{도메인}.test.ts`

```typescript
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import { server } from '../test/mocks/server'

import { get{Domain}List } from './{도메인}'

describe('{도메인} API', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('{도메인} 목록을 정상적으로 조회한다', async () => {
    server.use(
      http.get('*/{도메인}', () =>
        HttpResponse.json({
          statusCode: 200,
          data: [{ id: 1, name: '테스트' }],
          error: [],
        })
      )
    )

    const res = await get{Domain}List()
    expect(res.data).toHaveLength(1)
    expect(res.data[0].name).toBe('테스트')
  })

  it('서버 에러 시 ApiError를 던진다', async () => {
    server.use(
      http.get('*/{도메인}', () =>
        HttpResponse.json(
          { statusCode: 500, data: null, error: ['서버 오류'] },
          { status: 500 }
        )
      )
    )

    await expect(get{Domain}List()).rejects.toThrow('서버 오류')
  })
})
```

2. **사용자 안내**

   ```
   ✅ 생성 완료:
   - src/api/{도메인}.ts
   - src/api/{도메인}.test.ts

   다음 단계:
   - 실제 백엔드 명세에 맞게 Types 수정
   - 추가 함수 작성 (create, update, delete 등)
   - pnpm test --run src/api/{도메인}.test.ts 로 테스트 확인
   ```

## 체크리스트

- [ ] Types / API 섹션 구분
- [ ] 한국어 JSDoc
- [ ] `api.*` 래퍼 사용 (직접 fetch 금지)
- [ ] 성공 + 에러 케이스 테스트
- [ ] `beforeEach(() => sessionStorage.clear())`
