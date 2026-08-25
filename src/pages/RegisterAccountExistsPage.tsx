import { useNavigate } from '@tanstack/react-router'

import checkCircleIcon from '../assets/icons/register/check-circle.svg'
import moreVerticalIcon from '../assets/icons/register/more-vertical.svg'
import { useRegisterFlowStore } from '../stores/registerFlowStore'
import { formatMaskedIdentity } from '../utils/formatIdentityVerifyResult'

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * 회원가입 3단계 — 본인인증 완료 후 가입 여부 안내 (이미 가입된 계정이 있는 경우).
 * 2단계(본인인증)에서 받은 백엔드 확인 결과(identityVerifyResult)의 existingEmail(마스킹된
 * 기존 계정 이메일)을 registerFlowStore에서 읽어와 표시한다. 랩매니저는 한 사람당 하나의
 * 계정만 허용하므로 신규 가입을 계속 진행하는 대신 로그인 또는 비밀번호 재설정으로 안내한다.
 * (백엔드 계약상 hasExistingAccount가 true면 maskedName 등 개인정보 필드는 내려오지 않는다 —
 * 아래 마스킹 정보 줄은 향후를 위해 방어적으로 남겨두되, 실제로는 existingEmail만 표시된다.)
 */
export function RegisterAccountExistsPage() {
  const navigate = useNavigate()
  const identityVerifyResult = useRegisterFlowStore((s) => s.identityVerifyResult)
  const maskedIdentity = identityVerifyResult ? formatMaskedIdentity(identityVerifyResult) : ''
  const existingEmail = identityVerifyResult?.existingEmail

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-[336px] rounded-xl border border-[#e0e0db] bg-white px-8 py-10">
        <div className="flex w-full flex-col items-start gap-8">
          <h1 className="w-full text-center text-xl font-bold text-[#1a1a17]">회원가입</h1>

          <div className="flex w-full flex-col items-start gap-[60px]">
            <div className="flex w-full items-center gap-2">
              <img src={checkCircleIcon} alt="" aria-hidden className="size-4 shrink-0" />
              <p className="text-xs text-[#1a1a17]">본인인증 완료</p>
            </div>

            <div className="flex w-full flex-col items-start gap-3">
              <div className="flex w-full flex-col items-start gap-1 text-[#1a1a17]">
                <p className="text-xl font-bold leading-7">가입된 계정이 있습니다.</p>
                <p className="text-xs leading-[18px]">
                  랩매니저는 한 사람당 하나의 계정만 사용할 수 있습니다.
                </p>
              </div>

              <div className="flex w-full items-start justify-end gap-2 rounded-xl bg-[rgba(254,199,65,0.2)] py-4 pl-5 pr-2.5">
                <div className="flex flex-1 flex-col items-start gap-2 text-[#1a1a17]">
                  {maskedIdentity && <p className="whitespace-pre text-[10px]">{maskedIdentity}</p>}
                  {existingEmail && (
                    <p className="text-base font-bold leading-5">{existingEmail}</p>
                  )}
                </div>
                <img src={moreVerticalIcon} alt="" aria-hidden className="size-4 shrink-0" />
              </div>
            </div>
          </div>

          <div className="flex w-full flex-col items-start gap-5">
            <button
              type="button"
              onClick={() => {
                void navigate({ to: '/login' })
              }}
              className="flex h-11 w-full items-center justify-center rounded bg-[#001e43] text-sm font-medium text-white hover:bg-[#00152f]"
            >
              로그인
            </button>

            <div className="flex w-full items-center justify-between text-xs font-medium text-[#1a1a17]">
              <button
                type="button"
                onClick={() => {
                  void navigate({ to: '/login' })
                }}
                className="opacity-50"
              >
                ← 로그인으로 돌아가기
              </button>
              <button
                type="button"
                onClick={() => {
                  void navigate({ to: '/find-account' })
                }}
                className="opacity-50"
              >
                비밀번호 재설정
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
