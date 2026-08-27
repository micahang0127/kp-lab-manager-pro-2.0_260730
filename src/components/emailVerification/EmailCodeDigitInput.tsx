import { forwardRef } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface EmailCodeDigitInputProps {
  value: string
  /** 입력 이벤트의 원본 값을 그대로 전달한다 — 숫자만 허용하는 필터링은 상위(EmailCodeInput)가 처리 */
  onChange: (rawValue: string) => void
  /** 붙여넣기(Ctrl+V)된 원본 텍스트를 그대로 전달한다 — 이메일로 받은 인증번호 전체를
   *  복사해 붙여넣는 경우를 지원하기 위함이며, 자릿수 분배는 상위(EmailCodeInput)가 처리 */
  onPaste: (pastedText: string) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
  disabled?: boolean
  /** 인증번호 확인(최종 검증) 실패 시 true — 노란색 강조 대신 빨간색 테두리/배경으로 표시한다 */
  error?: boolean
  /** 이 칸의 접근성 라벨 (예: '인증번호 1번째 자리') */
  ariaLabel: string
}

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * 인증번호 한 자리를 입력받는 단일 입력칸.
 * 값이 채워지면 노란색 강조 테두리 + 옅은 배경으로, 비어있으면 회색 테두리로 표시된다.
 * 인증번호 확인이 실패한 상태(`error`)라면 값 유무와 관계없이 빨간색 테두리 + 옅은 빨간
 * 배경으로 표시된다 (Figma 디자인 기준). 포커스 이동은 상위 컴포넌트(EmailCodeInput)가
 * ref로 제어하므로 forwardRef로 input DOM 노드를 그대로 전달한다.
 */
export const EmailCodeDigitInput = forwardRef<HTMLInputElement, EmailCodeDigitInputProps>(
  function EmailCodeDigitInput(
    { value, onChange, onPaste, onKeyDown, disabled = false, error = false, ariaLabel },
    ref
  ) {
    return (
      <input
        ref={ref}
        aria-label={ariaLabel}
        type="text"
        inputMode="numeric"
        maxLength={1}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onPaste={(e) => {
          e.preventDefault()
          onPaste(e.clipboardData.getData('text'))
        }}
        onKeyDown={onKeyDown}
        className={`h-10 w-[35px] rounded border text-center text-2xl font-bold text-[#1a1a17] focus:border-[#fec741] focus:bg-white focus:outline-none disabled:border-[#c9c9c4] disabled:bg-gray-100 disabled:text-gray-400 ${
          error
            ? 'border-[#d44038] bg-[#d44038]/20'
            : value
              ? 'border-[#fec741] bg-[#fec741]/20'
              : 'border-[#c9c9c4] bg-white'
        }`}
      />
    )
  }
)
