import type { FormInputMessageColor } from './messageColor'
import { MESSAGE_COLOR_CLASS_NAME } from './messageColor'

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormInputProps {
  id: string
  label: string
  type?: React.HTMLInputTypeAttribute
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  required?: boolean
  disabled?: boolean
  maxLength?: number
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
  /** input 하단에 표시할 안내/에러 문구. 없으면 렌더링하지 않는다 */
  message?: string
  /** message 색상 (기본값 'red') */
  messageColor?: FormInputMessageColor
  /** 기본 input 스타일에 덧붙일 클래스 (예: OTP 입력의 text-center font-mono tracking-widest) */
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
 */
export function FormInput({
  id,
  label,
  type = 'text',
  value,
  onChange,
  required = false,
  disabled = false,
  maxLength,
  inputMode,
  message,
  messageColor = 'red',
  inputClassName,
  addon,
}: FormInputProps) {
  const inputElement = (
    <input
      id={id}
      type={type}
      required={required}
      disabled={disabled}
      maxLength={maxLength}
      inputMode={inputMode}
      value={value}
      onChange={onChange}
      className={inputClassName ? `${INPUT_CLASS_NAME} ${inputClassName}` : INPUT_CLASS_NAME}
    />
  )

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>
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
}
