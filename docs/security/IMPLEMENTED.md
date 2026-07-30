# 🔒 보안 구현 현황

_마지막 업데이트: 2026-03-23_

---

## ✅ 구현 완료 항목

### 1️⃣ 인증/토큰 보안

| 항목                            | 파일                       |
| ------------------------------- | -------------------------- |
| JWT 형식 검증 (3부분 구조)      | `src/utils/requireAuth.ts` |
| 토큰 만료 시간 검증 (exp claim) | `src/utils/requireAuth.ts` |
| 공백 문자열 토큰 차단           | `src/utils/requireAuth.ts` |
| 유효하지 않은 토큰 자동 제거    | `src/stores/authStore.ts`  |
| 라우트 가드 (`requireAuth`)     | `src/routes/*`             |

---

### 2️⃣ API 클라이언트 보안

| 항목                  | 상세                              |
| --------------------- | --------------------------------- |
| 요청 타임아웃         | 10초 (AbortController)            |
| 401 처리              | 자동 로그아웃 + `/login` 리디렉션 |
| Bearer Token 인증     | `Authorization: Bearer <token>`   |
| HTTPS 강제 (프로덕션) | 콘솔 경고                         |
| 에러 클래스 정의      | `ApiError` export                 |

파일: `src/api/index.ts`

---

### 3️⃣ ESLint 보안 규칙

| 규칙                      | 레벨  | 이유                   |
| ------------------------- | ----- | ---------------------- |
| `no-floating-promises`    | error | 비동기 미처리 감지     |
| `no-misused-promises`     | error | Promise 오용 감지      |
| `no-explicit-any`         | error | any 타입 금지          |
| `no-unsafe-assignment`    | error | 할당값 타입 검증       |
| `no-unsafe-member-access` | warn  | 외부 라이브러리 유연성 |
| `no-unsafe-return`        | warn  | 외부 라이브러리 유연성 |
| `no-eval`                 | error | 동적 코드 실행 차단    |
| `no-implied-eval`         | error | 간접 eval 차단         |
| `no-debugger`             | error | 프로덕션 안전          |
| `eqeqeq`                  | error | 안전한 비교 강제       |

파일: `eslint.config.js`

---

### 4️⃣ 보안 헤더 (프론트엔드)

| 메타 태그                                          | 효과                  |
| -------------------------------------------------- | --------------------- |
| `X-Content-Type-Options: nosniff`                  | MIME 타입 스니핑 방지 |
| `Referrer-Policy: strict-origin-when-cross-origin` | Referrer 제어         |
| `X-Frame-Options: DENY`                            | iframe 임베딩 방지    |

파일: `index.html`

---

### 5️⃣ CI/CD 보안

| 항목                | 상세                            |
| ------------------- | ------------------------------- |
| 의존성 스캔         | `pnpm audit --audit-level=high` |
| High 심각도 감지 시 | PR 자동 차단                    |
| Discord 알림        | Security Audit 상태 포함        |

파일: `.github/workflows/pr-test.yml`

---

### 6️⃣ 테스트

| 항목                       | 파일                            |
| -------------------------- | ------------------------------- |
| 토큰 검증 (형식/만료/공백) | `src/utils/requireAuth.test.ts` |
| AuthStore 상태 관리        | `src/stores/authStore.test.ts`  |
| API 요청 (401 처리)        | `src/api/user.test.ts`          |
| 모의 API 서버 (MSW)        | `src/test/mocks/handlers.ts`    |

---

## ⚠️ 미구현 항목 (향후 진행 필요)

| 항목                            | 우선순위 | 단계    | 백엔드 필요      |
| ------------------------------- | -------- | ------- | ---------------- |
| **XSS: localStorage 토큰 탈취** | P0       | Phase 2 | ✅ 필수          |
| **Refresh Token**               | P0       | Phase 2 | ✅ 필수          |
| **Silent Refresh**              | P0       | Phase 2 | ✅ 필수          |
| **CORS 정책**                   | P0       | Phase 2 | ✅ 필수          |
| **CSP 헤더**                    | P1       | Phase 3 | ❌ 백엔드 불필요 |
| **HSTS/보안 헤더**              | P1       | Phase 3 | ❌ 백엔드 불필요 |
| **Secret 스캔 (Gitleaks)**      | P2       | Phase 3 | ❌ 백엔드 불필요 |

---
