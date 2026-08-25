import { useNavigate } from '@tanstack/react-router'

import type { VerifyIdentityResult } from '../api/auth'
import { IdentityVerificationButton } from '../components/identityVerification'
import { RegisterStepProgress } from '../components/register/RegisterStepProgress'
import { useRegisterFlowStore } from '../stores/registerFlowStore'

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * 회원가입 2단계 — 본인인증.
 * 1단계(가입 방법 선택)에서 넘어오며, 휴대폰 본인인증 완료(백엔드 확인 결과 isVerified: true) 시
 * registerFlowStore에 저장한 뒤 hasExistingAccount에 따라
 * 이미 가입된 계정이 있으면 3단계 "가입된 계정이 있습니다" 화면으로,
 * 없으면 3단계 "가입된 계정이 없습니다" 화면으로 이동한다.
 */
export function RegisterIdentityVerificationPage() {
  const navigate = useNavigate()
  const setIdentityVerifyResult = useRegisterFlowStore((s) => s.setIdentityVerifyResult)

  const handleVerified = (result: VerifyIdentityResult) => {
    setIdentityVerifyResult(result)

    if (result.hasExistingAccount) {
      void navigate({ to: '/register-account-exists' })
      return
    }

    void navigate({ to: '/register-account-check' })
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-[10px] px-4 py-10">
      <div className="w-full max-w-[336px] rounded-xl border border-[#e0e0db] bg-white px-8 py-10">
        <div className="flex w-full flex-col items-start gap-8">
          <h1 className="w-full text-center text-xl font-bold text-[#1a1a17]">회원가입</h1>

          <div className="flex w-full flex-col items-start gap-1 text-[#1a1a17]">
            <p className="text-xl font-bold leading-7">가입된 계정이 있는지 확인해 주세요.</p>
            <p className="text-sm leading-[18px]">
              실명 확인을 위해 휴대폰 본인인증이 필요합니다. 인증 후 가입 여부에 따라 자동으로
              안내해 드립니다.
            </p>
          </div>

          <div className="flex w-full flex-col items-start gap-5">
            <IdentityVerificationButton
              label="휴대폰 인증"
              onVerified={handleVerified}
              className="w-full rounded border border-[#c9c9c4] bg-white py-[13px] text-center text-xs font-medium text-[#2b2b29] hover:bg-gray-50 disabled:opacity-50"
            />

            {/* [TEMP] 26.08.25 실제 본인인증 없이 다음 단계로 넘어가기 위한 테스트용 버튼 —
                본인인증 연동 검증 완료 시 제거 */}
            <button
              type="button"
              onClick={() => {
                handleVerified({
                  isVerified: true,
                  hasExistingAccount: false,
                  maskedName: '홍길*',
                })
              }}
              className="w-full rounded border border-dashed border-red-400 bg-red-50 py-[13px] text-center text-xs font-medium text-red-500 hover:bg-red-100"
            >
              [임시]본인인증PASS
            </button>

            <button
              type="button"
              onClick={() => {
                void navigate({ to: '/register' })
              }}
              className="text-xs font-medium text-[#1a1a17] opacity-50"
            >
              ← 이전
            </button>
          </div>
        </div>
      </div>

      <RegisterStepProgress currentStep={1} totalSteps={3} />
    </div>
  )
}
