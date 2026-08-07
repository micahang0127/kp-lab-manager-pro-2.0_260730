import type { FormInputMessageColor } from '../form'
import { FormInput } from '../form'
import { AddressSearchButton } from './AddressSearchButton'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AddressFieldProps {
  id: string
  label: string
  required?: boolean
  /** true면 주소검색 버튼을 숨기고 상세주소도 잠근다 (조회 전용 화면 용도) */
  disabled?: boolean
  /** 주소검색으로만 채워지는 대표 주소 (직접 수정 불가) */
  address: string
  onAddressChange: (address: string) => void
  /** 사용자가 직접 입력하는 상세주소 (동/호수 등) */
  addressDetail: string
  onAddressDetailChange: (addressDetail: string) => void
  /** 하단에 표시할 안내/에러 문구. 없으면 렌더링하지 않는다 */
  message?: string
  /** message 색상 (기본값 'red') */
  messageColor?: FormInputMessageColor
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const DETAIL_INPUT_CLASS_NAME =
  'w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none disabled:cursor-default disabled:bg-gray-100 disabled:text-gray-500'

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * 주소검색(Daum 우편번호) 버튼이 붙은 대표 주소 입력 + 상세주소 입력으로 구성된 주소 입력 필드.
 * 대표 주소는 주소검색 버튼을 통해서만 채워지며 직접 수정할 수 없고, 상세주소는 별도 라벨 없이
 * placeholder와 aria-label("상세주소")로만 안내한다.
 */
export function AddressField({
  id,
  label,
  required = false,
  disabled = false,
  address,
  onAddressChange,
  addressDetail,
  onAddressDetailChange,
  message,
  messageColor,
}: AddressFieldProps) {
  return (
    <div className="space-y-2">
      <FormInput
        id={id}
        label={label}
        required={required}
        disabled
        value={address}
        onChange={(e) => onAddressChange(e.target.value)}
        message={message}
        messageColor={messageColor}
        addon={disabled ? undefined : <AddressSearchButton onComplete={onAddressChange} />}
      />
      <input
        type="text"
        aria-label="상세주소"
        placeholder="상세주소를 입력해주세요."
        disabled={disabled}
        maxLength={100}
        value={addressDetail}
        onChange={(e) => onAddressDetailChange(e.target.value)}
        className={DETAIL_INPUT_CLASS_NAME}
      />
    </div>
  )
}
