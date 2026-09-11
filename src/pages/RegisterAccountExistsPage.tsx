import { useNavigate } from '@tanstack/react-router'

import { AuthCardLayout, CompletedStepBadge } from '../components/auth'
import { useFindAccountFlowStore } from '../stores/findAccountFlowStore'
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
  const identityVerificationCode = useRegisterFlowStore((s) => s.identityVerificationCode)
  const maskedIdentity = identityVerifyResult ? formatMaskedIdentity(identityVerifyResult) : ''
  const existingEmail = identityVerifyResult?.existingEmail

  // 비밀번호 재설정은 이 화면 전용 페이지를 따로 두지 않고, 아이디·비밀번호 찾기와 동일한
  // 재설정 화면(FindAccountResetPasswordPage)을 재사용한다. 그 화면은 findAccountFlowStore의
  // verifiedIdentity를 읽으므로, 이동 전에 registerFlowStore에 있는 본인인증 결과를 그대로
  // 옮겨 담아준다 — FindAccountPage의 handleContinueRegister(반대 방향 전달)와 동일한 패턴.
  const handleResetPassword = () => {
    if (!identityVerifyResult || !identityVerificationCode) return
    useFindAccountFlowStore.getState().setVerifiedIdentity({
      result: identityVerifyResult,
      identityVerificationCode,
    })
    void navigate({ to: '/find-account-reset-password' })
  }

  return (
    <AuthCardLayout title="회원가입">
      <div className="flex w-full flex-col items-start gap-[60px]">
        <CompletedStepBadge label="본인인증 완료" />

        <div className="flex w-full flex-col items-start gap-3 text-[#1a1a17]">
          <div className="flex w-full flex-col items-start gap-1">
            <p className="text-xl font-bold leading-7">가입된 계정이 있습니다.</p>
            <p className="text-xs leading-[18px]">
              아래 계정으로 로그인하거나 비밀번호를 재설정할 수 있습니다.
            </p>
          </div>

          <div className="flex w-full flex-col items-start gap-2 rounded-xl border border-[rgba(0,30,67,0.3)] bg-[rgba(0,30,67,0.05)] px-5 py-4">
            {maskedIdentity && <p className="whitespace-pre text-[10px]">{maskedIdentity}</p>}
            {existingEmail && <p className="text-base font-bold leading-5">{existingEmail}</p>}
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col items-start gap-5">
        <div className="flex w-full flex-col items-start gap-2">
          <button
            type="button"
            onClick={() => {
              void navigate({ to: '/login' })
            }}
            className="flex h-11 w-full items-center justify-center rounded bg-[#001e43] text-sm font-medium text-white hover:bg-[#00152f]"
          >
            기존 계정으로 로그인
          </button>
          <button
            type="button"
            onClick={handleResetPassword}
            className="flex h-11 w-full items-center justify-center rounded border border-[#c9c9c4] bg-white text-sm font-medium text-[#1a1a17] hover:bg-gray-50"
          >
            비밀번호 재설정
          </button>
        </div>

        <div className="flex w-full items-center justify-end">
          <button
            type="button"
            // [TEMP] 26.09.08 회원가입 단계(로그인 전)라 인증된 탈퇴 API(withdraw)를 호출할
            // 수 없어 동작 없이 UI만 우선 반영. 탈퇴 플로우 연동 시 실제 동작으로 교체
            onClick={() => {}}
            className="text-xs font-medium text-[#1a1a17] opacity-50"
          >
            계정탈퇴
          </button>
        </div>
      </div>
    </AuthCardLayout>
  )
}
