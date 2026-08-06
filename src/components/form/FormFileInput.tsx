import { useRef } from 'react'

import type { FormInputMessageColor } from './messageColor'
import { MESSAGE_COLOR_CLASS_NAME } from './messageColor'

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormFileInputProps {
  id: string
  label: string
  required?: boolean
  disabled?: boolean
  accept?: string
  file: File | null
  onChange: (file: File | null) => void
  /** 라벨 우측에 표시할 보조 안내 문구. 없으면 렌더링하지 않는다 */
  labelDescription?: string
  /** 하단에 표시할 안내/에러 문구. 없으면 렌더링하지 않는다 */
  message?: string
  /** message 색상 (기본값 'red') */
  messageColor?: FormInputMessageColor
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const DISPLAY_INPUT_CLASS_NAME =
  'flex-1 rounded border border-gray-300 px-3 py-2 text-sm text-gray-500 disabled:cursor-default disabled:bg-gray-100'

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * 라벨 + 파일 선택 버튼 + 선택된 파일명을 보여주는 비활성 input으로 구성된 공통 파일 업로드 컴포넌트.
 * 실제 파일은 숨겨진 input[type=file]로 받고(label과 연결되어 getByLabelText로 접근 가능),
 * 파일명을 보여주는 input은 항상 disabled 상태라 사용자가 직접 값을 수정할 수 없다.
 * disabled 시에는 삭제 버튼뿐 아니라 파일 선택 버튼도 렌더링하지 않아 조회 전용 화면에서는
 * 파일명만 보이고 조작 가능한 버튼이 전혀 노출되지 않는다.
 * FormInput과 동일한 message/messageColor 규칙을 사용하며, 실제 업로드 API 호출은 이 컴포넌트의 책임이 아니다.
 */
export function FormFileInput({
  id,
  label,
  required = false,
  disabled = false,
  accept,
  file,
  onChange,
  labelDescription,
  message,
  messageColor = 'red',
}: FormFileInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleClear = () => {
    onChange(null)
    // input[type=file]은 값을 지워도 DOM의 files는 그대로 유지되므로, 같은 파일을 다시 선택해도
    // change 이벤트가 발생하도록 실제 input의 값도 함께 초기화한다.
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
        </label>
        {labelDescription && <span className="text-xs text-gray-500">{labelDescription}</span>}
      </div>
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          id={id}
          type="file"
          // [NOTE] 파일 input에 네이티브 required를 걸면 브라우저(jsdom 포함)가 자체 constraint
          // validation으로 submit 이벤트 자체를 막아버려 상위 canSubmit 로직과 충돌할 수 있다.
          // 필수 여부는 상위 컴포넌트의 canSubmit에서 파일 첨부 여부로 직접 검증하므로
          // 여기서는 접근성 목적의 aria-required만 표시한다.
          aria-required={required}
          disabled={disabled}
          accept={accept}
          className="hidden"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
        <input
          type="text"
          disabled
          readOnly
          aria-hidden="true"
          tabIndex={-1}
          value={file ? file.name : '선택된 파일이 없습니다.'}
          className={DISPLAY_INPUT_CLASS_NAME}
        />
        {file && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="첨부 파일 삭제"
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            ✕
          </button>
        )}
        {!disabled && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            파일 선택
          </button>
        )}
      </div>
      {message && (
        <p className={`mt-1 text-xs ${MESSAGE_COLOR_CLASS_NAME[messageColor]}`}>{message}</p>
      )}
    </div>
  )
}
