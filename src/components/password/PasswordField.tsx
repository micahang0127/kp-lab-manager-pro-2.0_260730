import clearCircleIcon from '../../assets/icons/register/clear-circle.svg'
import { HANGUL_INPUT_MESSAGE, sanitizePasswordInput } from '../../utils/rules/validationRules'
import { useHangulGuardedInput } from '../../utils/useHangulGuardedInput'
import { ErrorMessage } from '../error/ErrorMessage'
import { RequiredMark } from '../form'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PasswordFieldProps {
  id: string
  label: string
  value: string
  /** 한글·공백 등 허용되지 않는 문자가 제거된 값이 전달된다 */
  onChange: (value: string) => void
  placeholder?: string
  /** 형식 불일치·비밀번호 불일치 등 상위에서 판단한 에러 메시지. 한글 입력 시도가 감지되면
   *  이 메시지 대신 한글 안내 문구를 우선 표시한다 */
  error?: string | null
  /** 에러가 없을 때 항상 노출할 안내 문구(예: 비밀번호 형식 규칙). type=password 상태에서는
   *  브라우저/OS가 보안상 IME 조합 자체를 막아 한글 키보드로 입력해도 조합 없이 영문이 그대로
   *  커밋되는 경우가 있어(한글 입력 시도 자체가 감지되지 않음), 실시간 감지 문구만으로는 규칙을
   *  안내하기 부족하다. 이 문구는 그 보완으로 항상 보여준다 */
  hint?: string
  /** true면 라벨 옆에 필수 입력 표시(*)를 렌더링한다 (기본값 false). label 문자열 자체에
   *  "*"를 이미 포함시킨 화면이라면 사용하지 않는다 */
  required?: boolean
}

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * 비밀번호 입력칸 공통 컴포넌트 — 항상 마스킹(type=password)되며, 값이 있을 때만
 * 지우기(x) 아이콘을 보여준다. 한글(한글 키보드) 입력은 허용되지 않으므로 useHangulGuardedInput을
 * 통해 조합(IME) 중에는 값을 건드리지 않고, 조합이 끝난 시점에만 한글을 제거해 반영하며 전용
 * 안내 문구를 보여준다. 그 외 형식/일치 오류는 error prop으로 전달받아 표시한다.
 * 로그인·회원가입 등 비밀번호를 입력받는 모든 화면에서 재사용한다.
 */
export function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder = '비밀번호를 입력해 주세요',
  error,
  hint,
  required = false,
}: PasswordFieldProps) {
  const { hasHangulInput, handleChange, handleCompositionStart, handleCompositionEnd } =
    useHangulGuardedInput({ sanitize: sanitizePasswordInput, onChange })

  const displayError = hasHangulInput ? HANGUL_INPUT_MESSAGE : error
  const hasError = Boolean(displayError)

  return (
    <div className="flex w-full flex-col items-start gap-1">
      <div className="flex items-center">
        <label htmlFor={id} className="text-xs font-medium text-[#6b6b66]">
          {label}
        </label>
        {required && <RequiredMark />}
      </div>
      <div
        className={`flex h-10 w-full items-center gap-2 rounded border bg-white px-3 ${
          hasError ? 'border-[#d44038]' : 'border-[#c9c9c4]'
        }`}
      >
        <input
          id={id}
          type="password"
          value={value}
          onChange={handleChange}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          placeholder={placeholder}
          className="flex-1 text-xs text-[#1a1a17] outline-none"
        />
        {value && (
          <button
            type="button"
            aria-label="입력값 지우기"
            onClick={() => onChange('')}
            className="flex size-4 shrink-0 items-center justify-center"
          >
            <img src={clearCircleIcon} alt="" aria-hidden className="size-3" />
          </button>
        )}
      </div>
      {hasError ? (
        <ErrorMessage message={displayError} />
      ) : (
        hint && <p className="text-[10px] leading-[14px] text-[#6b6b66] opacity-50">{hint}</p>
      )}
    </div>
  )
}
