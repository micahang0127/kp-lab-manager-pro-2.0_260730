import type { VerifiedCustomer } from '../../api/auth'
import { useIdentityVerification } from './useIdentityVerification'

// ─── Types ────────────────────────────────────────────────────────────────────

interface IdentityVerificationButtonProps {
  /** 버튼 및 안내 문구에 표시할 명칭 (예: '핸드폰인증', '본인인증') */
  label?: string
  /** 인증 성공 시 확인된 고객 정보(phoneNumber 포함)를 전달받는 콜백 */
  onVerified?: (customer: VerifiedCustomer) => void
}

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * PortOne 본인인증 팝업을 호출해 휴대폰 번호를 확인하는 버튼.
 * 인증 진행 상태와 성공/실패 메시지를 함께 렌더링한다.
 */
export function IdentityVerificationButton({
  label = '핸드폰인증',
  onVerified,
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
        className="w-full rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
      >
        {isPending ? `${label} 중...` : label}
      </button>
      {error && (
        <ul
          role="alert"
          className="mt-2 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-600"
        >
          <li>{error}</li>
        </ul>
      )}
      {status === 'success' && (
        <p className="mt-2 rounded border border-green-200 bg-green-50 p-3 text-sm text-green-600">
          {label}이 완료되었습니다.
        </p>
      )}
    </div>
  )
}
