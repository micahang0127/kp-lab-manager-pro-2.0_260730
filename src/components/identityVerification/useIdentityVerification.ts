import * as PortOne from '@portone/browser-sdk/v2'
import { useState } from 'react'

import type { VerifiedCustomer } from '../../api/auth'
import { confirmIdentityVerification } from '../../api/auth'

// ─── Types ────────────────────────────────────────────────────────────────────

export type IdentityVerificationStatus = 'idle' | 'pending' | 'success' | 'error'

interface UseIdentityVerificationResult {
  status: IdentityVerificationStatus
  error: string | null
  verifiedCustomer: VerifiedCustomer | null
  verify: () => Promise<void>
}

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * PortOne 본인인증 SDK 팝업 호출 + 백엔드 확인(confirmIdentityVerification)을 캡슐화한 훅.
 * 회원가입의 "핸드폰인증" 등 휴대폰 번호 확인이 필요한 곳에서 재사용한다.
 *
 * @param onVerified 인증 성공 시 확인된 고객 정보(VerifiedCustomer, phoneNumber 포함)를 전달받는 콜백
 */
export function useIdentityVerification(
  onVerified?: (customer: VerifiedCustomer) => void
): UseIdentityVerificationResult {
  const [status, setStatus] = useState<IdentityVerificationStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [verifiedCustomer, setVerifiedCustomer] = useState<VerifiedCustomer | null>(null)

  const verify = async () => {
    setStatus('pending')
    setError(null)

    const identityVerificationId = `identity-verification-${crypto.randomUUID()}`

    const response = await PortOne.requestIdentityVerification({
      storeId: import.meta.env.VITE_PORTONE_STORE_ID ?? '',
      identityVerificationId,
      channelKey: import.meta.env.VITE_PORTONE_CHANNEL_KEY ?? '',
      popup: {
        center: true,
      },
    })

    if (response?.code !== undefined) {
      setError(response.message ?? '핸드폰인증에 실패했습니다.')
      setStatus('error')
      return
    }

    try {
      const res = await confirmIdentityVerification({ identityVerificationId })
      if (res.statusCode === 200) {
        setVerifiedCustomer(res.data.verifiedCustomer)
        setStatus('success')
        onVerified?.(res.data.verifiedCustomer)
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '핸드폰인증 확인 중 오류가 발생했습니다.'
      setError(errorMessage)
      setStatus('error')
    }
  }

  return { status, error, verifiedCustomer, verify }
}
