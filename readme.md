# KP Lab-Manager FRONT

> React, Vite, SWC 기반의 프로젝트

<br>

## 📋 목차

- [🛠 시작하기](#-시작하기)
- [🔄 협업 가이드 (중요)](#-협업-가이드-중요)
- [🌿 브랜치 및 협업 전략 (필독)](#-브랜치-및-협업-전략-필독)
- [🔒 배포 전 보안 체크](#-배포-전-보안-체크)
- [🔄 협업 가이드](#-협업-가이드)
- [🛠 기술 상세 스택](#-기술-상세-스택)
- [🤖 AI 개발 워크플로우 (Claude Code)](#-ai-개발-워크플로우-claude-code)
- [📁 프로젝트 구조](#-프로젝트-구조)

<br>

## 🛠 시작하기

### 📋 사전 요구사항

- **Node.js** >= 22.x
- **pnpm** >= 10.30.3

#### ⚠️ 중요: pnpm 필수 (npm, yarn 사용 금지)

이 프로젝트는 **pnpm으로만 구성**되어 있습니다. 팀 전체의 일관된 환경을 유지하기 위해 **npm 또는 yarn 사용은 금지**됩니다.

**❌ 절대 사용 금지:**

```bash
# 이 명령어들을 사용하면 안 됩니다!
npm install        # ❌ 금지
yarn install       # ❌ 금지
npm run dev        # ❌ 금지
yarn dev           # ❌ 금지
npm run build      # ❌ 금지
yarn build         # ❌ 금지
```

**✅ 반드시 pnpm 사용:**

```bash
pnpm install       # ✅ 의존성 설치
pnpm dev           # ✅ 개발 서버 실행
pnpm build         # ✅ 빌드
pnpm test          # ✅ 테스트
```

#### 🔔 Node.js 버전 정렬 안내

**중요:** CI/CD 파이프라인에서는 **Node.js 22.x**를 사용합니다. 로컬 개발 환경에서도 동일한 버전을 사용하여 **버전 불일치로 인한 문제를 예방**하세요.

- 버전 불일치는 로컬에서는 성공하지만 CI에서 실패하는 상황을 초래할 수 있습니다.
- Node 버전 관리 도구 (nvm, fnm, volta 등)를 사용하여 프로젝트별 버전을 자동으로 맞추길 권장합니다.

### 📦 설치 및 실행

```bash
# 1. 의존성 설치 (pnpm 필수)
pnpm install

# 2. 로컬 개발 서버 실행
pnpm dev
```

<br><br>

## 🔄 협업 가이드 (중요)

### ⚠️ [필수] commit · push · PR 전 — `/pre-check-test` 사전 점검

commit/push/PR 전 **반드시** Claude Code 채팅창에서 `/pre-check-test`를 실행하여 CI 실패를 사전 차단하세요.

```
/pre-check-test
```

#### 동작 방식

| 순서 | 동작         | 내용                                                                             |
| ---- | ------------ | -------------------------------------------------------------------------------- |
| 1    | CI 전체 검사 | `pnpm ci:check` — 포맷·타입·린트·테스트·빌드 한번에 실행                         |
| 2    | 보안 감사    | `pnpm audit --audit-level=high`                                                  |
| 3    | 결과 리포트  | 항목별 ✅/❌ 출력                                                                |
| 4    | 에러 발견 시 | 개발자 승인 후 자동 수정 — 포맷(`pnpm format`)·린트(`pnpm lint:fix`)만 자동 처리 |
| 5    | 재검증       | 수정 후 동일 검사 재실행으로 최종 확인                                           |

<br><br>

### [참고] push 전, 별도 진행 - 보안 취약점 체크 필요

#### ⚠️ 보안 취약점 스캔(`pnpm audit`)은 **Push 시에는 실행되지 않습니다. (PR 에서만 실행)**

즉, Push가 성공해도 PR에서 실패할 수 있습니다. <br> (=> push 전, 아래 명령어로 실행으로, 사전 에러 방지 보안 취약점 체크 진행 권장)

- ❌ 로컬 husky: Security Audit 포함 안 함
- ✅ PR 단계: Security Audit 포함 (자동 실행)

<br>

**사전 방지 (필수):**

```bash
# Push 전에 로컬에서 수동으로 실행하여 미리 감지
pnpm audit --audit-level=high
```

**✅ 성공 시 결과:**

```text
No known vulnerabilities found
```

이렇게 하면 PR 단계에서 에러없이 진행 됩니다. (보안 에러로 PR이 닫히지 않습니다.)

<br><br>

### [참고] PR (Pull Request) 전 체크사항

이 프로젝트는 **Husky**를 통해 Git Hook을 자동화하여, 코드 품질을 강제합니다.
개발자가 별도의 검증 명령어를 실행할 필요 없이, 자동으로 검사가 수행됩니다.

<br>

#### 🔄 자동화된 검증 프로세스

**1️⃣ Git Commit 시 - 커밋 메시지 검증 & 자동 포맷팅**

```bash
$ git commit -m "feat: 로그인 기능 추가 refs #123"
```

| 단계           | 역할               | 설명                                                                                      |
| -------------- | ------------------ | ----------------------------------------------------------------------------------------- |
| **pre-commit** | 자동 포맷팅 & 린트 | Staging된 파일들만 `lint-staged`를 통해 `prettier`와 `eslint --fix` 자동 실행 (빠른 처리) |
| **commit-msg** | 메시지 검증        | 커밋 메시지 형식 검사 (commitlint)                                                        |

<br>

**✅ 성공 케이스:**

```bash
# refs는 선택사항 (있어도 되고 없어도 됨)
feat: 로그인 기능 추가
test: 테스트 진행함
update: 비밀번호 검증 강화 refs #124
fix: 토큰 만료 버그 수정 refs #125
docs: API 문서 작성

# 레드마인 이슈와 연동할 때는 refs 포함 권장
feat: 사용자 인증 추가 refs #123
```

**❌ 실패 케이스:**

```bash
Feat: 로그인 기능 추가          # ❌ 대문자 (소문자만 허용)
awesome: 멋진 기능 추가         # ❌ 허용되지 않는 타입
feat:                         # ❌ 설명 없음 (필수)
기능 추가 refs #123           # ❌ 타입 없음 (필수)
```

<br>

**허용되는 타입 (8가지):**

| 타입         | 의미                 | 예시                            |
| ------------ | -------------------- | ------------------------------- |
| **feat**     | 새로운 기능 추가     | `feat: 로그인 API 구현`         |
| **update**   | 기능 개선/수정       | `update: 비밀번호 검증 강화`    |
| **fix**      | 버그 수정            | `fix: 토큰 만료 오류`           |
| **docs**     | 문서만 수정          | `docs: API 문서 업데이트`       |
| **style**    | 코드 스타일 수정     | `style: 들여쓰기 수정`          |
| **refactor** | 코드 구조 개선       | `refactor: 함수 분리`           |
| **test**     | 테스트 코드 추가     | `test: 로그인 테스트 추가`      |
| **chore**    | 설정, 패키지 관리    | `chore: 라이브러리 업데이트`    |
| **ai**       | AI 관련 설정 및 처리 | `ai: /pre-check-test 스킬 추가` |

<br>

#### 📋 수동 검증 방법 (선택사항)

자동 검증 외에도, 필요시 수동으로 검증할 수 있습니다:

```bash
# 로컬 통합 검증 (Format, Type, Lint, Test, Build 체크)
pnpm ci:check

# 에러 발생 시 자동 수정 시도
pnpm ci:check:fix
```

<br>

**2️⃣ Git Push 시 - 전체 CI 검사 자동 실행**

```bash
$ git push origin feature/...
```

Push 직전, `pre-push` 훅이 자동으로 실행되어 다음 검사를 수행합니다:

```bash
pnpm ci:check
# = pnpm format:check       # 코드 포맷 확인
#   && pnpm type-check      # TypeScript 타입 검사
#   && pnpm lint            # ESLint 린트 검사
#   && pnpm test            # 단위 테스트
#   && pnpm build           # 빌드 가능 확인
```

**⚡ 목적:**

- GitHub Actions CI 시 실행되는 검사를 Push 전에 로컬에서 샤전 수행
- CI 실패로 인한 PR 반려 방지
- 팀의 코드 품질 표준 자동 준수

<br>

**💡 주의사항:**

- **`pnpm install` 실행**: 팀원이 처음 설정할 때 자동으로 Husky 훅이 설치됩니다
- **Commit 메시지 형식 준수**: 정확한 포맷이 아니면 커밋이 차단됩니다
- **Push 전 자동 검사** : pre-push 훅이 실패하면 Push가 차단되므로, 로컬에서 미리 수정하세요

<br><br>

## 🌿 브랜치 및 협업 전략 (필독)

이 프로젝트는 원활한 협업을 위해 엄격한 브랜치 전략과 커밋 규칙을 준수합니다. 모든 개발자는 아래 규칙을 반드시 숙지하고 지켜주시기 바랍니다.

### 1️⃣ 브랜치 생성 규칙

각자 기능 개발을 할 때, `dev` 브랜치에서 분기하여 아래 형식으로 브랜치를 생성합니다.

- **형식**: `feature/#{redmine번호}-{기능명}`
- **예시**: `feature/#123-login-api`

<br>

### 2️⃣ (필수) dev 브랜치 Merge 규칙

- **`dev` 브랜치로의 Merge 는 오직 Pull Request (PR)를 통해서만 가능합니다.**
- **직접 Push 금지 ❌**
- **사전 작업**: `pnpm ci:check`가 로컬에서 모두 통과된 상태여야 합니다.
- **중요**: `dev` 브랜치는 반드시 PR을 통해서만 merge 될 수 있으며, 오직 `feature/**` 브랜치에서만 `dev`를 대상으로 PR을 생성할 수 있습니다.

<br>

### 3️⃣ (필수) main 브랜치 관리

- **`main` 브랜치는 프로덕션 배포용 (live) 브랜치입니다.**
- 반드시 `dev` -> `main` 방향으로 PR을 생성하여 merge를 진행합니다.
- 직접 수정이나 직접 merge는 절대 금지됩니다.

<br>

### 4️⃣ Commit 컨벤션 및 Redmine 연동

커밋 메시지는 반드시 **키워드**와 **레드마인 이슈번호**를 포함해야 합니다.

- **형식**: `feat: 기능 설명 refs #{redmine번호}`
- **예시**: <br>
  `feat: 로그인 기능 구현 refs #5` <br>
  `update: 로그인 이메일 형식 추가 refs #5` <br>
  `fix: 비밀번호 변경 버그 수정 refs #5` <br>
  `update: 로그인 기능 구현 완료 closes  #5` <br>

<br>

| 키워드       | 의미                   | 예시                                       |
| :----------- | :--------------------- | :----------------------------------------- |
| **feat**     | 새로운 기능 추가       | `feat: 로그인 API 구현 refs #123`          |
| **update**   | 기능 수정              | `update: 비밀번호 검증 추가 refs #124`     |
| **fix**      | 버그 수정              | `fix: 비밀번호 검증 오류 수정 closes #124` |
| **docs**     | 문서만 수정            | `docs: 설치 가이드 업데이트 refs #125`     |
| **style**    | 코드 포맷, 스타일 수정 | `style: 버튼 디자인 수정 refs #126`        |
| **refactor** | 코드 구조 개선         | `refactor: fetch 함수 리팩토링 refs #127`  |
| **test**     | 테스트 코드 추가       | `test: 유효성 검사 테스트 추가 refs #128`  |
| **chore**    | 설정, 패키지 관리      | `chore: 라이브러리 업데이트 refs #129`     |

<br>

### 5️⃣ Push 전 사전 테스트 진행

코드 안정성을 위해 원격 저장소에 Push 하기 전, 로컬에서 모든 검증을 통과해야 합니다.
현재 Push 시, Husky를 통해 자동적으로 진행됩니다. ( Husky 미진행 시, 수동으로 아래 명령어로 진행 필요)

```bash
# 사전 테스트 진행
$ pnpm ci:check

# 에러 발생 시 자동 수정 시도
$ pnpm ci:check:fix
```

**🚨 `pnpm ci:check`가 통과된 경우에만 "feature/**" 브랜치에 push 합니다.\*\*

<br><br>

## 🔒 배포 전 보안 체크

### 📋 Security Audit 검증

이 프로젝트는 보안을 강화하기 위해 GitHub Actions에서 **자동으로 Security Audit을 실행**합니다.

#### 🔄 검증 프로세스

| 단계          | 실행 시점   | 내용                             |
| ------------- | ----------- | -------------------------------- |
| **로컬 개발** | 매일        | lint, format, test (빠른 피드백) |
| **PR 단계**   | 자동        | **Security Audit** + 모든 검사   |
| **배포 전**   | 수동 (권장) | 최종 보안 점검                   |

#### ✅ 배포 전 최종 보안 점검 (권장)

배포하기 전에 다음 명령어로 보안 취약점을 최종 확인하세요:

```bash
# 보안 취약점 스캔 (High 심각도 이상)
pnpm audit --audit-level=high
```

**예상 결과:**

```
No known vulnerabilities found  ✅
```

만약 취약점이 발견되면:

```bash
# 자동 수정 시도
pnpm audit fix

# 또는 특정 패키지만 업데이트
pnpm update <package-name>
```

#### 📌 주의사항

- **로컬에서는** lint, format, test만 자동 실행 (빠른 개발 경험)
- **PR 단계에서는** Security Audit을 포함한 모든 검사 실행 (최종 검증)
- **배포 전에는** `pnpm audit --audit-level=high`로 수동 확인 권장
- Security Audit 실패 시 PR이 자동으로 닫힙니다

#### 🛡️ 보안 정책

자세한 보안 구현 현황과 향후 진행 항목은 아래를 참고하세요:

- [보안 구현 현황](./docs/security/implemented.md) - Phase 1 완료 항목
- [보안 추후 진행](./docs/security/future-work.md) - Phase 2-3 계획

<br><br>

## 🔄 협업 가이드

### 📌 파일명 규칙 (Code Convention)

파일명은 **PascalCase** 또는 **camelCase**를 기본으로 합니다.

| 유형                    | 규칙       | 예시                          |
| :---------------------- | :--------- | :---------------------------- |
| **페이지/컴포넌트**     | PascalCase | `LoginPage.tsx`, `Header.tsx` |
| **Hooks / 유틸 / 함수** | camelCase  | `useAuth.ts`, `formatDate.ts` |
| **스타일 파일**         | camelCase  | `index.css`                   |

<br>

### ✅ PR 체크리스트

PR을 생성하기 전에 아래 항목을 최종 확인하세요:

- [ ] `pnpm ci:check`를 통해 모든 검증을 통과했는가?
- [ ] 최신 `dev` 브랜치로부터 branch를 생성했는가?
- [ ] 불필요한 `console.log`나 디버그 코드를 제거했는가?
- [ ] PR 제목에 레드마인 번호와 작업 내용이 명확히 포함되었는가?

<br><br>

## 🛠 기술 상세 스택

### 🎯 핵심 프레임워크 & 도구

- **React**: 19.x (UI 라이브러리)
- **TypeScript**: 5.9 (정적 타입)
- **Vite**: 7.x (빌드 도구)
- **SWC**: Rust 기반 고속 컴파일러
- **TanStack Router**: 파일 기반 라우팅
- **TanStack React Query**: 서버 상태 관리
- **Zustand**: 클라이언트 전역 상태 관리
- **Tailwind CSS**: 유틸리티 기반 스타일링

<br>

## 🤖 AI 개발 워크플로우 (Claude Code)

이 프로젝트는 **Claude Code CLI** 기반으로 개발합니다.  
아래 슬래시 명령어(`/`)를 Claude Code 채팅창에 입력하면 설계·검증·코드 생성이 자동으로 진행됩니다.

### 신규 기능 개발 — 4단계 필수

| 단계 | 입력                              | 동작                                                            |
| ---- | --------------------------------- | --------------------------------------------------------------- |
| 1    | `/plan-feature <기능 설명>`       | Opus AI가 영향 파일·데이터 흐름·테스트 전략 포함 구현 계획 수립 |
| 2    | `/verify-plan`                    | Opus AI가 계획의 환각·결함·컨벤션 위반 재검증                   |
| 3    | `"계획대로 구현해줘"` (말로 요청) | Sonnet AI가 검증된 계획대로 코드 작성                           |
| 4    | `/verify-impl`                    | type-check + lint + test + 코드 리뷰 자동 실행                  |

> 버그 수정·단일 파일 수준 변경은 말로 요청 후 `/verify-impl`만 실행하면 됩니다.

### 실제 개발 흐름 예시

```
# 1. 새 기능 시작 — 채팅창에 입력
/plan-feature 실험실 목록에 검색 필터 추가

# 2. 계획 검증
/verify-plan

# 3. 구현 요청 — 그냥 말로
"계획대로 구현해줘"

# 4. PR 전 최종 검증
/verify-impl

# 5. 새 파일이 필요하면 — 보일러플레이트 자동 생성 후 3단계로
/new-api experiment       → src/api/experiment.ts + 테스트 파일 생성
/new-route /experiments   → src/routes/experiments.tsx + 페이지 + 테스트 파일 생성
```

### 보일러플레이트 자동 생성 명령어

| 명령어                  | 생성 결과                                               |
| ----------------------- | ------------------------------------------------------- |
| `/new-api <도메인>`     | `src/api/{도메인}.ts` + 테스트 파일                     |
| `/new-component <이름>` | `src/components/{이름}.tsx` + 테스트 파일               |
| `/new-route <경로>`     | `src/routes/{경로}.tsx` + 페이지 컴포넌트 + 테스트 파일 |
| `/new-store <이름>`     | `src/stores/{이름}Store.ts` + 테스트 파일               |
| `/check-temp`           | 프로젝트 전체의 `[TEMP]` 임시 코드 현황 목록 조회       |

> 상세 컨벤션 및 아키텍처 규칙은 루트 `CLAUDE.md` 참고

<br><br>

## 📁 프로젝트 구조

```
src/
├── api/                 # API 클라이언트 (fetch wrapper)
├── components/          # 공통 컴포넌트 (layout 등)
├── pages/               # 페이지 컴포넌트
├── routes/              # TanStack Router 라우트 정의
├── stores/              # Zustand 상태 스토어
├── utils/               # 공통 유틸리티
├── main.tsx             # 앱 진입점
├── router.tsx           # 라우터 설정
└── index.css            # 전역 스타일
```

<br>

---

<div align="center">

**⭐ KP Lab-Manager FRONT**  
Built with ❤️ by KP한석화학 LAB BIZ팀

</div>
