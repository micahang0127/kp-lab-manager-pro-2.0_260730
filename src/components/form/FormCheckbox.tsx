// ─── Types ────────────────────────────────────────────────────────────────────

interface FormCheckboxProps {
  id: string
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  /** label에 적용할 클래스 (기본값은 일반 항목용). 전체 동의처럼 강조 표시가 필요한 경우 지정 */
  labelClassName?: string
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const CHECKBOX_CLASS_NAME = 'h-4 w-4 rounded border-gray-300'
const DEFAULT_LABEL_CLASS_NAME = 'text-sm text-gray-700'

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * 체크박스 + 라벨로 구성된 공통 체크박스 컴포넌트.
 * 약관 동의 항목처럼 프로젝트 전반에서 반복되는 체크박스 UI를 통일하기 위해 사용한다.
 * "전체 동의"처럼 라벨을 강조해야 하는 경우 labelClassName으로 스타일만 덧입혀 재사용한다.
 */
export function FormCheckbox({
  id,
  label,
  checked,
  onChange,
  disabled = false,
  labelClassName = DEFAULT_LABEL_CLASS_NAME,
}: FormCheckboxProps) {
  return (
    <div className="flex items-center gap-2">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className={CHECKBOX_CLASS_NAME}
      />
      <label htmlFor={id} className={labelClassName}>
        {label}
      </label>
    </div>
  )
}
