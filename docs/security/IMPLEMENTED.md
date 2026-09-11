# 🔒 보안 구현 현황

_마지막 업데이트: 2026-09-07_

---

## ✅ 구현 완료 항목

### 1️⃣ 인증/토큰 보안

| 항목                                                                                                                                      | 파일                                       |
| ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| JWT 형식 검증 (3부분 구조)                                                                                                                | `src/utils/requireAuth.ts`                 |
| 토큰 만료 시간 검증 (exp claim)                                                                                                           | `src/utils/requireAuth.ts`                 |
| 공백 문자열 토큰 차단                                                                                                                     | `src/utils/requireAuth.ts`                 |
| 유효하지 않은 토큰 자동 제거                                                                                                              | `src/utils/requireAuth.ts` (`isAuthValid`) |
| sessionStorage 사용 (localStorage 대비 XSS 노출 시간 축소)                                                                                | `src/utils/token.ts`                       |
| sessionStorage 접근 실패(SecurityError 등) 방어                                                                                           | `src/utils/token.ts`                       |
| 라우트 가드 (`requireAuth`, `redirectIfAuthenticated`) — 두 가드가 동일한 토큰 유효성 기준을 공유해 `/login`↔`/main` 리다이렉트 왕복 방지 | `src/routes/*`, `src/utils/requireAuth.ts` |

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

파일: `index.html`

> `X-Frame-Options: DENY`는 스펙상 HTTP 응답 헤더로만 동작하며 `<meta http-equiv>`로는
> 브라우저가 인식하지 않는다(클릭재킹/iframe 임베딩 방지 효과 없음). 이전 버전에는
> meta 태그로 추가되어 있었으나 실효가 없어 제거했다 — 실제 적용은 아래 "미구현 항목"의
> "HSTS/보안 헤더" 작업(CloudFront 등 서버 응답 헤더, `FUTURE-WORK.md` 참고)으로만 가능하다.

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

| 항목                                                                 | 우선순위 | 단계    | 백엔드 필요      |
| -------------------------------------------------------------------- | -------- | ------- | ---------------- |
| **XSS: sessionStorage 토큰 탈취** (localStorage는 아님 — 위 표 참고) | P0       | Phase 2 | ✅ 필수          |
| **Refresh Token**                                                    | P0       | Phase 2 | ✅ 필수          |
| **Silent Refresh**                                                   | P0       | Phase 2 | ✅ 필수          |
| **CORS 정책**                                                        | P0       | Phase 2 | ✅ 필수          |
| **CSP 헤더**                                                         | P1       | Phase 3 | ❌ 백엔드 불필요 |
| **HSTS/보안 헤더**                                                   | P1       | Phase 3 | ❌ 백엔드 불필요 |
| **Secret 스캔 (Gitleaks)**                                           | P2       | Phase 3 | ❌ 백엔드 불필요 |

---
