# PR Main Workflow 설명 (main 브랜치)

## 📋 개요

이 워크플로우는 `dev` 브랜치에서 `main` 브랜치로 PR을 생성할 때 자동으로 실행됩니다.
dev에서 완성된 기능들을 검증한 후, 통과하면 자동으로 main에 merge됩니다.

**파일 위치**: `.github/workflows/pr-main.yml`

**상태**: ⚠️ 현재 미사용 (2024.03.16 기준)

> 사용 시 Test 필요 - PR (dev → main) 생성 시 GitHub Action이 실행되지 않는 이슈 있음

---

## 🎯 실행 조건

```yaml
on:
  pull_request:
    branches:
      - main
```

- **트리거**: `main` 브랜치를 대상으로 하는 PR 생성 시
- **추가 조건**: PR의 source branch가 정확히 `dev`여야 함
  - ✅ `dev` → `main` → 실행
  - ❌ `feature/something` → `main` → 실행 안 함

---

## 🔧 실행 단계

### 1️⃣ 환경 설정

```yaml
- Checkout code: 코드 가져오기 (전체 git history 포함)
- Setup pnpm: pnpm 패키지 매니저 설치
- Setup Node.js: Node.js 22 버전 설정
- Install dependencies: pnpm install --frozen-lockfile 실행
```

### 2️⃣ 코드 품질 검사

```yaml
- Run linter: pnpm lint 실행
  └─ 결과 저장: /tmp/lint_output.txt

- Build project: pnpm build 실행
  └─ 결과 저장: /tmp/build_output.txt
```

**주의**: `continue-on-error: true`로 설정되어 오류가 발생해도 다음 단계는 계속 진행됩니다.

### 3️⃣ PR 정보 수집

```yaml
PR_NUMBER: PR 번호
PR_URL: PR의 GitHub URL
BRANCH_NAME: source branch 이름 (dev)
```

### 4️⃣ 검증

```yaml
- Verify PR is from dev to main: dev에서 main으로의 PR인지 확인
  └─ 다른 branch에서의 PR이면 실패
```

---

## ✅ 성공 시나리오

### 조건: Lint와 Build 모두 성공

#### 📝 PR 댓글 작성

```
## ✅ 모든 검사 통과

| 항목 | 상태 |
|------|------|
| Linting | ✅ Success |
| Build | ✅ Success |

모든 검사가 통과했습니다! 🎉
자동으로 main 브랜치로 merge됩니다.
```

#### 🔄 자동 Merge

```bash
gh pr merge <PR_NUMBER> --squash --delete-branch
```

- **Squash merge**: 모든 커밋을 하나의 커밋으로 통합
- **Delete branch**: merge 후 dev 브랜치는 **삭제되지 않음** (계속 사용되므로)

#### 🔔 Discord 알림

- 제목: `✅ PR 테스트 성공 & main 머지 완료`
- 색상: 녹색 (3066993)
- 정보: 브랜치, PR 링크, 작성자, Lint/Build 상태

---

## ❌ 실패 시나리오

### 조건 1: dev가 아닌 다른 branch에서 PR을 생성

```
❌ Error: PR must be from dev branch, but got <branch_name>
```

- 워크플로우가 중단됩니다

### 조건 2: Lint 또는 Build 실패

#### 📝 PR 댓글 작성

```
## ❌ 검사 실패

다음 항목에서 실패했습니다. 코드를 수정한 후 다시 커밋해주세요.

| 항목 | 상태 |
|------|------|
| Linting | ❌ Failed |

전체 결과 보기: [GitHub Actions 링크]
```

#### 🚫 PR 자동 닫기

- PR이 자동으로 닫힙니다
- dev 브랜치의 오류를 수정하고 새 PR을 생성해야 합니다

#### 🔔 Discord 알림

- 제목: `❌ PR 테스트 실패`
- 색상: 빨강 (15158332)
- 정보: 브랜치, PR 링크, 작성자, 에러 메시지
- 에러 메시지는 최대 1016자까지 포함

---

## 📊 권한 설정

```yaml
permissions:
  contents: write # 코드 수정/push 권한
  pull-requests: write # PR 댓글/병합 권한
```

---

## 🔐 필수 Secrets

| Secret            | 용도                        |
| ----------------- | --------------------------- |
| `GITHUB_TOKEN`    | GitHub API 접근 (자동 제공) |
| `PR_CREATE`       | PR merge 권한               |
| `DISCORD_WEBHOOK` | Discord 알림 전송           |

---

## 📊 PR to dev vs PR to main 비교

| 항목              | PR to dev           | PR to main    |
| ----------------- | ------------------- | ------------- |
| **Source Branch** | `feature/*`         | `dev`         |
| **Target Branch** | `dev`               | `main`        |
| **목적**          | 기능 검증           | 릴리스 검증   |
| **Merge 전략**    | Squash              | Squash        |
| **Branch 삭제**   | ✅ 기능 브랜치 삭제 | ✅ 추적 안 함 |
| **상태**          | ✅ 사용 중          | ⚠️ 미사용     |

---

## 🔄 릴리스 프로세스

```
feature/* branches
    ↓
PR to dev (pr-test.yml)
    ↓
✅ Merge to dev
    ↓
dev branch에 변경사항 적립
    ↓
PR to main (pr-main.yml) ← 현재 미사용
    ↓
✅ Merge to main (릴리스)
```

---

## ⚠️ 알려진 이슈

**GitHub Action이 실행되지 않음**

- dev → main PR을 생성해도 워크플로우가 트리거되지 않음
- 원인: GitHub의 보호된 브랜치 정책이나 권한 설정 문제로 추정
- 해결: 테스트 필요

---

## 📌 개발자 가이드

### 🎯 main 브랜치로 병합하기

1. **dev 브랜치가 완성되었는지 확인**
   - 모든 feature가 merge되었는가?
   - Lint/Build가 성공하는가?

2. **PR 생성 시 주의**
   - Source: `dev` ✅
   - Target: `main` ✅

3. **머지 완료**
   - 자동 merge (워크플로우 작동 시)
   - 또는 수동 merge

### 🔍 로컬에서 테스트

```bash
# 최신 dev 코드로 업데이트
git checkout dev
git pull origin dev

# 품질 확인
pnpm install
pnpm lint
pnpm build

# main으로 merge할 준비 완료
```

---

## 🚀 사용 준비

이 워크플로우를 활성화하려면:

1. ✅ 워크플로우 테스트
2. ✅ GitHub 브랜치 보호 규칙 확인
3. ✅ 필수 Secrets 설정 확인
4. ✅ Discord Webhook 설정 확인
5. ✅ 팀원과 릴리스 프로세스 공유
