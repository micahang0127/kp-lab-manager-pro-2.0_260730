# src/routes — TanStack Router 파일 기반 라우팅

## ⚠️ 핵심 규칙

1. **파일 = URL** — 이 디렉토리의 파일명이 곧 URL 경로
2. **`routeTree.gen.ts`는 자동 생성** — Vite 플러그인이 `pnpm dev`/`pnpm build` 시 자동 갱신. **절대 직접 수정 금지**
3. **페이지 컴포넌트는 `src/pages/`에 별도 작성** — 라우트 파일은 연결만 담당

## 파일명 → URL 매핑

| 파일         | URL                         |
| ------------ | --------------------------- |
| `index.tsx`  | `/`                         |
| `login.tsx`  | `/login`                    |
| `main.tsx`   | `/main`                     |
| `__root.tsx` | 전체 라우트의 루트 레이아웃 |

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
import { createFileRoute } from '@tanstack/react-router'

import { LoginPage } from '../pages/LoginPage'
import { redirectIfAuthenticated } from '../utils/requireAuth'

export const Route = createFileRoute('/login')({
  beforeLoad: redirectIfAuthenticated,
  component: LoginPage,
})
```

- `redirectIfAuthenticated`: 이미 로그인된 사용자(`requireAuth`와 동일하게 형식+만료까지 검증)가
  `/login` 접근 시 `/main`으로 리다이렉트
- **`sessionStorage.getItem('accessToken')` 존재 여부만으로 직접 판단하지 말 것** — 형식이
  깨졌거나 만료된 토큰이 남아있는 상태에서 `/main`으로 보내면, `requireAuth`가 다시 `/login`으로
  돌려보내는 불필요한 리다이렉트 왕복이 발생한다. 반드시 `redirectIfAuthenticated`를 사용해
  `requireAuth`와 판단 기준을 통일할 것
- 추가 가드 로직이 필요하면(회원가입 단계별 순서 검증 등) `beforeLoad`를 함수로 작성하고 맨 앞에서
  `redirectIfAuthenticated()`를 호출해 반환값이 있으면 그대로 반환한다:
  ```typescript
  beforeLoad: () => {
    const authRedirect = redirectIfAuthenticated()
    if (authRedirect) return authRedirect
    // ...추가 가드
  }
  ```
- 실제 예시: `src/routes/login.tsx`, `src/routes/register-organization.tsx`(추가 가드 포함)

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
