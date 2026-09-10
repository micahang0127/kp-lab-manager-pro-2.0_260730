import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import moreVerticalIcon from '../assets/icons/register/more-vertical.svg'
import {
  AuthCardLayout,
  AuthFormActions,
  CompletedStepBadge,
  MaskedIdentityBox,
} from '../components/auth'
import { IdentityVerificationButton } from '../components/identityVerification'
import { useFindAccountFlowStore } from '../stores/findAccountFlowStore'
import { useRegisterFlowStore } from '../stores/registerFlowStore'
import { formatMaskedIdentity } from '../utils/formatIdentityVerifyResult'

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * 아이디·비밀번호 찾기 페이지.
 * 로그인 페이지의 "아이디·비밀번호 찾기" 버튼에서 진입하며, 휴대폰 본인인증(공통 컴포넌트) 완료 시
 * 백엔드 확인 결과(hasExistingAccount)에 따라 같은 화면 안에서 안내 내용을 바꿔 보여준다.
 * - 계정 없음 (Figma node-id=698:3942): 회원가입으로 유도
 * - 계정 있음 (Figma node-id=698:3995): 로그인 재시도 또는 비밀번호 재설정으로 유도
 */
export function FindAccountPage() {
  const navigate = useNavigate()
  const verifiedIdentity = useFindAccountFlowStore((s) => s.verifiedIdentity)
  const setVerifiedIdentity = useFindAccountFlowStore((s) => s.setVerifiedIdentity)
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false)

  const identityVerifyResult = verifiedIdentity?.result ?? null
  const maskedIdentity = identityVerifyResult ? formatMaskedIdentity(identityVerifyResult) : ''

  // "회원가입 계속" — 이미 완료한 본인인증 결과를 registerFlowStore로 이어받아 회원가입
  // 1단계(가입 방법 선택)로 이동한다. 1단계는 회원가입 라우트 가드가 registerMethod를 요구하므로
  // 건너뛸 수 없고, 그 다음부터는 RegisterPage가 identityVerifySource가 'find-account'임을 보고
  // 2단계(본인인증)와 3단계(가입 여부 안내 — 이 화면과 내용이 같다)를 건너뛰어 바로 4단계(약관
  // 동의)로 보낸다. 즉 이 경로로 온 사용자는 본인인증을 다시 하지 않는 것이 의도된 동작이며,
  // URL 직접 접근으로도 2·3단계에 들어가지 못하도록 해당 라우트 가드에서도 같은 기준으로 막는다.
  //
  // 이어받기 전에 resetRegisterFlow()로 회원가입 플로우를 먼저 비운다 — 같은 탭에서 중단한
  // 이전 회원가입 시도의 값(약관 동의·이메일·비밀번호 등)이 남아있으면 방금 마친 본인인증
  // 결과와 뒤섞여 엉뚱한 단계로 건너뛸 수 있기 때문이다.
  // findAccountFlowStore는 여기서 비우지 않는다 — 이 화면의 결과 표시에 계속 필요하고, 다음번
  // 찾기 진입 시에는 LoginPage의 진입 핸들러가 비워준다.
  const handleContinueRegister = () => {
    if (!verifiedIdentity) return
    const registerFlow = useRegisterFlowStore.getState()
    registerFlow.resetRegisterFlow()
    registerFlow.setIdentityVerifyResult(verifiedIdentity.result, 'find-account')
    registerFlow.setIdentityVerificationCode(verifiedIdentity.identityVerificationCode)
    void navigate({ to: '/register' })
  }

  // ─── C. 가입된 계정이 있음 ───────────────────────────────────────────────────
  if (identityVerifyResult?.hasExistingAccount === true) {
    return (
      <AuthCardLayout title="아이디·비밀번호 찾기">
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
                {identityVerifyResult.existingEmail && (
                  <p className="text-base font-bold leading-5">
                    {identityVerifyResult.existingEmail}
                  </p>
                )}
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
                // [TEMP] 26.09.08 로그인 전 상태라 인증된 탈퇴 API(withdraw)를 호출할 수 없어
                // 동작 없이 UI만 우선 반영. 탈퇴 플로우 연동 시 실제 동작으로 교체
                onClick={() => {}}
                className="w-full rounded border border-[#c9c9c4] bg-white py-[13px] text-center text-xs font-medium text-[#2b2b29] hover:bg-gray-50"
              >
                계정 탈퇴
              </button>
            )}
          </div>
        </div>

        <AuthFormActions
          primaryLabel="로그인 재시도"
          primaryType="button"
          onPrimaryClick={() => {
            void navigate({ to: '/login' })
          }}
          secondaryRight={
            <button
              type="button"
              onClick={() => {
                void navigate({ to: '/find-account-reset-password' })
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

  // ─── B. 가입된 계정이 없음 ───────────────────────────────────────────────────
  if (identityVerifyResult?.hasExistingAccount === false) {
    return (
      <AuthCardLayout title="아이디·비밀번호 찾기">
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
          onPrimaryClick={handleContinueRegister}
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
        />
      </AuthCardLayout>
    )
  }

  // ─── A. 본인인증 전 ─────────────────────────────────────────────────────────
  return (
    <AuthCardLayout title="아이디·비밀번호 찾기">
      <div className="flex w-full flex-col items-start gap-1 text-[#1a1a17]">
        <p className="text-xl font-bold leading-7">가입된 계정이 있는지 확인해 주세요.</p>
        <p className="text-sm leading-[18px]">
          실명 확인을 위해 휴대폰 본인인증이 필요합니다. 인증 후 가입된 계정을 확인하거나 비밀번호를
          재설정할 수 있습니다.
        </p>
      </div>

      <div className="flex w-full flex-col items-start gap-5">
        <IdentityVerificationButton
          label="휴대폰 인증"
          onVerified={(result, identityVerificationCode) => {
            setVerifiedIdentity({ result, identityVerificationCode })
          }}
          className="w-full rounded border border-[#c9c9c4] bg-white py-[13px] text-center text-xs font-medium text-[#2b2b29] hover:bg-gray-50 disabled:opacity-50"
        />

        {/* [TEMP] 26.09.08 실제 본인인증(PortOne 팝업) 없이 인증 완료 이후 화면을 확인하기 위한
            테스트용 버튼 2개 — 백엔드 계약상 가입된 계정이 있으면 마스킹된 개인정보 대신
            existingEmail만 내려오므로 케이스별로 값을 다르게 구성했다.
            본인인증 연동 검증 완료 시 제거 */}
        <button
          type="button"
          onClick={() => {
            setVerifiedIdentity({
              result: {
                isVerified: true,
                hasExistingAccount: false,
                maskedName: '비번찾기테스*',
                maskedBirth: '1990-**-**',
                gender: 'M',
                maskedMobile: '010-****-5678',
              },
              identityVerificationCode: 'temp-find-account-no-account-id',
            })
          }}
          className="w-full rounded border border-dashed border-red-400 bg-red-50 py-[13px] text-center text-xs font-medium text-red-500 hover:bg-red-100"
        >
          [임시] 본인인증 PASS (가입된 계정 없음)
        </button>

        <button
          type="button"
          onClick={() => {
            setVerifiedIdentity({
              result: {
                isVerified: true,
                hasExistingAccount: true,
                existingEmail: 'bi******@koreapetroleum.com',
              },
              identityVerificationCode: 'temp-find-account-existing-account-id',
            })
          }}
          className="w-full rounded border border-dashed border-red-400 bg-red-50 py-[13px] text-center text-xs font-medium text-red-500 hover:bg-red-100"
        >
          [임시] 본인인증 PASS (가입된 계정 있음)
        </button>

        <button
          type="button"
          onClick={() => {
            void navigate({ to: '/login' })
          }}
          className="text-xs font-medium text-[#1a1a17] opacity-50"
        >
          ← 로그인으로 돌아가기
        </button>
      </div>
    </AuthCardLayout>
  )
}
