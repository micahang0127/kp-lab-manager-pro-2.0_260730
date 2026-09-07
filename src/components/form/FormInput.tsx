import { forwardRef } from 'react'

import type { FormInputMessageColor } from './messageColor'
import { MESSAGE_COLOR_CLASS_NAME } from './messageColor'
import { RequiredMark } from './RequiredMark'

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormInputProps {
  id: string
  label: string
  type?: React.HTMLInputTypeAttribute
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  /** 한글(IME) 조합 시작 시 호출 (useHangulGuardedInput과 함께 쓰기 위함) */
  onCompositionStart?: () => void
  /** 한글(IME) 조합 종료 시 호출 (useHangulGuardedInput과 함께 쓰기 위함) */
  onCompositionEnd?: (e: React.CompositionEvent<HTMLInputElement>) => void
  required?: boolean
  /** required가 true여도 라벨 옆 필수 표시(*)를 숨긴다 (예: 로그인 폼처럼 표시가 불필요한 경우) */
  hideRequiredMark?: boolean
  disabled?: boolean
  maxLength?: number
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
  /** 입력값이 없을 때 input에 표시할 안내 문구 */
  placeholder?: string
  /** input 하단에 표시할 안내/에러 문구. 없으면 렌더링하지 않는다 */
  message?: string
  /** message 색상 (기본값 'red') */
  messageColor?: FormInputMessageColor
  /** 기본 input 스타일에 덧붙일 클래스 (예: 이메일 인증번호 입력의 text-center font-mono tracking-widest) */
  inputClassName?: string
  /** input 옆에 표시할 보조 요소 (예: 사업장 소재지의 주소검색 버튼) */
  addon?: React.ReactNode
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const INPUT_CLASS_NAME =
  'w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none disabled:cursor-default disabled:bg-gray-100 disabled:text-gray-500'

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * 라벨 + input + 하단 안내/에러 메시지로 구성된 공통 폼 입력 컴포넌트.
 * disabled 시 잠금 스타일이 자동 적용되고, message가 주어지면 messageColor에 맞는 색상으로 하단에 표시된다.
 * required가 true이면 라벨 옆에 필수 표시(*)가 렌더링되며, hideRequiredMark로 표시만 숨길 수 있다
 * (input의 required 속성/접근성 의미는 그대로 유지됨).
 * ref를 전달하면 input DOM에 그대로 연결된다 (예: 마운트 시 자동 포커스가 필요한 경우 `ref.current?.focus()`).
 */
export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(function FormInput(
  {
    id,
    label,
    type = 'text',
    value,
    onChange,
    onCompositionStart,
    onCompositionEnd,
    required = false,
    hideRequiredMark = false,
    disabled = false,
    maxLength,
    inputMode,
    placeholder,
    message,
    messageColor = 'red',
    inputClassName,
    addon,
  },
  ref
) {
  const inputElement = (
    <input
      ref={ref}
      id={id}
      type={type}
      required={required}
      disabled={disabled}
      maxLength={maxLength}
      inputMode={inputMode}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onCompositionStart={onCompositionStart}
      onCompositionEnd={onCompositionEnd}
      className={inputClassName ? `${INPUT_CLASS_NAME} ${inputClassName}` : INPUT_CLASS_NAME}
    />
  )

  return (
    <div>
      <div className="mb-1 flex items-center">
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
        </label>
        {required && !hideRequiredMark && <RequiredMark />}
      </div>
      {addon ? (
        <div className="flex gap-2">
          <div className="flex-1">{inputElement}</div>
          {addon}
        </div>
      ) : (
        inputElement
      )}
      {message && (
        <p className={`mt-1 text-xs ${MESSAGE_COLOR_CLASS_NAME[messageColor]}`}>{message}</p>
      )}
    </div>
  )
})
