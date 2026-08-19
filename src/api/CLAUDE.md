# src/api — API 레이어 규칙

## 파일 구조

- `index.ts` — 기본 `api` 클라이언트, `ApiResponse<T>`, `ApiError`, `RequestOptions` (수정 시 팀 합의 필요)
- `{도메인}.ts` — 도메인별 API 함수 (예: `user.ts`, `auth.ts`)
- `{도메인}.test.ts` — MSW 기반 단위 테스트

## 새 API 함수 작성 패턴

```typescript
import type { ApiResponse } from '.'
import { api } from '.'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateLabRequest {
  name: string
  description: string
}

export interface Lab {
  id: number
  name: string
  description: string
  createdAt: string
}

// ─── API ─────────────────────────────────────────────────────────────────────

/** 실험실 목록 조회 */
export const getLabs = (): Promise<ApiResponse<Lab[]>> => api.get<Lab[]>('/labs')

/** 실험실 생성 */
export const createLab = (body: CreateLabRequest): Promise<ApiResponse<Lab>> =>
  api.post<Lab>('/labs', body)
```

## 응답 구조

백엔드 공통 응답 포맷(`CommonResponsePayload<T>`)과 동일한 구조를 그대로 사용한다.

```typescript
interface ApiResponse<T> {
  result: boolean // 요청 성공 여부 — 성공/실패 판단의 단일 기준
  data: T | null // 성공 시 응답 데이터, 실패 시 null
  message: string[] // 에러 메시지 목록. 성공 시 빈 배열
  statusCode: number // HTTP 상태 코드
}
```

- 성공: `response.data`에서 추출 — **`data`는 `T | null` 타입이므로 접근 시 옵셔널 체이닝(`?.`) 또는 널 가드 필수**
- 실패: `ApiError` throw됨 — `.statusCode`, `.message`로 접근 (`request()` 내부에서 `result`가 `false`면 자동으로 throw하므로, `res.result`가 `true`인 응답만 컴포넌트에 도달함)
- **401 자동 처리**: 만료 감지 시 자동 로그아웃 + `/login` 리다이렉트. 컴포넌트에서 별도 처리 금지

## 옵션

```typescript
interface RequestOptions {
  extraHeaders?: Record<string, string> // 예: KPMFP 핑거프린트
  skipAuth?: boolean // Authorization 헤더 생략
}
```

- 로그인 API 등 인증 전 호출: `api.post(endpoint, body, { skipAuth: true })`
- 커스텀 헤더: `api.post(endpoint, body, { extraHeaders: { KPMFP: 'xxx' } })`

## 임시 코드 ([TEMP]) 패턴

백엔드 미연동 API는 반드시 아래 형식으로 표시 — 연동 완료 시 제거 용이:

```typescript
// ─── API ─────────────────────────────────────────────────────────────────────

/** 실험실 생성 */
// [TEMP] 26.04.15 백엔드 미연동 — mock 데이터 반환. 연동 완료 시 아래 stub 제거
// export const createLab = (body: CreateLabRequest): Promise<ApiResponse<Lab>> =>
//   api.post<Lab>('/labs', body)

// [TEMP] 26.04.15
const createLabTemp: Lab = {
  id: 1,
  name: '임시 실험실',
  description: '',
  createdAt: '2026-04-15T00:00:00.000Z',
}

export const createLab = (_body: CreateLabRequest): Promise<ApiResponse<Lab>> =>
  Promise.resolve({ result: true, statusCode: 200, data: createLabTemp, message: [] })
```

실제 예시: `src/api/auth.ts`의 `confirmIdentityVerification` 참고.

## 테스트 패턴

```typescript
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import { server } from '../test/mocks/server'

import { getLabs } from './lab'

describe('lab API', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('실험실 목록을 정상적으로 조회한다', async () => {
    server.use(
      http.get('*/labs', () =>
        HttpResponse.json({
          result: true,
          statusCode: 200,
          data: [{ id: 1, name: '테스트 실험실' }],
          message: [],
        })
      )
    )

    const res = await getLabs()
    expect(res.data).toHaveLength(1)
  })

  it('서버 에러 시 ApiError를 던진다', async () => {
    server.use(
      http.get('*/labs', () =>
        HttpResponse.json(
          { result: false, statusCode: 500, data: null, message: ['서버 오류'] },
          { status: 500 }
        )
      )
    )

    await expect(getLabs()).rejects.toThrow('서버 오류')
  })
})
```

## 체크리스트 (새 API 추가 시)

- [ ] Types 섹션 / API 섹션 구분
- [ ] JSDoc 한국어 설명
- [ ] `api.*` 래퍼 사용 (직접 `fetch` 금지)
- [ ] 테스트 파일 작성 (성공 + 에러 케이스)
- [ ] 백엔드 미연동이면 `[TEMP]` 마킹
- [ ] `pnpm type-check` 통과
