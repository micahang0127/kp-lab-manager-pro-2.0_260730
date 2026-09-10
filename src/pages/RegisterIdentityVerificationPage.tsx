import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import type { VerifyIdentityResult } from '../api/auth'
import {
  AuthCardLayout,
  AuthFormActions,
  CompletedStepBadge,
  MaskedIdentityBox,
} from '../components/auth'
import { IdentityVerificationButton } from '../components/identityVerification'
import { RegisterStepProgress } from '../components/register/RegisterStepProgress'
import { useRegisterFlowStore } from '../stores/registerFlowStore'
import { formatMaskedIdentity } from '../utils/formatIdentityVerifyResult'

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * 회원가입 2단계 — 본인인증.
 * 1단계(가입 방법 선택)에서 넘어오며, 휴대폰 본인인증 완료(백엔드 확인 결과 isVerified: true) 시
 * registerFlowStore에 저장한 뒤 hasExistingAccount에 따라
 * 이미 가입된 계정이 있으면 3단계 "가입된 계정이 있습니다" 화면으로,
 * 없으면 3단계 "가입된 계정이 없습니다" 화면으로 이동한다.
 *
 * 이 화면에서 인증을 마친 뒤 "← 이전"으로 1단계까지 되돌아와 다시 넘어온 경우에는 인증을 새로
 * 요구하지 않고 "본인인증 완료" 상태와 "다음" 버튼을 보여준다 — PortOne 본인인증은 건당 과금이고
 * 사용자에게도 부담이라, 단계 순서만 지키고(이 화면을 거치고) 재인증은 요구하지 않는다.
 */
export function RegisterIdentityVerificationPage() {
  const navigate = useNavigate()
  const identityVerifyResult = useRegisterFlowStore((s) => s.identityVerifyResult)
  const setIdentityVerifyResult = useRegisterFlowStore((s) => s.setIdentityVerifyResult)
  const setIdentityVerificationCode = useRegisterFlowStore((s) => s.setIdentityVerificationCode)

  // "다시 인증하기"를 누르면 완료된 인증 결과가 남아있어도 인증 UI를 다시 노출한다. 이때 store를
  // 비우지 않는 이유는 재인증을 진행하지 않고 "← 이전"으로 이탈해도 기존 인증 결과가 유지되어야
  // 하기 때문이다 — 재인증에 성공하면 handleVerified가 새 결과로 덮어쓴다
  const [isReverifying, setIsReverifying] = useState(false)

  const isAlreadyVerified = identityVerifyResult !== null && !isReverifying
  const maskedIdentity = identityVerifyResult ? formatMaskedIdentity(identityVerifyResult) : ''

  /** 3단계(가입 여부 안내)로 이동 — 가입된 계정 유무에 따라 화면이 갈린다 */
  const goToNextStep = (result: VerifyIdentityResult) => {
    void navigate({
      to: result.hasExistingAccount ? '/register-account-exists' : '/register-account-check',
    })
  }

  const handleVerified = (result: VerifyIdentityResult, identityVerificationId: string) => {
    setIdentityVerifyResult(result, 'register')
    setIdentityVerificationCode(identityVerificationId)
    goToNextStep(result)
  }

  return (
    <AuthCardLayout
      title="회원가입"
      afterCard={<RegisterStepProgress currentStep={1} totalSteps={3} />}
    >
      {isAlreadyVerified ? (
        <>
          <div className="flex w-full flex-col items-start gap-[50px]">
            <CompletedStepBadge label="본인인증 완료" />

            <div className="flex w-full flex-col items-start gap-3">
              <p className="text-xl font-bold leading-7 text-[#1a1a17]">
                이미 본인인증을 완료했습니다.
                <br />
                다음 단계로 계속 진행할 수 있습니다.
              </p>

              <MaskedIdentityBox maskedIdentity={maskedIdentity} />
            </div>
          </div>

          <AuthFormActions
            primaryLabel="다음"
            primaryType="button"
            onPrimaryClick={() => {
              goToNextStep(identityVerifyResult)
            }}
            secondaryLeft={
              <button
                type="button"
                onClick={() => {
                  void navigate({ to: '/register' })
                }}
                className="opacity-50"
              >
                ← 이전
              </button>
            }
            secondaryRight={
              <button
                type="button"
                onClick={() => {
                  setIsReverifying(true)
                }}
                className="underline decoration-solid opacity-50 [text-underline-position:from-font]"
              >
                다시 인증하기
              </button>
            }
          />
        </>
      ) : (
        <>
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
                handleVerified(
                  {
                    isVerified: true,
                    hasExistingAccount: false,
                    maskedName: '홍길*',
                  },
                  'temp-skip-verification-id'
                )
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
        </>
      )}
    </AuthCardLayout>
  )
}
