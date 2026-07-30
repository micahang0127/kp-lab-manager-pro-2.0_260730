# src/components/ketcher — Ketcher 분자 구조 편집기

## Ketcher 개요

화학 구조(분자식)를 SMILES 형식으로 편집하는 웹 기반 에디터.
**번들 크기가 매우 크고 jsdom 환경에서 렌더링이 불가능**하므로 특수 처리가 필요합니다.

## 사용 규칙

### ✅ 반드시 `KetcherLoader` 경유

```typescript
import { KetcherLoader } from '../components/ketcher/KetcherLoader'

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <KetcherLoader
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      onConfirm={(smiles: string) => {
        // SMILES 문자열로 사용자가 그린 구조 수신
      }}
      initialSmiles="C1=CC=CC=C1"  // 선택적 초기 구조
    />
  )
}
```

### ❌ 직접 import 금지

```typescript
// 절대 금지 — 메인 번들이 수십 MB 증가
import { KetcherModal } from '../components/ketcher/KetcherModal'
import { Ketcher } from 'ketcher-react'
```

`KetcherLoader`는 내부적으로 `React.lazy` + `Suspense`를 사용해 Ketcher를 별도 청크로 분리 로드합니다.

## SMILES 데이터 흐름

1. 사용자가 에디터에서 분자 구조를 그림
2. "확인" 버튼 클릭 → 내부에서 `ketcher.getSmiles()` 호출
3. `onConfirm(smiles)` 콜백으로 부모에 문자열 전달
4. 초기 구조 표시: `initialSmiles` prop → 내부에서 `ketcher.setMolecule(smiles)` 호출

## 테스트 주의사항

**Ketcher는 jsdom에서 WebGL 렌더링 불가** → 테스트에서 반드시 모킹:

```typescript
import { vi } from 'vitest'

vi.mock('../components/ketcher/KetcherLoader', () => ({
  KetcherLoader: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="ketcher-mock" /> : null,
}))
```

## 환경변수 · 빌드

- `VITE_KETCHER_ASSETS_URL` — Ketcher 정적 에셋 경로 (기본값: `/assets/ketcher`)
- `pnpm build` 시 `scripts/copy-ketcher-assets.js`가 에셋을 `dist/assets/ketcher`로 복사
- `vite.config.ts`에 `manualChunks`로 Ketcher 라이브러리가 별도 청크 분리됨

## 새 Ketcher 관련 컴포넌트 추가 시

- [ ] `KetcherLoader`를 통해 사용하는지 확인
- [ ] 테스트에서 `vi.mock('../components/ketcher/KetcherLoader')` 추가
- [ ] 번들 크기에 영향을 주지 않는지 `pnpm build` 후 청크 사이즈 확인
