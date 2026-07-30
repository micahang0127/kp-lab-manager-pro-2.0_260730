---
name: check-temp
description: 프로젝트 전체에서 [TEMP] 마킹된 임시 코드를 찾아 목록화합니다
---

`[TEMP]` 마킹된 임시 코드(백엔드 미연동 stub 등)를 추적해 기술부채 현황을 보고합니다.

## 절차

1. **검색 실행**

   ```
   Grep pattern: "\[TEMP\]"
   path: src/
   output_mode: content
   -n: true
   -C: 1
   ```

2. **결과 분석**
   - 파일별로 그룹화
   - 각 항목에서 날짜(`YY.MM.DD`) 추출
   - 오래된 순서로 정렬

3. **출력 형식**

```markdown
# [TEMP] 코드 현황 (YYYY-MM-DD 기준)

## 📊 요약

- 총 N개 임시 코드
- 가장 오래된 것: YY.MM.DD (X일 경과)

## 📁 파일별 목록

### src/api/auth.ts

- **L28** `[TEMP] 26.03.17 백엔드 미연동` — confirmIdentityVerification
  - 경과: X일
  - 예상 작업: 백엔드 API 연동 시 stub 제거

### src/pages/LoginPage.tsx

- **L42** `[TEMP] 26.04.14 ...` — ...

## 💡 권장 조치

- 30일 이상 경과한 항목은 우선순위 검토 필요
- 백엔드 연동 일정과 매칭 권장
```

## 주의

- 단순 검색 도구 — 직접 수정은 하지 않음
- `[TEMP]` 형식이 아닌 임시 코드(`TODO`, `FIXME` 등)는 별도 검색 필요
- 결과를 PR 본문이나 이슈로 옮길 때 활용
