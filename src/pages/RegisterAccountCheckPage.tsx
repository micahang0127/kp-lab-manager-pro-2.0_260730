import { useNavigate } from '@tanstack/react-router'

import {
  AuthCardLayout,
  AuthFormActions,
  CompletedStepBadge,
  MaskedIdentityBox,
} from '../components/auth'
import { useRegisterFlowStore } from '../stores/registerFlowStore'
import { formatMaskedIdentity } from '../utils/formatIdentityVerifyResult'

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * 회원가입 3단계 — 본인인증 완료 후 가입 여부 안내 (가입된 계정이 없는 경우).
 * 2단계(본인인증)에서 받은 백엔드 확인 결과(identityVerifyResult)를 registerFlowStore에서
 * 읽어와 마스킹된 개인정보(maskedName/maskedBirth/gender/maskedMobile)를 표시한다.
 */
export function RegisterAccountCheckPage() {
  const navigate = useNavigate()
  const identityVerifyResult = useRegisterFlowStore((s) => s.identityVerifyResult)
  const maskedIdentity = identityVerifyResult ? formatMaskedIdentity(identityVerifyResult) : ''

  const handleContinue = () => {
    void navigate({ to: '/register-terms' })
  }

  return (
    <AuthCardLayout title="회원가입">
      <div className="flex w-full flex-col items-start gap-[50px]">
        <CompletedStepBadge label="본인인증 완료" />

        <div className="flex w-full flex-col items-start gap-3">
          <p className="text-xl font-bold leading-7 text-[#1a1a17]">
            가입된 계정이 없습니다.
            <br />
            랩매니저 회원가입을 진행할 수 있습니다.
          </p>

          <MaskedIdentityBox maskedIdentity={maskedIdentity} />
        </div>
      </div>

      <AuthFormActions
        primaryLabel="회원가입 계속"
        primaryType="button"
        onPrimaryClick={handleContinue}
        secondaryLeft={
          <button
            type="button"
            onClick={() => {
              void navigate({ to: '/register-identity-verification' })
            }}
            className="opacity-50"
          >
            ← 이전
          </button>
        }
      />
    </AuthCardLayout>
  )
}
