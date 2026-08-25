import { useNavigate } from '@tanstack/react-router'

import checkCircleIcon from '../assets/icons/register/check-circle.svg'
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
    <div className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-[336px] rounded-xl border border-[#e0e0db] bg-white px-8 py-10">
        <div className="flex w-full flex-col items-start gap-8">
          <h1 className="w-full text-center text-xl font-bold text-[#1a1a17]">회원가입</h1>

          <div className="flex w-full flex-col items-start gap-[50px]">
            <div className="flex w-full items-center gap-2">
              <img src={checkCircleIcon} alt="" aria-hidden className="size-4 shrink-0" />
              <p className="text-xs text-[#1a1a17]">본인인증 완료</p>
            </div>

            <div className="flex w-full flex-col items-start gap-3">
              <p className="text-xl font-bold leading-7 text-[#1a1a17]">
                가입된 계정이 없습니다.
                <br />
                랩매니저 회원가입을 진행할 수 있습니다.
              </p>

              {maskedIdentity && (
                <div className="w-full rounded-xl bg-[#f4f4f3] px-5 py-4">
                  <p className="whitespace-pre text-[10px] text-[#1a1a17]">{maskedIdentity}</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex w-full flex-col items-start gap-5">
            <button
              type="button"
              onClick={handleContinue}
              className="flex h-11 w-full items-center justify-center rounded bg-[#001e43] text-sm font-medium text-white hover:bg-[#00152f]"
            >
              회원가입 계속
            </button>

            <div className="flex w-full items-center justify-between text-xs font-medium text-[#1a1a17]">
              <button
                type="button"
                onClick={() => {
                  void navigate({ to: '/register-identity-verification' })
                }}
                className="opacity-50"
              >
                ← 이전
              </button>
              <button
                type="button"
                onClick={() => {
                  void navigate({ to: '/login' })
                }}
              >
                로그인
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
