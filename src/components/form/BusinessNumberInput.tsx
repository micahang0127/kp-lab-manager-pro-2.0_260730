import { useRef } from 'react'

import type { FormInputMessageColor } from './messageColor'
import { MESSAGE_COLOR_CLASS_NAME } from './messageColor'
import { RequiredMark } from './RequiredMark'

// ─── Types ────────────────────────────────────────────────────────────────────

interface BusinessNumberInputProps {
  id: string
  label: string
  /** "000-00-00000" 형식(입력 중에는 하이픈 포함 일부 문자열)의 사업자등록번호 */
  value: string
  onChange: (value: string) => void
  required?: boolean
  disabled?: boolean
  /** 하단에 표시할 안내/에러 문구. 없으면 렌더링하지 않는다 */
  message?: string
  /** message 색상 (기본값 'red') */
  messageColor?: FormInputMessageColor
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SEGMENT_MAX_LENGTHS = [3, 2, 5] as const

const SEGMENT_INPUT_CLASS_NAME =
  'rounded border border-gray-300 px-2 py-2 text-center text-sm focus:border-indigo-500 focus:outline-none disabled:cursor-default disabled:bg-gray-100 disabled:text-gray-500'

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * 사업자등록번호를 3자리-2자리-5자리 세 개의 input으로 나누어 입력받는 컴포넌트.
 * 각 칸이 다 채워지면 다음 칸으로 자동 포커스 이동하며, 상위에는 "000-00-00000" 형식의
 * 하이픈 포함 문자열 하나로 합쳐서 전달한다.
 */
export function BusinessNumberInput({
  id,
  label,
  value,
  onChange,
  required = false,
  disabled = false,
  message,
  messageColor = 'red',
}: BusinessNumberInputProps) {
  const [seg1 = '', seg2 = '', seg3 = ''] = value.split('-')
  const secondRef = useRef<HTMLInputElement>(null)
  const thirdRef = useRef<HTMLInputElement>(null)

  const handleSegmentChange = (index: 0 | 1 | 2, raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, SEGMENT_MAX_LENGTHS[index])
    const segments: [string, string, string] = [seg1, seg2, seg3]
    segments[index] = digits

    const isAllEmpty = segments.every((segment) => segment.length === 0)
    onChange(isAllEmpty ? '' : segments.join('-'))

    if (digits.length === SEGMENT_MAX_LENGTHS[index]) {
      if (index === 0) secondRef.current?.focus()
      if (index === 1) thirdRef.current?.focus()
    }
  }

  return (
    <div>
      <span className="mb-1 block text-sm font-medium text-gray-700">
        {label}
        {required && <RequiredMark />}
      </span>
      <div className="flex items-center gap-2">
        <input
          id={id}
          aria-label={`${label} 앞 3자리`}
          type="text"
          inputMode="numeric"
          required={required}
          disabled={disabled}
          maxLength={SEGMENT_MAX_LENGTHS[0]}
          value={seg1}
          onChange={(e) => handleSegmentChange(0, e.target.value)}
          className={`w-16 ${SEGMENT_INPUT_CLASS_NAME}`}
        />
        <span aria-hidden="true" className="text-gray-400">
          -
        </span>
        <input
          ref={secondRef}
          aria-label={`${label} 중간 2자리`}
          type="text"
          inputMode="numeric"
          required={required}
          disabled={disabled}
          maxLength={SEGMENT_MAX_LENGTHS[1]}
          value={seg2}
          onChange={(e) => handleSegmentChange(1, e.target.value)}
          className={`w-12 ${SEGMENT_INPUT_CLASS_NAME}`}
        />
        <span aria-hidden="true" className="text-gray-400">
          -
        </span>
        <input
          ref={thirdRef}
          aria-label={`${label} 뒤 5자리`}
          type="text"
          inputMode="numeric"
          required={required}
          disabled={disabled}
          maxLength={SEGMENT_MAX_LENGTHS[2]}
          value={seg3}
          onChange={(e) => handleSegmentChange(2, e.target.value)}
          className={`w-20 ${SEGMENT_INPUT_CLASS_NAME}`}
        />
      </div>
      {message && (
        <p className={`mt-1 text-xs ${MESSAGE_COLOR_CLASS_NAME[messageColor]}`}>{message}</p>
      )}
    </div>
  )
}
