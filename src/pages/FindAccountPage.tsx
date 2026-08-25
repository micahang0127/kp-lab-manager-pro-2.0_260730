import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import type { VerifyIdentityResult } from '../api/auth'
import { IdentityVerificationButton } from '../components/identityVerification'

// ─── Component ─────────────────────────────────────────────────────────────────

export function FindAccountPage() {
  const navigate = useNavigate()

  // 본인인증 완료 시 백엔드 확인 결과 (hasExistingAccount/existingEmail 등)
  const [verifyResult, setVerifyResult] = useState<VerifyIdentityResult | null>(null)

  return (
    <section className="mx-auto w-full max-w-sm">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">아이디/비밀번호 찾기</h1>

      <p className="mb-4 text-sm text-gray-600">
        본인인증을 진행하시면 가입하신 아이디 확인 및 비밀번호 재설정을 도와드립니다.
      </p>

      <IdentityVerificationButton label="본인인증" onVerified={setVerifyResult} />

      {/* [TEMP] 26.08.13 아이디/비밀번호 찾기 백엔드 미연동 — 본인인증 완료 후 아이디 조회·비밀번호 재설정 API 연동 필요.
          연동 완료 시 verifyResult(hasExistingAccount/existingEmail 등)를 이용해 실제 조회 로직으로 교체 */}
      {verifyResult && (
        <div className="mt-4 rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          본인인증이 완료되었습니다. 담당 부서 확인 후 순차 안내드리겠습니다.
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          void navigate({ to: '/login' })
        }}
        className="mt-4 w-full rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        로그인으로 돌아가기
      </button>
    </section>
  )
}
