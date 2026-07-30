# PR Test Workflow 설명 (dev 브랜치)

## 📋 개요

이 워크플로우는 `feature/*` 브랜치에서 `dev` 브랜치로 PR을 생성할 때 자동으로 실행됩니다.
코드의 품질을 검증한 후, 모든 검사가 통과하면 자동으로 merge됩니다.

**파일 위치**: `.github/workflows/pr-test.yml`

---

## 🎯 실행 조건

```yaml
on:
  pull_request:
    branches:
      - dev
```

- **트리거**: `dev` 브랜치를 대상으로 하는 PR 생성 시
- **추가 조건**: PR의 브랜치 이름이 `feature/`로 시작해야 함
  - ✅ `feature/#15-new-feature` → 실행
  - ❌ `bugfix/issue-123` → 실행 안 함

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
BRANCH_NAME: 기능 브랜치 이름
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
자동으로 dev 브랜치로 merge됩니다.
```

#### 🔄 자동 Merge

```bash
gh pr merge <PR_NUMBER> --squash --delete-branch
```

- **Squash merge**: 모든 커밋을 하나의 커밋으로 통합
- **Delete branch**: merge 후 기능 브랜치 자동 삭제

#### 🔔 Discord 알림

- 제목: `✅ PR 테스트 성공 & dev 머지 완료`
- 색상: 녹색 (3066993)
- 정보: 브랜치, PR 링크, 작성자, Lint/Build 상태

---

## ❌ 실패 시나리오

### 조건: Lint 또는 Build 실패

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

- PR이 자동으로 닫히게 됩니다
- 개발자가 수정 후 새 PR을 생성해야 합니다

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

## 📌 개발자 가이드

### ✨ PR을 성공시키려면

1. **브랜치 명명 규칙 준수**

   ```
   feature/#이슈번호-기능설명
   예: feature/#15-add-login-page
   ```

2. **Lint 통과**

   ```bash
   pnpm lint
   ```

3. **Build 성공**

   ```bash
   pnpm build
   ```

4. **PR 대상 확인**
   - Base branch: `dev` ✅
   - Head branch: `feature/*` ✅

### 🔍 로컬에서 테스트

```bash
# 의존성 설치
pnpm install

# Lint 확인
pnpm lint

# Build 확인
pnpm build
```

---

## ⚠️ 주의사항

- **PR이 닫힐 수 있음**: Lint/Build 실패 시 자동으로 닫히므로 오류를 먼저 수정하세요
- **Squash merge**: 모든 커밋이 하나로 통합되므로 개별 커밋 히스토리는 dev에 남지 않습니다
- **Discord 알림**: Webhook 설정 필수, 없으면 알림이 전송되지 않습니다
