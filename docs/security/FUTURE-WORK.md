# 🔐 보안 추후 진행 항목

_마지막 업데이트: 2026-03-23_

---

## Phase 2️⃣ - 인증/API 보안

### 2-1. 토큰 저장 방식 변경 ⭐ **가장 중요**

**현재:** localStorage에 JWT 저장 (XSS 탈취 위험)
**목표:** httpOnly Cookie + 메모리 조합

| 구분          | 현재         | 목표            |
| ------------- | ------------ | --------------- |
| Access Token  | localStorage | 메모리 변수     |
| Refresh Token | 없음         | httpOnly Cookie |
| XSS 위험      | 높음         | 낮음            |

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
