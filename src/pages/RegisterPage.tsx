import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import groupIcon from '../assets/icons/register/group.svg'
import infoCircleIcon from '../assets/icons/register/info-circle.svg'
import memberIcon from '../assets/icons/register/member.svg'
import { RegisterOptionCard } from '../components/register/RegisterOptionCard'
import type { RegisterMethod } from '../stores/registerFlowStore'
import { useRegisterFlowStore } from '../stores/registerFlowStore'

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * 회원가입 첫 단계 — 가입 방법 선택.
 * "기존 조직에 가입"(초대 필요) 또는 "새 조직 만들기"(사업자등록증 필요) 중 하나를 고르면
 * 즉시 선택한 방법을 registerFlowStore에 저장하고 2단계(본인인증)로 이동한다.
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
    void navigate({ to: '/register-identity-verification' })
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-[336px] rounded-xl border border-[#e0e0db] bg-white px-8 py-10">
        <div className="flex flex-col items-center gap-8">
          <h1 className="text-center text-xl font-bold text-[#1a1a17]">회원가입</h1>

          {/* 회사 로고 자리 — 실제 로고 자산이 준비되면 교체 */}
          <div className="size-20 bg-[#e0e0e0]" aria-hidden />

          <div className="flex w-full flex-col items-start gap-1 text-[#1a1a17]">
            <p className="text-xl font-bold leading-7">랩매니저 가입 방법을 선택해 주세요.</p>
            <p className="text-sm leading-[18px]">
              기존 조직에 가입하거나 새 조직을 만들어 시작할 수 있습니다.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3">
            <div className="flex w-full flex-col gap-2">
              <RegisterOptionCard
                icon={memberIcon}
                title="기존 조직에 가입"
                subtitle="조직 초대 필요"
                selected={registerMethod === 'existing'}
                onClick={() => handleSelect('existing')}
              />
              <RegisterOptionCard
                icon={groupIcon}
                title="새 조직 만들기"
                subtitle="사업자등록증 필요"
                selected={registerMethod === 'new'}
                onClick={() => handleSelect('new')}
              />
            </div>

            <div className="flex w-full items-center gap-2 rounded-xl border border-[#669df1] bg-[rgba(102,157,241,0.1)] px-3 py-2 backdrop-blur-[2px]">
              <img src={infoCircleIcon} alt="" aria-hidden className="size-3 shrink-0" />
              <p className="flex-1 text-[10px] leading-[14px] text-[#1a1a17]">
                새 조직을 만드려는 경우 사업자등록증(PDF)을 미리 준비해 주세요.
                <br />
                가입 도중 나가시면 처음부터 다시 진행해야 합니다.
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
        </div>
      </div>
    </div>
  )
}
