# AWS S3 + CloudFront 배포 가이드 (예정)

이 문서는 Ketcher를 포함한 LAB-MANAGER-FRONT를 AWS S3/CloudFront/WAF로 배포할 때 필요한 체크리스트를 제시합니다.

---

## 📋 배포 전 준비

### 1. 빌드 확인

```bash
# 의존성 설치
pnpm install

# 프로덕션 빌드
pnpm build

# 결과물 확인
ls -la dist/
# dist/assets/ketcher/ 폴더가 생성되어야 함
```

### 2. 환경 변수 설정 (.env.production)

```env
VITE_API_BASE_URL=https://your-api-domain.com
VITE_KETCHER_ASSETS_URL=/assets/ketcher
VITE_PORTONE_STORE_ID=your-store-id
VITE_PORTONE_CHANNEL_KEY=your-channel-key
```

---

## 🚀 AWS 배포 단계

### Step 1: S3 버킷 생성 및 설정

```bash
# S3 버킷 정책 (public-read 허용)
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

### Step 2: CloudFront 배포 설정

#### **캐싱 전략**

| 경로                | TTL                | 목적                     |
| ------------------- | ------------------ | ------------------------ |
| `/assets/ketcher/*` | 31,536,000초 (1년) | Ketcher 에셋 (변경 불가) |
| `/assets/*`         | 31,536,000초 (1년) | 애플리케이션 에셋        |
| `/*.html`           | 3,600초 (1시간)    | HTML 파일 (항상 최신)    |
| `/`                 | 3,600초 (1시간)    | 인덱스 (항상 최신)       |

#### **CloudFront 설정 예시**

```yaml
Origin:
  S3 Origin: your-bucket.s3.amazonaws.com
  Origin Access Identity: 활성화

Behaviors:
  - PathPattern: /assets/ketcher/*
    TTL: 31536000 (1년)
    Compress: true
    CachePolicyId: 658327ea-f89d-4fab-a63d-7e88639e58f6

  - PathPattern: /assets/*
    TTL: 31536000
    Compress: true

  - PathPattern: /*.html
    TTL: 3600
    Compress: true
    CachePolicyId: 4135ea3d-c35d-46eb-81d7-reeSJmXQQpQ

  - Default:
    Compress: true
    CachePolicyId: 4135ea3d-c35d-46eb-81d7-reeSJmXQQpQ

Viewer Protocol Policy: Redirect HTTP to HTTPS

GeoRestriction: None (또는 필요에 따라 설정)
```

---

## 🔒 WAF 설정 (중요)

Ketcher는 복잡한 화학 구조식 데이터(SMILES, MOL 파일)를 다룹니다. WAF 차단을 피하려면:

### AWS WAF 예외 규칙 설정

#### **1. 페이로드 크기 제한**

```
Body Size: 최소 10MB (화학 구조식 전송용)
```

#### **2. XSS/SQL Injection 필터 예외**

```
특수 기호 화이트리스트:
- SMILES 문자: C, N, O, S, P, B, F, Cl, Br, I
- 구조식 기호: =, #, (, ), [, ], /, \, @, +, -
- Mol 파일 형식: V2000, V3000 등

Rule Exceptions:
- AWS Managed Rules: Core Rule Set (AWSManagedRulesCommonRuleSet)
  예외 조건:
    - Request Path: /api/chemistry/* (또는 구조식 처리 엔드포인트)
    - Body Contains: SMILES Pattern
```

#### **3. 권장 WAF 규칙 구성**

```
우선순위 1: IP 레이트 제한 (DDoS 방지)
- 분당 요청 수 제한: 2000/분

우선순위 2: Geo 차단 (필요 시)
- 알려진 악의적 국가 차단

우선순위 3: AWS Managed Rules (예외 포함)
- Core Rule Set (예외: 화학 데이터 특수 기호)
- Known Bad Inputs
- SQL Injection Protection

우선순위 4: Custom Rule
- Bot 탐지 (선택사항)
```

---

## 📊 성능 최적화

### 1. 압축 설정

CloudFront에서 **Gzip/Brotli 압축 활성화**:

```
Settings:
- Compress Objects Automatically: ✓ 활성화
- Compress with the following: Gzip, Brotli
```

### 2. 버전 관리 및 캐시 무효화

빌드마다 새 버전 배포 시:

```bash
# 방법 1: 파일명에 해시 포함 (권장)
dist/assets/app.a3d4c5f6.js

# 방법 2: CloudFront 캐시 무효화
aws cloudfront create-invalidation \
  --distribution-id YOUR_DIST_ID \
  --paths "/*"
```

### 3. Ketcher 라이브러리 번들 크기

```bash
# 빌드 후 번들 크기 확인
npm run build

# 예상 크기:
# - ketcher-lib chunk: ~2-3MB (minified)
# - 압축 후: ~700-900KB
```

---

## ✅ 배포 체크리스트

- [ ] 로컬 빌드 성공 (`pnpm build`)
- [ ] `dist/assets/ketcher/` 폴더 존재 확인
- [ ] S3 버킷 생성 및 정책 설정
- [ ] CloudFront 배포 생성
- [ ] CloudFront 캐싱 규칙 설정 완료
- [ ] WAF 규칙 설정 (특히 화학 데이터 예외)
- [ ] `.env.production` 환경 변수 설정
- [ ] HTTPS 인증서 설정 (ACM)
- [ ] 도메인 DNS 설정 (Route 53 또는 외부)
- [ ] 성능 테스트 (CloudFront 캐시 확인)
- [ ] 보안 헤더 추가 (CSP, X-Frame-Options 등)

---

## 🔍 배포 후 검증

### 1. 에셋 로딩 확인

```bash
# Ketcher 에셋이 올바르게 로딩되는지 확인
curl -I https://your-domain.com/assets/ketcher/icons.svg
# HTTP/2 200 응답 확인
```

### 2. CloudFront 캐시 확인

```bash
# 응답 헤더에서 X-Cache 확인
curl -I https://your-domain.com/assets/ketcher/icons.svg | grep -i x-cache
# 결과: X-Cache: Hit from cloudfront (캐시 적중)
```

### 3. SMILES 데이터 전송 테스트

```javascript
// 브라우저 콘솔에서 테스트
// 1. 화학 구조 편집 모달 열기
// 2. 구조식 그리기
// 3. SMILES 값 도출 확인
// 4. 네트워크 탭에서 요청/응답 확인
```

---

## 🚨 트러블슈팅

### Issue 1: Ketcher 에셋 404

**원인**: `dist/assets/ketcher/` 폴더가 생성되지 않음

**해결방법**:

```bash
# 1. 스크립트 실행 확인
node scripts/copy-ketcher-assets.js

# 2. S3에 에셋 업로드
aws s3 cp dist/assets/ketcher/ s3://your-bucket/assets/ketcher/ --recursive
```

### Issue 2: WAF 차단

**증상**: SMILES 전송 시 403 Forbidden

**해결방법**:

```
1. CloudWatch Logs에서 WAF 차단 로그 확인
2. 차단된 요청의 특징 분석
3. WAF 규칙에 예외 추가
   - 특정 문자 화이트리스트
   - 특정 경로 예외
```

### Issue 3: 느린 초기 로딩

**원인**: Ketcher 라이브러리 청크가 크므로 첫 로드 시간 증가

**해결방법**:

```
1. CloudFront Gzip/Brotli 압축 확인
2. 초기 페이지 로드 시 Ketcher 모달을 lazy load로 유지
3. Service Worker 캐싱 고려 (선택사항)
```

---

## 📚 참고 자료

- [AWS CloudFront 배포 문서](https://docs.aws.amazon.com/cloudfront/latest/developerguide/)
- [AWS WAF 설정](https://docs.aws.amazon.com/waf/latest/developerguide/)
- [Ketcher 배포 가이드](https://ketcher.readthedocs.io/)
