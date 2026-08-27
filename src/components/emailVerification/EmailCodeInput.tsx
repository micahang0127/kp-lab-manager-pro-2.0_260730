import { useRef } from 'react'

import { EmailCodeDigitInput } from './EmailCodeDigitInput'

// ─── Types ────────────────────────────────────────────────────────────────────

interface EmailCodeInputProps {
  /** 인증번호 자릿수 (기본값 6) */
  length?: number
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  /** 인증번호 확인(최종 검증) 실패 시 true — 모든 칸을 빨간색 테두리/배경으로 강조한다 */
  error?: boolean
  /** 각 입력칸의 aria-label 접두어 (예: '인증번호' → '인증번호 1번째 자리') */
  ariaLabel: string
}

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * 이메일 인증번호를 한 자리씩 입력하는 박스형 UI. 숫자를 입력하면 자동으로 다음 칸으로,
 * 빈 칸에서 Backspace를 누르면 이전 칸으로 포커스가 이동한다.
 * value/onChange는 전체 인증번호 문자열(예: '123456') 기준으로 상위 컴포넌트와 동기화된다.
 * 값이 채워진 칸은 노란색 강조 테두리 + 옅은 배경으로, 포커스된 칸은 배경 없이 테두리만
 * 강조 표시한다 (Figma 디자인 기준).
 */
export function EmailCodeInput({
  length = 6,
  value,
  onChange,
  disabled = false,
  error = false,
  ariaLabel,
}: EmailCodeInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const digits = Array.from({ length }, (_, index) => value[index] ?? '')

  const focusInput = (index: number) => {
    inputRefs.current[index]?.focus()
  }

  const handleChange = (index: number, rawInput: string) => {
    const digit = rawInput.replace(/\D/g, '').slice(-1)
    // 숫자가 아닌 문자만 입력된 경우(digit이 비었지만 지우기는 아닌 경우)는 무시한다
    if (!digit && rawInput !== '') return

    const nextDigits = [...digits]
    nextDigits[index] = digit
    onChange(nextDigits.join('').slice(0, length))

    if (digit && index < length - 1) {
      focusInput(index + 1)
    }
  }

  // 이메일로 받은 인증번호 전체를 복사해 붙여넣는 경우를 지원한다 — 붙여넣은 위치(index)부터
  // 숫자만 추출해 채우고, 마지막으로 채워진 다음 칸(끝까지 채웠다면 마지막 칸)으로 포커스를 옮긴다
  const handlePaste = (index: number, pastedText: string) => {
    const pastedDigits = pastedText.replace(/\D/g, '')
    if (!pastedDigits) return

    const nextDigits = [...digits]
    for (let i = 0; i < pastedDigits.length && index + i < length; i += 1) {
      nextDigits[index + i] = pastedDigits[i]
    }
    onChange(nextDigits.join('').slice(0, length))
    focusInput(Math.min(index + pastedDigits.length, length - 1))
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Backspace' || digits[index]) return
    if (index === 0) return

    e.preventDefault()
    const nextDigits = [...digits]
    nextDigits[index - 1] = ''
    onChange(nextDigits.join(''))
    focusInput(index - 1)
  }

  return (
    <div role="group" aria-label={ariaLabel} className="flex w-full items-start gap-1">
      {digits.map((digit, index) => (
        <EmailCodeDigitInput
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el
          }}
          ariaLabel={`${ariaLabel} ${index + 1}번째 자리`}
          disabled={disabled}
          error={error}
          value={digit}
          onChange={(rawInput) => handleChange(index, rawInput)}
          onPaste={(pastedText) => handlePaste(index, pastedText)}
          onKeyDown={(e) => handleKeyDown(index, e)}
        />
      ))}
    </div>
  )
}
