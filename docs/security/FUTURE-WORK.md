# 🔐 보안 추후 진행 항목

_마지막 업데이트: 2026-09-07_

---

## Phase 2️⃣ - 인증/API 보안

### 2-1. 토큰 저장 방식 변경 ⭐ **가장 중요**

**현재:** sessionStorage에 JWT 저장 (`src/utils/token.ts`) — localStorage 대비 이미 완화된 상태다
(브라우저/탭 종료 시 자동 소멸, 다른 탭과 공유되지 않음). 다만 세션이 열려 있는 동안에는 여전히
동일 출처의 임의 JS(XSS)가 `sessionStorage.getItem`으로 직접 읽어갈 수 있어 근본적인 XSS 탈취
위험 자체는 남아 있다.
**목표:** httpOnly Cookie + 메모리 조합 (XSS로 실행되는 JS가 애초에 토큰 값에 접근할 수 없게 함)

| 구분          | 현재                                      | 목표            |
| ------------- | ----------------------------------------- | --------------- |
| Access Token  | sessionStorage (탭/브라우저 종료 시 소멸) | 메모리 변수     |
| Refresh Token | 없음                                      | httpOnly Cookie |
| XSS 위험      | 있음 (세션 유지 중 직접 접근 가능)        | 낮음            |

**참고**: 메모리 변수(예: 모듈 스코프 변수, 미persist Zustand)로만 바꾸는 것은 이 항목의 해결책이
되지 못한다 — XSS는 페이지와 동일한 JS 실행 컨텍스트에서 임의 코드를 실행하므로, 전역 변수나
store의 `getState()`도 sessionStorage와 마찬가지로 그대로 읽어갈 수 있다. 실질적으로 위험을
낮추려면 **토큰 자체를 JS가 접근 불가능한 httpOnly Cookie로 옮기는 것**이 유일한 방법이며, 이는
아래 백엔드 작업 없이는 프론트만으로 구현할 수 없다. 그때까지는 XSS 발생 자체를 막는 것
(`dangerouslySetInnerHTML` 미사용 — 현재 전 코드베이스에서 0건 확인됨, CSP 적용 등 Phase 3)이
현실적인 1차 방어선이다.

**백엔드 필요 사항:**

- POST `/auth/refresh` 엔드포인트 (새 Access Token 반환)
- 로그인 시 Refresh Token을 httpOnly Cookie로 설정
- 로그아웃 시 Refresh Token 무효화
- CORS: `credentials: true` 설정

---

### 2-2. CORS 정책 협의

**필요 설정:**

- `origin`: 프로덕션 도메인 (예: `https://yourdomain.com`)
- `credentials`: `true` (쿠키 포함)
- `methods`: GET, POST, PUT, DELETE, PATCH
- `allowedHeaders`: Content-Type, Authorization
- `maxAge`: 86400 (1일)

---

### 2-3. Silent Refresh 구현

**흐름:**

```
API 요청 → 401 응답
  → /auth/refresh 호출 (Refresh Token 자동 전송)
  → 새 Access Token 획득
  → 원래 요청 자동 재시도
  → 성공 응답
```

**백엔드 필요:**

- `/auth/refresh` 엔드포인트에서 새 Access Token 반환
- 갱신 실패 시 명확한 에러 응답

---

### 2-4. PortOne 보안 설정

**필수 (PortOne 대시보드):**

- 결제 도메인 화이트리스트 등록
- 생성된 결제 건만 자동 승인

---

## Phase 3️⃣ - AWS CloudFront 배포 설정

### 3-1. HTTP 보안 응답 헤더

| 헤더                        | 값                                             |
| --------------------------- | ---------------------------------------------- |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` |
| `X-Content-Type-Options`    | `nosniff`                                      |
| `X-Frame-Options`           | `DENY`                                         |
| `Referrer-Policy`           | `strict-origin-when-cross-origin`              |
| `Permissions-Policy`        | `camera=(), microphone=(), geolocation=()`     |

**설정:** CloudFront 응답 헤더 정책에 추가

---

### 3-2. Content-Security-Policy (CSP)

**정책:**

```
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
connect-src 'self' https://api.yourdomain.com https://api.iamport.kr https://cdn.portone.io;
frame-src 'none';
object-src 'none';
base-uri 'self';
form-action 'self'
```

**설정:** CloudFront 응답 헤더 정책에 추가

---

### 3-3. HTTPS / HSTS

**필수:**

- AWS ACM에서 SSL/TLS 인증서 발급
- CloudFront: "Redirect HTTP to HTTPS" 설정
- HSTS 헤더 추가 (위 3-1 참고)

---

### 3-4. 소프트웨어 최적화

**소스맵 비활성화 (프로덕션):**

```
build.sourcemap: false (프로덕션 환경)
```

---

### 3-5. Secret 스캔 (Gitleaks)

**GitHub Actions 워크플로우 추가:**

- 커밋 시 자동 스캔
- API 키, 비밀번호 등 감지 시 CI 실패

---

### 3-6. 의존성 자동 업데이트 (Dependabot)

**설정:**

- 매주 자동 보안 패치 PR 생성
- 리뷰 후 병합

---

## 🔗 체크리스트

### Phase 2 (백엔드 협의)

- [ ] 토큰 저장 방식 확정 (httpOnly Cookie + 메모리)
- [ ] `/auth/refresh` API 설계 완료
- [ ] CORS 정책 협의 완료
- [ ] Silent Refresh 구현
- [ ] 통합 테스트

### Phase 3 (AWS 배포)

- [ ] CloudFront 배포 생성
- [ ] ACM 인증서 설정
- [ ] 보안 응답 헤더 정책 추가
- [ ] CSP 정책 설정
- [ ] Gitleaks 워크플로우 추가
- [ ] Dependabot 설정

---
