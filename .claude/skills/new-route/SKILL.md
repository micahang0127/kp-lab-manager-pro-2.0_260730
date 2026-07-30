---
name: new-route
description: 새 TanStack Router 라우트와 페이지 컴포넌트를 생성합니다
---

새 라우트와 그에 연결된 페이지 컴포넌트를 동시에 생성합니다.

## 입력

$ARGUMENTS — 라우트 경로 (예: `/labs`, `/labs/list`, `/users/profile`)

## 절차

1. **인증 보호 여부 확인**
   사용자에게 묻지 않고도 명확하면 진행, 모호하면 AskUserQuestion으로 확인:
   - 인증 필요 (대부분의 페이지)
   - 공개 페이지 (로그인, 회원가입 등)

2. **페이지 컴포넌트 이름 도출**
   경로에서 PascalCase 페이지명 생성:
   - `/labs` → `LabsPage`
   - `/labs/list` → `LabsListPage`
   - `/users/profile` → `UsersProfilePage`

3. **두 파일 생성** (Write 도구)

### 파일 1: `src/pages/{PageName}Page.tsx`

```typescript
// ─── Component ─────────────────────────────────────────────────────────────

export function {PageName}Page() {
  return (
    <section>
      <h1 className="text-2xl font-bold text-gray-900">{한국어 페이지 제목}</h1>
    </section>
  )
}
```

### 파일 2: `src/routes/{경로}.tsx`

**인증 보호 라우트**:

```typescript
import { createFileRoute } from '@tanstack/react-router'

import { {PageName}Page } from '../pages/{PageName}Page'
import { requireAuth } from '../utils/requireAuth'

export const Route = createFileRoute('{경로}')({
  beforeLoad: requireAuth,
  component: {PageName}Page,
})
```

**공개 라우트** (이미 로그인된 경우 /main 리다이렉트):

```typescript
import { createFileRoute, redirect } from '@tanstack/react-router'

import { {PageName}Page } from '../pages/{PageName}Page'

export const Route = createFileRoute('{경로}')({
  beforeLoad: () => {
    if (sessionStorage.getItem('accessToken')) {
      return redirect({ to: '/main' })
    }
  },
  component: {PageName}Page,
})
```

4. **테스트 파일 생성** `src/pages/{PageName}Page.test.tsx`

```typescript
import { describe, expect, it } from 'vitest'

import { render, screen } from '../test/test-utils'

import { {PageName}Page } from './{PageName}Page'

describe('{PageName}Page', () => {
  it('페이지 제목을 렌더링한다', () => {
    render(<{PageName}Page />)
    expect(screen.getByRole('heading', { name: /{한국어 제목}/ })).toBeInTheDocument()
  })
})
```

5. **사용자 안내**

   ```
   ✅ 생성 완료:
   - src/routes/{경로}.tsx
   - src/pages/{PageName}Page.tsx
   - src/pages/{PageName}Page.test.tsx

   다음 단계: pnpm dev 실행 시 routeTree.gen.ts가 자동 갱신됩니다.
   ```

## 주의

- `routeTree.gen.ts`는 직접 수정 금지 (자동 생성)
- 페이지 로직은 라우트 파일이 아닌 페이지 컴포넌트에 작성
- 한국어 UI 텍스트 사용
