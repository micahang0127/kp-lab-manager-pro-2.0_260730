import type { VerifyIdentityResult } from '../../api/auth'
import { ErrorMessage } from '../error/ErrorMessage'
import { useIdentityVerification } from './useIdentityVerification'

// ─── Types ────────────────────────────────────────────────────────────────────

interface IdentityVerificationButtonProps {
  /** 버튼 및 안내 문구에 표시할 명칭 (예: '핸드폰인증', '본인인증') */
  label?: string
  /** 인증 성공(isVerified: true) 시 확인 결과를 전달받는 콜백.
   *  hasExistingAccount로 기존 가입 여부를, 신규 사용자면 마스킹된 개인정보를 담고 있다.
   *  두 번째 인자로 이번 인증에 사용한 identityVerificationId를 함께 전달한다 */
  onVerified?: (result: VerifyIdentityResult, identityVerificationId: string) => void
  /** 버튼에 적용할 클래스명 — 지정하지 않으면 기본 스타일을 사용한다 (화면별 디자인에 맞춰 오버라이드) */
  className?: string
}

// ─── Component ─────────────────────────────────────────────────────────────────

const DEFAULT_BUTTON_CLASSNAME =
  'w-full rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50'

/**
 * PortOne 본인인증 팝업을 호출해 휴대폰 번호를 확인하는 버튼.
 * 인증 진행 상태와 성공/실패 메시지를 함께 렌더링한다.
 */
export function IdentityVerificationButton({
  label = '핸드폰인증',
  onVerified,
  className = DEFAULT_BUTTON_CLASSNAME,
}: IdentityVerificationButtonProps) {
  const { status, error, verify } = useIdentityVerification(onVerified)
  const isPending = status === 'pending'

  return (
    <div>
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          void verify()
        }}
        className={className}
      >
        {isPending ? `${label} 중...` : label}
      </button>
      <ErrorMessage message={error} className="mt-2" />
      {status === 'success' && (
        <p className="mt-2 rounded border border-green-200 bg-green-50 p-3 text-sm text-green-600">
          {label}이 완료되었습니다.
        </p>
      )}
    </div>
  )
}
