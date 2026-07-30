# GitHub Workflow 가이드

이 문서는 프로젝트의 자동화된 PR 검증 시스템에 대한 개요입니다.
협업자들이 효율적으로 코드를 작성하고 merge할 수 있도록 설계되었습니다.

---

## 🚀 전체 플로우

```
개발 시작
  ↓
1. feature/* 브랜치 생성
  ↓
2. 코드 작성 및 커밋
  ↓
3. PR to dev 생성
  ↓
┌─────────────────────────────────┐
│ PR Test Workflow (pr-test.yml)  │  ← feature/* → dev
│ - Lint 검사                      │
│ - Build 검사                     │
│ - Discord 알림                   │
└─────────────────────────────────┘
  ↓
  성공?
  ├─ YES → 자동 merge to dev + 브랜치 삭제
  └─ NO  → PR 닫음 + 오류 표시
  ↓
dev 브랜치에 통합됨
  ↓
릴리스 준비 시
  ↓
PR to main 생성
  ↓
┌──────────────────────────────────┐
│ PR Main Workflow (pr-main.yml)   │  ← dev → main
│ - Lint 검사                       │
│ - Build 검사                      │
│ - Discord 알림                    │
│ - (현재 미사용)                   │
└──────────────────────────────────┘
  ↓
main 브랜치에 릴리스됨
```

---

## 📁 파일 구조

```
.github/
└── workflows/
    ├── pr-test.yml    ✅ 활성화 - feature/* → dev
    └── pr-main.yml    ⚠️ 미사용 - dev → main (문제 해결 필요)
```

---

## 📌 빠른 참조

### PR to dev (기능 개발)

| 구분     | 내용                            |
| -------- | ------------------------------- |
| **파일** | `.github/workflows/pr-test.yml` |
| **언제** | feature/\* → dev PR 생성 시     |
| **검사** | Lint + Build                    |
| **성공** | ✅ 자동 merge to dev            |
| **실패** | ❌ PR 닫음                      |
| **알림** | Discord 메시지                  |
| **상태** | ✅ 운영 중                      |

→ 자세한 내용: [PR Test Workflow 설명](WORKFLOW_PR_TEST_GUIDE.md)

### PR to main (릴리스)

| 구분     | 내용                            |
| -------- | ------------------------------- |
| **파일** | `.github/workflows/pr-main.yml` |
| **언제** | dev → main PR 생성 시           |
| **검사** | Lint + Build + Branch 검증      |
| **성공** | ✅ 자동 merge to main           |
| **실패** | ❌ PR 닫음                      |
| **알림** | Discord 메시지                  |
| **상태** | ⚠️ 미사용 (버그 있음)           |

→ 자세한 내용: [PR Main Workflow 설명](WORKFLOW_PR_MAIN_GUIDE.md)

---

## 💡 핵심 기능

### 1. 자동 코드 검사 ✨

- **Lint**: 코드 스타일 검사 (문법, 규칙 준수)
- **Build**: 컴파일 및 번들링 검사
- 개발자가 수동으로 검사할 필요 없음

### 2. 자동 Merge 🔄

- 검사 통과 시 자동으로 merge
- Squash merge로 커밋 히스토리 정리
- 브랜치 자동 삭제

### 3. 실시간 피드백 📢

- PR에 결과를 댓글로 작성
- Discord로 팀에 알림
- 실패 시 오류 메시지 포함

### 4. 자동 실패 처리 ⚠️

- Lint/Build 실패 시 PR 자동 닫음
- 개발자가 수정 후 새 PR 생성

---

## 🎯 개발자 체크리스트

### PR 생성 전

- [ ] 브랜치 이름이 `feature/*` 형식인가?
- [ ] 로컬에서 `pnpm lint` 통과했는가?
- [ ] 로컬에서 `pnpm build` 통과했는가?
- [ ] PR 대상 브랜치가 `dev`인가?

### PR 생성 후

- [ ] PR에 설명과 이슈 번호가 있는가?
- [ ] GitHub Actions 실행 대기 중인가?
- [ ] 검사 결과를 확인했는가?
- [ ] 통과 후 자동 merge 확인했는가?

---

## 🔧 필수 설정

### GitHub Secrets 확인

이 작업들이 정상 작동하려면 다음 Secrets이 설정되어야 합니다:

| Secret            | 설정 위치                    |
| ----------------- | ---------------------------- |
| `GITHUB_TOKEN`    | GitHub 기본 제공 (자동)      |
| `PR_CREATE`       | Settings → Secrets → Actions |
| `DISCORD_WEBHOOK` | Settings → Secrets → Actions |

**Discord Webhook 설정:**

```bash
Settings → Secrets and variables → Actions
→ New repository secret
→ Name: DISCORD_WEBHOOK
→ Value: https://discordapp.com/api/webhooks/...
```

---

## ❓ FAQ

### Q: PR이 자동으로 닫혔는데요?

**A:** Lint 또는 Build가 실패했기 때문입니다.

1. PR 댓글의 오류 메시지 확인
2. 로컬에서 오류 수정: `pnpm lint`, `pnpm build`
3. 커밋 후 새 PR 생성

### Q: Discord 알림이 안 와요

**A:** Webhook이 설정되지 않았을 가능성:

1. Settings → Secrets → `DISCORD_WEBHOOK` 확인
2. Webhook URL이 유효한지 확인
3. Discord 채널 권한 확인

### Q: feature/\* 가 아닌 다른 브랜치에서 PR을 만들었어요

**A:** 이 경우 Workflow가 실행되지 않습니다.

1. PR을 닫기
2. `feature/*` 형식의 새 브랜치에서 다시 PR 생성

### Q: Squash merge가 뭔가요?

**A:** 여러 커밋을 하나로 합치는 병합 방식입니다.

- **장점**: dev의 커밋 히스토리가 깔끔함
- **주의**: 개별 커밋 로그는 남지 않음

### Q: PR to main은 왜 미사용인가요?

**A:** GitHub Action이 실행되지 않는 버그가 있습니다.

- 원인 조사 중
- 현재는 수동으로 dev → main merge 권장

---

## 📚 더 자세한 정보

- **PR Test Workflow**: [WORKFLOW_PR_TEST_GUIDE.md](WORKFLOW_PR_TEST_GUIDE.md)
- **PR Main Workflow**: [WORKFLOW_PR_MAIN_GUIDE.md](WORKFLOW_PR_MAIN_GUIDE.md)

---

## 👥 문의

워크플로우 관련 문제가 있으면:

1. GitHub Actions 탭에서 실행 로그 확인
2. PR의 체크 결과 확인
3. 팀 리더에게 문의

---

**Last Updated**: 2026-03-16
