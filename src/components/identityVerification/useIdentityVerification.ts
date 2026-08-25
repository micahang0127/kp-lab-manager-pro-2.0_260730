import * as PortOne from '@portone/browser-sdk/v2'
import { useState } from 'react'

import type { VerifyIdentityResult } from '../../api/auth'
import { verifyIdentity } from '../../api/auth'

// ─── Types ────────────────────────────────────────────────────────────────────

export type IdentityVerificationStatus = 'idle' | 'pending' | 'success' | 'error'

interface UseIdentityVerificationResult {
  status: IdentityVerificationStatus
  error: string | null
  verifyResult: VerifyIdentityResult | null
  verify: () => Promise<void>
}

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * PortOne 본인인증 SDK 팝업 호출 + 백엔드 확인(verifyIdentity)을 캡슐화한 훅.
 * 회원가입의 "휴대폰 인증" 등 본인인증이 필요한 곳에서 재사용한다.
 *
 * @param onVerified 백엔드 확인까지 완료된(isVerified: true) 결과를 전달받는 콜백.
 *   hasExistingAccount로 기존 가입 여부를, 신규 사용자면 마스킹된 개인정보(maskedName 등)를 담고 있다.
 */
export function useIdentityVerification(
  onVerified?: (result: VerifyIdentityResult) => void
): UseIdentityVerificationResult {
  const [status, setStatus] = useState<IdentityVerificationStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [verifyResult, setVerifyResult] = useState<VerifyIdentityResult | null>(null)

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
      const res = await verifyIdentity({ identityVerificationId })

      if (!res.data?.isVerified) {
        setError('본인인증에 실패했습니다. 다시 시도해 주세요.')
        setStatus('error')
        return
      }

      setVerifyResult(res.data)
      setStatus('success')
      onVerified?.(res.data)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '본인인증 확인 중 오류가 발생했습니다.'
      setError(errorMessage)
      setStatus('error')
    }
  }

  return { status, error, verifyResult, verify }
}
