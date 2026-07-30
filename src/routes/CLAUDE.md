# src/routes — TanStack Router 파일 기반 라우팅

## ⚠️ 핵심 규칙

1. **파일 = URL** — 이 디렉토리의 파일명이 곧 URL 경로
2. **`routeTree.gen.ts`는 자동 생성** — Vite 플러그인이 `pnpm dev`/`pnpm build` 시 자동 갱신. **절대 직접 수정 금지**
3. **페이지 컴포넌트는 `src/pages/`에 별도 작성** — 라우트 파일은 연결만 담당

## 파일명 → URL 매핑

| 파일                | URL                         |
| ------------------- | --------------------------- |
| `index.tsx`         | `/`                         |
| `login.tsx`         | `/login`                    |
| `main.tsx`          | `/main`                     |
| `zustand/index.tsx` | `/zustand`                  |
| `__root.tsx`        | 전체 라우트의 루트 레이아웃 |

## 인증 보호 라우트 템플릿

```typescript
import { createFileRoute } from '@tanstack/react-router'

import { LabListPage } from '../pages/LabListPage'
import { requireAuth } from '../utils/requireAuth'

export const Route = createFileRoute('/labs')({
  beforeLoad: requireAuth,
  component: LabListPage,
})
```

- `requireAuth`: JWT 토큰 형식 + 만료 검증 → 유효하지 않으면 `/login`으로 redirect
- 실제 예시: `src/routes/main.tsx`

## 공개 라우트 템플릿 (로그인 페이지)

```typescript
import { createFileRoute, redirect } from '@tanstack/react-router'

import { LoginPage } from '../pages/LoginPage'

export const Route = createFileRoute('/login')({
  beforeLoad: () => {
    if (sessionStorage.getItem('accessToken')) {
      return redirect({ to: '/main' })
    }
  },
  component: LoginPage,
})
```

- 이미 로그인된 사용자가 `/login` 접근 시 `/main`으로 리다이렉트
- 실제 예시: `src/routes/login.tsx`

## 새 라우트 추가 체크리스트

- [ ] 페이지 컴포넌트를 `src/pages/{PageName}Page.tsx`에 먼저 작성
- [ ] `src/routes/{경로}.tsx` 생성 (위 템플릿 복사)
- [ ] 인증 필요 여부 결정 → `requireAuth` 또는 공개 라우트 패턴 적용
- [ ] `pnpm dev` 실행 — `routeTree.gen.ts`가 자동 갱신되는지 확인
- [ ] 테스트 작성 (`src/pages/{PageName}Page.test.tsx`)

## 중첩 라우트 / 레이아웃

- 전역 레이아웃: `__root.tsx`
- 페이지별 레이아웃: 페이지 컴포넌트 내부에서 `src/components/layout/Layout` 사용
- 중첩 경로: `routes/parent/child.tsx` 형태로 디렉토리 생성

## 절대 하지 말 것

- ❌ `routeTree.gen.ts` 직접 편집
- ❌ 라우트 파일에 페이지 로직 직접 작성 (페이지 컴포넌트로 분리)
- ❌ `react-router-dom` 사용 (이 프로젝트는 TanStack Router)
