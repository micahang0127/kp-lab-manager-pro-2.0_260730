---
name: new-component
description: 새 React 컴포넌트와 테스트 파일을 생성합니다
---

새 재사용 컴포넌트와 그 테스트를 생성합니다.

## 입력

$ARGUMENTS — `<ComponentName> [위치]`
예시:

- `Button` → `src/components/Button.tsx`
- `Button components/ui` → `src/components/ui/Button.tsx`
- `Card components/layout` → `src/components/layout/Card.tsx`

## 절차

1. **위치 결정**
   - 인자에 위치가 있으면 그대로 사용
   - 없으면 기본값: `src/components/`

2. **두 파일 생성**

### 파일 1: `src/{위치}/{ComponentName}.tsx`

```typescript
// ─── Types ───────────────────────────────────────────────────────────────────

interface {ComponentName}Props {
  label: string
  onClick?: () => void
  disabled?: boolean
}

// ─── Component ─────────────────────────────────────────────────────────────

export function {ComponentName}({ label, onClick, disabled = false }: {ComponentName}Props) {
  return (
    <button
      type="button"
      className="rounded bg-blue-500 px-4 py-2 text-white disabled:opacity-50"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
    >
      {label}
    </button>
  )
}
```

### 파일 2: `src/{위치}/{ComponentName}.test.tsx`

```typescript
import { describe, expect, it, vi } from 'vitest'
import userEvent from '@testing-library/user-event'

import { render, screen } from '../test/test-utils'

import { {ComponentName} } from './{ComponentName}'

describe('{ComponentName}', () => {
  it('label을 렌더링한다', () => {
    render(<{ComponentName} label="확인" />)
    expect(screen.getByRole('button', { name: '확인' })).toBeInTheDocument()
  })

  it('클릭 시 onClick 핸들러를 호출한다', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()

    render(<{ComponentName} label="확인" onClick={handleClick} />)
    await user.click(screen.getByRole('button', { name: '확인' }))

    expect(handleClick).toHaveBeenCalledOnce()
  })

  it('disabled 상태일 때 클릭되지 않는다', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()

    render(<{ComponentName} label="확인" onClick={handleClick} disabled />)
    await user.click(screen.getByRole('button', { name: '확인' }))

    expect(handleClick).not.toHaveBeenCalled()
  })
})
```

> ⚠️ 위 테스트의 import 경로 `'../test/test-utils'`는 컴포넌트 위치에 따라 조정 필요.
> 예: `src/components/ui/Button.tsx` → `'../../test/test-utils'`

3. **사용자 안내**

   ```
   ✅ 생성 완료:
   - src/{위치}/{ComponentName}.tsx
   - src/{위치}/{ComponentName}.test.tsx

   다음 단계: 실제 props/로직에 맞게 컴포넌트 수정
   ```

## 체크리스트

- [ ] PascalCase 파일명
- [ ] named export (default export 금지)
- [ ] Props 인터페이스 별도 정의
- [ ] 한국어 aria-label / UI 텍스트
- [ ] Tailwind CSS 클래스
- [ ] 커스텀 `render` (test-utils.tsx) 사용
