---
name: pr-create
description: diff를 읽고 PR 템플릿을 채워 draft를 출력, 사람 승인 후 dev 브랜치로 PR을 생성합니다
---

현재 `feature/**` 브랜치에서 `dev` 브랜치로 PR을 생성합니다.
사람이 draft 내용을 확인하고 명시적으로 승인한 후에만 `gh pr create`를 실행합니다.

## 입력

$ARGUMENTS — (선택) PR 제목 힌트. 없으면 diff에서 자동 추론.

## 절차

### 1. 브랜치 검증

```bash
git branch --show-current
```

현재 브랜치가 `feature/`로 시작하지 않으면 즉시 중단:

> 현재 브랜치가 feature/** 가 아닙니다. PR은 feature/** 브랜치에서만 생성할 수 있습니다.

### 2. 변경 내용 수집

```bash
git log dev..HEAD --oneline
git diff dev...HEAD --stat
git diff dev...HEAD
```

diff가 없으면 중단:

> dev와 비교한 변경사항이 없습니다. 커밋 후 다시 실행해주세요.

### 3. 템플릿 읽기

`.github/pull_request_template.md` 를 Read한다.

### 4. PR draft 생성 (출력만, gh pr create 실행 없음)

diff와 커밋 로그를 기반으로 아래 형식을 화면에 출력한다:

---

## PR Draft

**제목**: `type: 한국어 설명` (커밋 컨벤션 준수)
**base**: `dev` | **head**: `(현재 브랜치명)`

**본문**:
(pull_request_template.md 모든 섹션을 diff 기반으로 채운 내용)

---

템플릿 작성 기준:

- `📋 변경 사항` — diff에서 변경 유형 파악 후 해당 체크박스에 `x` 표시
- `🔍 변경 상세 > 주요 변경 사항` — 변경 파일·커밋 로그 기반 항목 나열
- `🔍 변경 상세 > 변경 이유` — 커밋 메시지·diff 맥락에서 추론
- `📸 스크린샷` — .tsx/.css 파일 변경 시 "스크린샷을 첨부해주세요" 안내
- `✅ 체크리스트` — `.test.` 파일 포함 여부로 테스트 항목 판단
- `🧪 테스트` — 변경된 기능의 테스트 방법 기술
- `📌 관련 이슈` — 커밋 메시지의 `refs #번호` / `closes #번호` 추출
- `🤖 AI 개발 체크리스트` — 변경 규모에 따라 해당 항목 표시

### 5. 사람 승인 요청

> 위 내용으로 PR을 생성하겠습니다.
> 수정이 필요하면 내용을 알려주세요. 그대로 진행하려면 **"승인"** 또는 **"ok"** 라고 입력해주세요.

- 수정 요청 → 해당 섹션 수정 후 draft 재출력, 5단계 반복
- 취소 요청 → "PR 생성을 취소합니다." 출력 후 종료
- "승인" / "ok" (대소문자 무관) → 6단계 진행

### 6. PR 생성 (승인 확인 후에만 실행)

```bash
gh pr create --base dev --title "<제목>" --body "<본문 전체>"
```

- `--base dev` 항상 명시 — 다른 값 절대 금지
- body는 4단계에서 작성한 전체 마크다운 그대로 사용

성공 시:

> PR이 생성되었습니다: (URL)

## 주의

- **승인 없이 `gh pr create` 절대 실행 금지** — 4단계 출력 후 반드시 5단계 응답을 기다릴 것
- base 브랜치는 항상 `dev` — main/master/release 시도 불가 (settings.json deny로도 차단됨)
- 브랜치 검증 실패 시 이후 절차 진행 금지
- `gh pr create` 실행 시 권한 팝업이 뜨면 명령어를 확인 후 허용할 것
