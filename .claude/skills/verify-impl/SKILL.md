---
name: verify-impl
description: 구현된 코드를 검증합니다 (type-check + lint + test + 셀프 리뷰)
---

방금 구현한 변경사항을 종합 검증합니다. PR 제출 전 마지막 단계.

## 절차

1. **변경 파일 확인**

   ```bash
   git diff --name-only HEAD
   git diff --stat HEAD
   ```

2. **자동 검증 (`test-runner` 서브에이전트 호출)**
   - `pnpm type-check`
   - `pnpm lint`
   - `pnpm test --run` (변경 영역에 해당하는 테스트)
   - 실패 시 원인 진단

3. **셀프 리뷰 (`code-reviewer` 서브에이전트 호출)**
   - 환각 검증 (import/함수 실존)
   - 컨벤션 준수
   - 임시 코드 마킹 누락
   - 보안 이슈
   - 테스트 충분성

4. **결과 종합 보고**

## 출력 형식

```markdown
# /verify-impl 검증 결과

## 1. 자동 검증 (test-runner)

- Type Check: ✅/❌
- Lint: ✅/❌
- Test: ✅/❌

## 2. 셀프 리뷰 (code-reviewer)

- 통과: ...
- 경고: ...
- 수정 필요: ...

## 📊 최종 판정

- [ ] PR 제출 가능 — 다음: `git add` → `git commit` → `gh pr create`
- [ ] 수정 후 재검증 필요 — 수정 사항: ...
```

## 주의

- 두 서브에이전트 모두 Sonnet 모델 사용 (검증은 빠르고 비용 효율적)
- 실패 시 직접 수정하지 말고, 메인 세션에서 사용자와 함께 수정 방향 결정
- 모든 검증 통과 후에만 PR 제출 권장
