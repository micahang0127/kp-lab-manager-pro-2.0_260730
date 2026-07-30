---
name: new-store
description: 새 Zustand 전역 상태 스토어를 생성합니다
---

새 Zustand 스토어와 테스트 파일을 생성합니다.

## 입력

$ARGUMENTS — 스토어명 (camelCase, 예: `lab`, `modal`, `filter`)

## 절차

1. **이름 변환**
   - 입력: `lab`
   - 파일명: `labStore.ts`
   - 훅 이름: `useLabStore`
   - 인터페이스: `LabState`

2. **두 파일 생성**

### 파일 1: `src/stores/{이름}Store.ts`

```typescript
import { create } from 'zustand'

// ─── Types ───────────────────────────────────────────────────────────────────

interface {Name}State {
  // 상태 필드
  value: string

  // 액션
  setValue: (value: string) => void
  reset: () => void
}

// ─── Store ───────────────────────────────────────────────────────────────────

const initialValue = ''

export const use{Name}Store = create<{Name}State>((set) => ({
  value: initialValue,
  setValue: (value) => set({ value }),
  reset: () => set({ value: initialValue }),
}))
```

### 파일 2: `src/stores/{이름}Store.test.ts`

```typescript
import { beforeEach, describe, expect, it } from 'vitest'

import { use{Name}Store } from './{이름}Store'

describe('use{Name}Store', () => {
  beforeEach(() => {
    use{Name}Store.getState().reset()
  })

  it('초기값이 빈 문자열이다', () => {
    expect(use{Name}Store.getState().value).toBe('')
  })

  it('setValue로 값을 설정한다', () => {
    use{Name}Store.getState().setValue('테스트')
    expect(use{Name}Store.getState().value).toBe('테스트')
  })

  it('reset으로 초기값으로 되돌린다', () => {
    use{Name}Store.getState().setValue('테스트')
    use{Name}Store.getState().reset()
    expect(use{Name}Store.getState().value).toBe('')
  })
})
```

3. **사용자 안내**

   ```
   ✅ 생성 완료:
   - src/stores/{이름}Store.ts
   - src/stores/{이름}Store.test.ts

   주의: 서버 데이터(API 응답)는 이 스토어에 저장하지 마세요.
        서버 상태는 TanStack Query를 사용합니다.
   ```

## 체크리스트

- [ ] 파일명: `{이름}Store.ts` (camelCase + Store 접미사)
- [ ] 훅 이름: `use{Name}Store`
- [ ] sessionStorage 접근은 스토어 내부에서만
- [ ] 서버 데이터 저장 금지 (React Query 사용)
- [ ] 섹션 구분자 사용
