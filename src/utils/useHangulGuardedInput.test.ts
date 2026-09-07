import { act, renderHook } from '@testing-library/react'
import type { ChangeEvent, CompositionEvent } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { useHangulGuardedInput } from './useHangulGuardedInput'

// ─── Helpers ───────────────────────────────────────────────────────────────────

function changeEvent(value: string): ChangeEvent<HTMLInputElement> {
  return { target: { value } } as ChangeEvent<HTMLInputElement>
}

function compositionEvent(value: string): CompositionEvent<HTMLInputElement> {
  return { currentTarget: { value } } as CompositionEvent<HTMLInputElement>
}

describe('useHangulGuardedInput', () => {
  it('초기 상태에서는 한글 입력 시도가 없다', () => {
    const { result } = renderHook(() => useHangulGuardedInput({ onChange: vi.fn() }))

    expect(result.current.hasHangulInput).toBe(false)
  })

  it('조합 없이(붙여넣기 등) 한글이 섞인 값이 들어오면 한글을 제거해 onChange로 전달하고 안내 상태를 켠다', () => {
    const handleChange = vi.fn()
    const { result } = renderHook(() => useHangulGuardedInput({ onChange: handleChange }))

    act(() => {
      result.current.handleChange(changeEvent('ab한글cd'))
    })

    expect(handleChange).toHaveBeenCalledWith('abcd')
    expect(result.current.hasHangulInput).toBe(true)
  })

  it('한글이 없는 값은 그대로 onChange로 전달하고 안내 상태를 켜지 않는다', () => {
    const handleChange = vi.fn()
    const { result } = renderHook(() => useHangulGuardedInput({ onChange: handleChange }))

    act(() => {
      result.current.handleChange(changeEvent('abcd1234'))
    })

    expect(handleChange).toHaveBeenCalledWith('abcd1234')
    expect(result.current.hasHangulInput).toBe(false)
  })

  it('조합이 시작된 것만으로는 안내 상태를 켜지 않는다 — 실제 값을 확인하기 전에는 한글 여부를 알 수 없다', () => {
    const handleChange = vi.fn()
    const { result } = renderHook(() => useHangulGuardedInput({ onChange: handleChange }))

    act(() => {
      result.current.handleCompositionStart()
    })

    expect(result.current.hasHangulInput).toBe(false)
    expect(handleChange).not.toHaveBeenCalled()
  })

  it('조합 이벤트가 발생해도 조합 중인 값에 한글이 없으면(영문 조합 등) 값을 그대로 반영한다', () => {
    const handleChange = vi.fn()
    const { result } = renderHook(() => useHangulGuardedInput({ onChange: handleChange }))

    act(() => {
      result.current.handleCompositionStart()
      result.current.handleChange(changeEvent('a'))
    })

    expect(handleChange).toHaveBeenCalledWith('a')
    expect(result.current.hasHangulInput).toBe(false)
  })

  it('한글 조합 중(onChange)에는 값을 반영하지 않는다 — IME 조합이 깨지는 것을 막기 위함', () => {
    const handleChange = vi.fn()
    const { result } = renderHook(() => useHangulGuardedInput({ onChange: handleChange }))

    act(() => {
      result.current.handleCompositionStart()
      result.current.handleChange(changeEvent('ㄱ'))
      result.current.handleChange(changeEvent('가'))
    })

    expect(handleChange).not.toHaveBeenCalled()
  })

  it('조합이 끝나면(onCompositionEnd) 최종 값에서 한글을 제거해 onChange로 전달한다', () => {
    const handleChange = vi.fn()
    const { result } = renderHook(() => useHangulGuardedInput({ onChange: handleChange }))

    act(() => {
      result.current.handleCompositionStart()
      result.current.handleChange(changeEvent('가'))
      result.current.handleCompositionEnd(compositionEvent('ab가'))
    })

    expect(handleChange).toHaveBeenCalledWith('ab')
    expect(result.current.hasHangulInput).toBe(true)
  })

  it('조합이 끝난 뒤에는 다시 정상적으로 onChange가 값을 반영한다', () => {
    const handleChange = vi.fn()
    const { result } = renderHook(() => useHangulGuardedInput({ onChange: handleChange }))

    act(() => {
      result.current.handleCompositionStart()
      result.current.handleCompositionEnd(compositionEvent('가'))
    })
    handleChange.mockClear()

    act(() => {
      result.current.handleChange(changeEvent('가ab'))
    })

    expect(handleChange).toHaveBeenCalledWith('ab')
  })

  it('조합 종료 후 값에 한글이 남아있지 않으면 안내 상태가 꺼진다', () => {
    const { result } = renderHook(() => useHangulGuardedInput({ onChange: vi.fn() }))

    act(() => {
      result.current.handleChange(changeEvent('한글'))
    })
    expect(result.current.hasHangulInput).toBe(true)

    act(() => {
      result.current.handleCompositionStart()
      result.current.handleCompositionEnd(compositionEvent('abcd'))
    })

    expect(result.current.hasHangulInput).toBe(false)
  })

  it('sanitize 옵션이 있으면 한글 제거 후 추가로 정제한 값을 전달한다', () => {
    const handleChange = vi.fn()
    const sanitize = (v: string) => v.replace(/\s/g, '')
    const { result } = renderHook(() => useHangulGuardedInput({ onChange: handleChange, sanitize }))

    act(() => {
      result.current.handleChange(changeEvent('ab 한글 cd'))
    })

    expect(handleChange).toHaveBeenCalledWith('abcd')
  })
})
