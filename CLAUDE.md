# KP Lab-Manager Frontend — Claude 협업 가이드

> 이 파일은 **모든 Claude 세션에 자동 로드**되는 프로젝트 컨벤션의 최상위 단일 원천입니다.
> 팀원 4명이 GitHub PR로만 소통하므로, 여기 명시된 규칙이 일관성의 유일한 원천입니다.

---

## 🏁 프로젝트 핵심 정보

- **팀 구성**: 팀 형태로 개발 진행 할 프로젝트, GitHub PR 기반 커뮤니케이션 (직접 대화 없음)
- **개발 방식**: 모든 팀원이 AI 보조(Claude Code) 중심으로 개발
- **패키지 매니저**: **pnpm 전용** — `npm`, `yarn`, `npx` 절대 금지 (preinstall 훅으로 차단됨)
- **Node**: 22.x
- **언어**: 한국어 (UI 텍스트 · 주석 · 커밋 메시지 · PR 설명 모두 한국어)

---

## 🤖 AI 개발 워크플로우 (필수 준수)

### 신규 기능 · 중간 이상 변경

```
1. /plan-feature  <기능 설명>   → Opus 서브에이전트가 상세 계획 수립
2. /verify-plan                  → Sonnet 서브에이전트가 계획 재검증 (환각·결함 체크)
3. "계획대로 구현해줘" (일반 대화)  → Sonnet 메인 세션이 검증된 계획대로 구현
4. /verify-impl                  → type-check + test + self-review로 구현 검증
5. commit/push 후 GitHub에서 사람이 직접 PR 생성
```

### 버그 수정 · 소규모 변경 (단일 파일 수준)

```
1. Sonnet 메인 세션이 직접 구현
2. /verify-impl  로 검증
```

### commit/push/PR 전 사전 검증 (개발자 직접 실행)

```
/pre-check-test
  → ① pnpm ci:check (포맷·타입·린트·테스트·빌드)
  → ② pnpm audit --audit-level=high (보안 감사)
  → 항목별 ✅/❌ 결과 출력
  → 에러 발견 시 개발자 승인 후 자동 수정 (포맷·린트만 자동, 타입·테스트·빌드·보안은 직접 수정)
  → 수정 후 동일 검사 재실행으로 최종 확인
```

에러 발견 → 내용 확인 후 수정 → `/pre-check-test` 재실행 → 통과 시 commit/push/PR 진행

### 왜 이렇게 하나요?

- **Opus = 계획**: 설계 판단과 환각 방지는 비용을 들여서라도 고품질로
- **Sonnet = 구현**: 명확한 계획이 있으면 Sonnet으로도 충분, 비용 효율적
- **재검증 단계**: AI 단독 계획은 환각 가능성 상시 존재 → 반드시 한 번 더 검증
- **verify-impl**: 구현 자체가 실제로 동작하는지 type-check + test로 확인

---

## 🚫 환각 방지 규칙 (HARD RULE)

이 프로젝트는 AI가 여러 세션에서 동시 작업하므로, 환각으로 인한 오염을 최소화해야 합니다.

1. **파일을 읽지 않고 편집하지 말 것** — 추측으로 코드 수정 금지
2. **import 하기 전 존재 여부 확인** — Grep으로 실제 export되는 심볼인지 검증
3. **외부 라이브러리 API는 공식 문서 근거로만 사용** — 기억으로 메서드명을 만들지 않기
4. **환경변수는 `.env.example` 기준** — 존재하지 않는 변수 참조 금지
5. **테스트 assertion은 실제 반환값/DOM 기준** — "아마 이럴 것" 금지, 실제 확인 후 작성
6. **기존 유틸/컴포넌트 재사용 우선** — 신규 생성 전 `src/utils`, `src/components`를 먼저 Grep

---

## 📜 필수 명령어

| 목적          | 명령어            |
| ------------- | ----------------- |
| 개발 서버     | `pnpm dev`        |
| 타입 체크     | `pnpm type-check` |
| 린트 자동수정 | `pnpm lint:fix`   |
| 포맷팅        | `pnpm format`     |
| 테스트        | `pnpm test`       |
| 테스트 (단발) | `pnpm test --run` |
| 빌드          | `pnpm build`      |
| 전체 CI 검증  | `pnpm ci:check`   |

---

## 🏗 아키텍처 규칙

### 라우팅 (TanStack Router — 파일 기반)

- 새 라우트는 `src/routes/{경로}.tsx` 파일 생성 (파일이 곧 URL)
- 라우트 파일 구조: `createFileRoute('/경로')({ beforeLoad?, component })`
- 인증 보호 라우트: `beforeLoad: requireAuth` (from `../utils/requireAuth`)
- 공개 라우트 중 로그인된 사용자 차단: `sessionStorage.getItem('accessToken')` 체크 후 `redirect({ to: '/main' })`
- **`src/routeTree.gen.ts`는 Vite 플러그인 자동 생성 — 직접 수정 절대 금지**
- 페이지 컴포넌트는 `src/pages/`에 별도 작성 후 라우트 파일에서 import

### 상태 관리 분리 (엄격)

| 종류                       | 도구                    | 위치                                     |
| -------------------------- | ----------------------- | ---------------------------------------- |
| 서버 상태 (API 응답, 캐싱) | `@tanstack/react-query` | 컴포넌트 내부 `useQuery` / `useMutation` |
| 클라이언트 전역 상태       | `zustand`               | `src/stores/{name}Store.ts`              |
| 로컬 UI 상태               | `useState`              | 컴포넌트 내부                            |

**React Query가 캐싱하는 서버 상태를 목적 없이 Zustand에 복제 저장하지 말 것** — 캐싱·재검증은 React Query가 담당한다.
단, 멀티스텝 플로우(회원가입·로그인 등)에서 이전 단계 API 응답을 다음 단계 화면까지 전달해야 하는 **일회성
전달값**은 예외로 Zustand에 둘 수 있다(예: `registerFlowStore`의 `identityVerifyResult`,
`businessRegistrationReview`). 이 경우도 새로고침 시 초기화되도록 두어(persist 금지) 오래된 사본이 남지
않게 한다.

### API 클라이언트 (`src/api/index.ts`)

- 모든 HTTP 호출은 `api.get / post / patch / delete` 래퍼를 통해서만 수행
- 응답 타입: `ApiResponse<T>` = `{ result, data: T | null, message: string[], statusCode }` (백엔드 `CommonResponsePayload<T>`와 동일 구조) — `data` 접근 시 옵셔널 체이닝(`?.`) 필수
- 토큰: `sessionStorage.getItem('accessToken')` 자동 주입
- 인증 헤더 생략: `{ skipAuth: true }` 옵션
- 커스텀 헤더 필요 시: `{ extraHeaders: {...} }`
- 401 처리: 만료 감지 시 자동 로그아웃 + `/login` 리다이렉트 (컴포넌트에서 별도 처리 불필요)
- 에러: `ApiError` 인스턴스가 throw됨 (`.statusCode`, `.message`)

### Zustand 스토어 (`src/stores/`)

- 파일명: `{name}Store.ts` (camelCase)
- export: `use{Name}Store` hook 형태
- sessionStorage 접근은 스토어 내부에서 처리 (컴포넌트에서 직접 접근 금지)

---

## ✍️ 코드 컨벤션

### TypeScript

- **`any` 절대 금지** (`@typescript-eslint/no-explicit-any: error`)
  - 타입 불명확 시 `unknown` 사용 후 타입 가드
- **Promise는 반드시 처리** — `await` 또는 `void` 키워드
- **`@ts-ignore` / `@ts-expect-error` 사용 시 팀 합의 필수** (PR 설명에 이유 명시)
- **타입 전용 import**: `import type { ... }` 권장

### Import 순서

ESLint `simple-import-sort` 플러그인이 자동 정렬합니다. 수동 조정 불필요.

1. 외부 라이브러리
2. 내부 모듈 (상대 경로)

### 파일명 규칙

| 대상            | 규칙                       | 예시                          |
| --------------- | -------------------------- | ----------------------------- |
| 컴포넌트/페이지 | PascalCase                 | `LoginPage.tsx`, `Header.tsx` |
| 스토어          | camelCase + `Store` 접미사 | `authStore.ts`                |
| 유틸/훅         | camelCase                  | `requireAuth.ts`              |
| 테스트          | `{원본}.test.{ts,tsx}`     | `authStore.test.ts`           |

### 주석 스타일

- **섹션 구분자** (파일 내부 구역 표시):
  ```typescript
  // ─── Types ────────────────────────────────────────────────────────────────────
  // ─── API ─────────────────────────────────────────────────────────────────────
  ```
- **임시 코드 마킹** (백엔드 미연동 등):
  ```typescript
  // [TEMP] 26.03.17 백엔드 미연동 — 항상 성공 처리. 연동 완료 시 실제 API 호출로 교체
  ```
- **JSDoc**: 공개 API 함수, 유틸 함수에 한국어로 작성
- 불필요한 "이 코드는 무엇을 하는가" 주석 지양 → 코드 자체가 설명하도록

### UI 텍스트 · 접근성

- 모든 UI 텍스트: 한국어
- `aria-label`: 한국어로 작성
- Tailwind CSS 클래스 사용

### 반응형 브레이크포인트 (`tailwind.config.js`)

Tailwind 기본 브레이크포인트(`sm`/`md`/`lg`/`xl`/`2xl`)는 **전부 제거**되어 있으며, 프로젝트 전용 3단계로 교체되어 있습니다. 기본 prefix는 존재하지 않으므로 사용 시 빌드 에러가 발생합니다.

| 구분   | prefix    | 범위                 |
| ------ | --------- | -------------------- |
| 모바일 | `mobile:` | 최소 360px ~ 767px   |
| 태블릿 | `tablet:` | 768px ~ 1023px       |
| 웹     | `web:`    | 1024px ~ (최대 없음) |

- **`sm:` / `md:` / `lg:` / `xl:` / `2xl:` 사용 금지** — 존재하지 않는 prefix (제거됨)
- 반응형에 따라 값이 달라지는 속성은 항상 `mobile:` / `tablet:` / `web:` 를 명시할 것. prefix 없는 클래스는 "모든 화면 공통" 값에만 사용 (리뷰어가 의도를 바로 파악할 수 있도록)
  ```tsx
  // 모바일 기준값 + 태블릿/웹에서 재정의
  <div className="mobile:flex-col tablet:flex-row web:gap-8" />
  ```
- 360px 미만 화면은 별도 `min-width` 강제 없이 자연 축소되도록 둠 (지원 최소 기준일 뿐, 하드 제약 아님)
- Tailwind는 mobile-first(min-width) 방식이라 각 prefix는 "그 값 이상"에 적용되며, 다음 단계 prefix가 실제 상한(예: `tablet:`은 `web:`이 시작되는 1024px 전까지)을 형성함

---

## 🧪 테스트 규칙

- 테스트 파일은 대상 파일과 **같은 디렉토리**에 `{name}.test.{ts,tsx}`로 배치
- RTL 사용 시 `src/test/test-utils.tsx`의 **커스텀 `render`** 사용 (QueryClient Provider 포함)
- API 모킹: MSW (`src/test/mocks/`) — 테스트별 재정의는 `server.use(http.get/post(...))`
- `beforeEach(() => sessionStorage.clear())` — 인증 상태 격리
- 에러 케이스 (`rejects.toThrow`) 필수 작성
- 한국어 테스트 설명: `describe('기능명', () => { it('한국어 설명', ...) })`

---

## 📬 커밋 / PR 컨벤션

### 커밋 메시지

형식: `type: 한국어 설명 [refs #레드마인번호]`

허용 타입: `feat`, `update`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

예시:

```
feat: 실험실 목록 API 연동
fix: OTP 타이머 만료 로직 수정 refs #123
update: 로그인 폼 유효성 검증 강화
```

### PR 생성 규칙 (필수)

- **브랜치 방향**: `feature/**` → `dev` 만 허용 — 다른 브랜치(main 등)로 PR 절대 금지
- **생성 주체**: GitHub에서 사람이 직접 PR 생성 — AI가 자동으로 PR 생성 금지
- **AI 역할**: PR 생성 자체는 하지 않음 — commit/push 까지만 보조

### PR 작성 (AI 협업에 특히 중요)

- **제목**: 커밋 메시지와 동일 형식
- **본문**: `.github/pull_request_template.md` 준수
- **AI 협업 특성**: 리뷰어가 새 Claude 세션으로 PR을 읽을 수 있어야 하므로 **변경 배경과 의사결정 이유를 상세히** 작성
- 변경 파일 목록은 자동으로 diff에 보임 — 본문에는 **왜**를 쓸 것

---

## 🚫 절대 금지 사항

1. `src/routeTree.gen.ts` 직접 편집 (자동 생성 파일)
2. `npm`, `yarn`, `npx` 명령어 사용
3. `any` 타입 사용
4. 팀 합의 없는 `@ts-ignore` / `@ts-expect-error`
5. React Query가 캐싱하는 서버 상태를 목적 없이 Zustand 스토어에 복제 저장 (멀티스텝 플로우의 일회성 전달값은 예외 — `registerFlowStore` 참고)
6. `[TEMP]` 마킹 없이 임시 stub 코드 작성
7. 브라우저 저장소(localStorage/sessionStorage/쿠키) 선택은 기능 요구사항에 맞춰 구현 시점에
   판단하고, 그 판단 근거를 코드 주석으로 남길 것 (예: src/utils/cookie.ts 상단 주석 참고)
8. 테스트 생략 (새 로직은 반드시 테스트 추가)

---

## 🌱 환경 변수 (`.env.example` 기준)

| 변수                       | 용도                         |
| -------------------------- | ---------------------------- |
| `VITE_API_BASE_URL`        | API 서버 주소                |
| `VITE_PORTONE_STORE_ID`    | PortOne 스토어 ID (본인인증) |
| `VITE_PORTONE_CHANNEL_KEY` | PortOne 채널 키              |

새 환경 변수 추가 시: `.env.example`, `.env.local`, `.env.production` 모두에 동기화.

---

## 📂 디렉토리 구조

```
src/
  api/          — API 함수 + 타입 (.test.ts 포함)
  components/   — 재사용 컴포넌트
    layout/     — Header, Footer, Layout
  pages/        — 페이지 단위 컴포넌트
  routes/       — TanStack Router 파일 기반 라우트
  stores/       — Zustand 전역 상태
  utils/        — 공통 유틸 (date, requireAuth 등)
  test/         — MSW 핸들러, 테스트 setup, 커스텀 render
  styles/       — 전역 CSS
```

상세 규칙은 각 디렉토리의 `CLAUDE.md` 참고:

- `src/api/CLAUDE.md`
- `src/routes/CLAUDE.md`
