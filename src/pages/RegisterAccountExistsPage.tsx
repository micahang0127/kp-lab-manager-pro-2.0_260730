import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import moreVerticalIcon from '../assets/icons/register/more-vertical.svg'
import { AuthCardLayout, AuthFormActions, CompletedStepBadge } from '../components/auth'
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
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false)

  return (
    <AuthCardLayout title="회원가입">
      <div className="flex w-full flex-col items-start gap-[60px]">
        <CompletedStepBadge label="본인인증 완료" />

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
              {existingEmail && <p className="text-base font-bold leading-5">{existingEmail}</p>}
            </div>
            <button
              type="button"
              onClick={() => setIsMoreMenuOpen((prev) => !prev)}
              aria-label="더보기"
              aria-expanded={isMoreMenuOpen}
              className="shrink-0"
            >
              <img src={moreVerticalIcon} alt="" aria-hidden className="size-4" />
            </button>
          </div>

          {isMoreMenuOpen && (
            <button
              type="button"
              // [TEMP] 26.09.08 회원가입 단계(로그인 전)라 인증된 탈퇴 API(withdraw)를 호출할
              // 수 없어 동작 없이 UI만 우선 반영. 탈퇴 플로우 연동 시 실제 동작으로 교체
              onClick={() => {}}
              className="w-full rounded border border-[#c9c9c4] bg-white py-[13px] text-center text-xs font-medium text-[#2b2b29] hover:bg-gray-50"
            >
              계정 탈퇴
            </button>
          )}
        </div>
      </div>

      <AuthFormActions
        primaryLabel="로그인"
        primaryType="button"
        onPrimaryClick={() => {
          void navigate({ to: '/login' })
        }}
        secondaryLeft={
          <button
            type="button"
            onClick={() => {
              void navigate({ to: '/login' })
            }}
            className="opacity-50"
          >
            ← 로그인으로 돌아가기
          </button>
        }
        secondaryRight={
          <button
            type="button"
            onClick={() => {
              void navigate({ to: '/register-reset-password' })
            }}
            className="opacity-50"
          >
            비밀번호 재설정
          </button>
        }
      />
    </AuthCardLayout>
  )
}
