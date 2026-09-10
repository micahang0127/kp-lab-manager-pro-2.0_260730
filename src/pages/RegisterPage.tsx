import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import groupIcon from '../assets/icons/register/group.svg'
import infoCircleIcon from '../assets/icons/register/info-circle.svg'
import memberIcon from '../assets/icons/register/member.svg'
import { AuthCardLayout } from '../components/auth'
import { RegisterOptionCard } from '../components/register/RegisterOptionCard'
import type { RegisterMethod } from '../stores/registerFlowStore'
import { useRegisterFlowStore } from '../stores/registerFlowStore'

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * 회원가입 첫 단계 — 가입 방법 선택.
 * "초대받은 조직에 가입"(관리자 초대 필요) 또는 "새 조직 만들기"(사업자등록증 필요) 중 하나를
 * 고르면 즉시 선택한 방법을 registerFlowStore에 저장하고 2단계(본인인증)로 이동한다.
 */
export function RegisterPage() {
  const navigate = useNavigate()
  const registerMethodInStore = useRegisterFlowStore((s) => s.registerMethod)
  const setRegisterMethodInStore = useRegisterFlowStore((s) => s.setRegisterMethod)

  // '이전' 버튼으로 되돌아온 경우, store에 이미 선택된 방법이 있으면 화면에도 그대로 복원한다
  const [registerMethod, setRegisterMethod] = useState<RegisterMethod | null>(registerMethodInStore)

  const handleSelect = (method: RegisterMethod) => {
    setRegisterMethod(method)
    setRegisterMethodInStore(method)

    // 아이디·비밀번호 찾기(find-account)에서 이미 본인인증을 마치고 넘어온 경우에만 2·3단계를
    // 건너뛴다 — find-account 화면에서 "가입된 계정이 없습니다" 안내를 이미 보여줬으므로,
    // 재인증(2단계)뿐 아니라 동일한 내용을 중복 표시하는 가입 여부 안내(3단계)도 불필요하다.
    //
    // 판단 기준은 identityVerifyResult의 존재가 아니라 identityVerifySource다. 정상 플로우에서
    // 2단계를 마친 뒤 "← 이전"으로 1단계까지 되돌아와 카드를 다시 고른 경우에도 결과는 그대로
    // 남아있어, 결과 유무로 판단하면 두 경우를 구분할 수 없다. 이 경우 다음 단계는 순서상
    // 2단계이므로 그대로 2단계로 보낸다(이미 인증을 마친 상태는 해당 화면이 "인증 완료"로
    // 렌더링해 PortOne 재인증을 요구하지 않는다).
    const identityVerifySource = useRegisterFlowStore.getState().identityVerifySource
    void navigate({
      to:
        identityVerifySource === 'find-account'
          ? '/register-terms'
          : '/register-identity-verification',
    })
  }

  return (
    <AuthCardLayout title="회원가입" align="center" maxWidth="wide">
      <div className="flex w-full flex-col items-start gap-1 text-[#1a1a17]">
        <p className="text-xl font-bold leading-7">
          랩매니저 시스템 관리자로부터 초대를 받으셨나요?
        </p>
        <p className="text-sm leading-[18px]">
          선택한 방식에 따라 가입에 필요한 정보와 부여되는 권한이 달라집니다.
        </p>
      </div>

      <div className="flex w-full flex-col gap-3">
        <div className="mobile:flex-col tablet:flex-row flex w-full gap-2">
          <RegisterOptionCard
            icon={memberIcon}
            title="초대받은 조직에 가입"
            subtitle={
              '관리자로부터 조직에 초대받은 경우 선택해 주세요.\n초대 시 지정된 그룹과 권한이 적용됩니다.'
            }
            badge="추천"
            selected={registerMethod === 'existing'}
            onClick={() => handleSelect('existing')}
          />
          <RegisterOptionCard
            icon={groupIcon}
            title="새 조직 만들기"
            subtitle={
              '새 조직을 등록하고 구성원을 초대할 경우 선택해 주세요.\n조직을 만든 사용자는 시스템 관리자가 됩니다.'
            }
            selected={registerMethod === 'new'}
            onClick={() => handleSelect('new')}
          />
        </div>

        <div className="flex w-full items-center gap-2 rounded-xl border border-[#669df1] bg-[rgba(102,157,241,0.1)] px-3 py-2 backdrop-blur-[2px]">
          <img src={infoCircleIcon} alt="" aria-hidden className="size-4 shrink-0" />
          <p className="flex-1 text-[10px] leading-[14px] text-[#1a1a17]">
            <span className="font-bold">
              새 조직을 만드는 경우 사업자등록증(PDF)이 필요합니다. 미리 준비해 주세요.{' '}
            </span>
            가입 중 페이지를 나가면 처음부터 다시 진행해야 합니다.
            <br />
            기업 인증을 통해 조직의 재고 데이터를 외부로부터 안전하게 보호합니다. 인증이 끝나면,
            이후 초대받는 팀원은 별도 서류 없이 이메일만으로 간편하게 가입할 수 있어요.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          void navigate({ to: '/login' })
        }}
        className="text-xs font-medium text-[#1a1a17] opacity-50"
      >
        ← 로그인으로 돌아가기
      </button>
    </AuthCardLayout>
  )
}
