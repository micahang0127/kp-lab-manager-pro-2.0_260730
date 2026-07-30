# 테스트 인프라 가이드

## 개요

LAB-MANAGER-FRONT는 **Vitest** + **React Testing Library** + **MSW** 기반의 테스트 인프라를 갖추고 있습니다.

### 핵심 스택

| 역할            | 도구                        | 버전     |
| --------------- | --------------------------- | -------- |
| 테스트 러너     | Vitest                      | ^4.1.0   |
| 컴포넌트 테스트 | @testing-library/react      | ^16.3.2  |
| 사용자 이벤트   | @testing-library/user-event | ^14.6.1  |
| DOM 환경        | jsdom                       | ^29.0.0  |
| DOM 매처        | @testing-library/jest-dom   | ^6.9.1   |
| API 목킹        | MSW (Mock Service Worker)   | ^2.12.12 |

---

## 빠른 시작

### 테스트 실행

```bash
# 감시 모드로 테스트 실행
pnpm test

# 한 번 실행
pnpm test --run

# UI 대시보드와 함께 실행
pnpm test:ui

# 커버리지 리포트 생성
pnpm test:coverage
```

### 파일 구조 (초기 설정과 예시)

```
src/
├── test/
│   ├── setup.ts                          # Vitest 초기화 (jest-dom, MSW 설정)
│   └── mocks/
│       ├── handlers.ts                   # MSW API 핸들러 정의
│       └── server.ts                     # MSW 서버 인스턴스
├── utils/
│   ├── date.ts
│   └── date.test.ts                      # ✅ 테스트됨 (100% 커버리지)
├── stores/
│   ├── authStore.ts
│   └── authStore.test.ts                 # ✅ 테스트됨 (100% 커버리지)
├── api/
│   ├── index.ts
│   ├── index.test.ts                     # ✅ 테스트됨 (100% 커버리지)
│   ├── user.ts
│   └── user.test.ts                      # ✅ 테스트됨 (100% 커버리지)
├── components/layout/
│   ├── Header.tsx
│   └── Header.test.tsx                   # ✅ 테스트됨 (100% 커버리지)
└── pages/
    ├── LoginPage.tsx
    └── LoginPage.test.tsx                # ✅ 테스트됨 (94% 커버리지)
```

---

## 테스트 작성 예시

### 1. 순수 함수 테스트 (Utils)

```typescript
// src/utils/myFunction.test.ts
import { describe, it, expect } from 'vitest'
import { myFunction } from './myFunction'

describe('myFunction', () => {
  it('입력값이 올바르게 변환된다', () => {
    expect(myFunction('input')).toBe('expected output')
  })
})
```

### 2. Zustand Store 테스트

```typescript
// src/stores/myStore.test.ts
import { beforeEach, describe, it, expect } from 'vitest'
import { useMyStore } from './myStore'

describe('myStore', () => {
  beforeEach(() => {
    // 각 테스트 전 초기화
    useMyStore.setState({ count: 0 })
  })

  it('카운트 증가 함수가 동작한다', () => {
    useMyStore.getState().increment()
    expect(useMyStore.getState().count).toBe(1)
  })
})
```

### 3. API 클라이언트 테스트 (MSW 사용)

```typescript
// src/api/myApi.test.ts
import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../test/mocks/server'
import { myApiCall } from './myApi'

describe('myApiCall', () => {
  it('성공 응답을 처리한다', async () => {
    server.use(
      http.post('*/my-endpoint', () =>
        HttpResponse.json({
          statusCode: 200,
          data: { result: 'success' },
          error: [],
        })
      )
    )

    const result = await myApiCall()
    expect(result.statusCode).toBe(200)
  })

  it('실패 응답을 처리한다', async () => {
    server.use(
      http.post('*/my-endpoint', () =>
        HttpResponse.json(
          {
            statusCode: 400,
            data: {},
            error: ['Bad request'],
          },
          { status: 400 }
        )
      )
    )

    const result = await myApiCall()
    expect(result.statusCode).toBe(400)
  })
})
```

### 4. 컴포넌트 테스트 (React Testing Library)

```typescript
// src/components/MyComponent.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MyComponent } from './MyComponent'

describe('MyComponent', () => {
  it('버튼 클릭 시 텍스트가 변경된다', async () => {
    render(<MyComponent />)

    const button = screen.getByRole('button', { name: /클릭/i })
    await userEvent.click(button)

    expect(screen.getByText(/클릭됨/i)).toBeInTheDocument()
  })
})
```

---

## MSW 핸들러 추가하기

기본 핸들러는 `src/test/mocks/handlers.ts`에 정의되어 있습니다.

### 새로운 핸들러 추가

```typescript
// src/test/mocks/handlers.ts
import { http, HttpResponse } from 'msw'

export const handlers = [
  // 기존 핸들러...

  // 새로운 POST 핸들러 추가
  http.post('http://localhost:3000/api/users', () =>
    HttpResponse.json({
      statusCode: 201,
      data: { id: 1, name: 'New User' },
      error: [],
    })
  ),
]
```

### 테스트에서 핸들러 오버라이드

```typescript
import { server } from '../test/mocks/server'

describe('User API', () => {
  it('사용자 생성이 실패한다', async () => {
    // 기본 핸들러 대신 커스텀 핸들러 사용
    server.use(
      http.post('*/api/users', () =>
        HttpResponse.json(
          {
            statusCode: 400,
            data: {},
            error: ['Email already exists'],
          },
          { status: 400 }
        )
      )
    )

    const result = await createUser({ email: 'existing@test.com' })
    expect(result.statusCode).toBe(400)
  })
})
```

## 외부 의존성 목킹하기

### Router 목킹 (TanStack Router)

```typescript
import { vi } from 'vitest'

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}))
```

### Third-party SDK 목킹 (PortOne)

```typescript
import { vi } from 'vitest'

vi.mock('@portone/browser-sdk/v2', () => ({
  requestIdentityVerification: vi.fn().mockResolvedValue({
    identityVerificationId: 'test-id',
  }),
}))
```

---

## 일반적인 테스트 패턴

### localStorage 초기화

```typescript
beforeEach(() => {
  localStorage.clear()
})
```

### async/await 대기

```typescript
import { waitFor } from '@testing-library/react'

await waitFor(() => {
  expect(screen.getByText('Success')).toBeInTheDocument()
})
```

### API 요청 검증

```typescript
let receivedBody: unknown = null
server.use(
  http.post('*/my-endpoint', async ({ request }) => {
    receivedBody = await request.json()
    return HttpResponse.json({ statusCode: 200, data: null, error: [] })
  })
)

await myApiCall({ key: 'value' })
expect(receivedBody).toEqual({ key: 'value' })
```

---

## 문제 해결

### 테스트가 특정 환경 변수에 의존하는 경우

`vite.config.ts`의 `test` 섹션에 환경 변수를 정의할 수 있습니다:

```typescript
test: {
  env: {
    VITE_API_BASE_URL: 'http://localhost:3000',
  },
}
```

### dayjs 플러그인 관련 오류

`src/test/setup.ts`에서 필요한 플러그인을 로드하는지 확인하세요:

```typescript
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)
```

---

## 참고 자료

- [Vitest 문서](https://vitest.dev/)
- [React Testing Library 문서](https://testing-library.com/docs/react-testing-library/intro/)
- [MSW 문서](https://mswjs.io/)
- [Testing Library 쿼리 가이드](https://testing-library.com/docs/queries/about)

---

## 다음 단계

새로운 기능을 추가할 때마다 테스트 코드를 함께 작성하세요:

1. **컴포넌트**: `Header.test.tsx` 같은 패턴 따라하기
2. **API**: `user.test.ts` 같은 패턴으로 MSW 핸들러 추가
3. **Store**: `authStore.test.ts` 같은 패턴으로 상태 검증
4. **Utils**: `date.test.ts` 같은 패턴으로 순수 함수 검증

Happy testing! 🚀
