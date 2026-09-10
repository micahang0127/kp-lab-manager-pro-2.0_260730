import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import checkCircleFilledIcon from '../assets/icons/register/check-circle-filled.svg'
import checkMarkIcon from '../assets/icons/register/check-mark.svg'
import chevronDownIcon from '../assets/icons/register/chevron-down.svg'
import minusLineIcon from '../assets/icons/register/minus-line.svg'
import { AuthCardLayout, AuthFormActions } from '../components/auth'
import { useRegisterFlowStore } from '../stores/registerFlowStore'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TermsCheckboxRowProps {
  label: string
  checked: boolean
  onToggle: () => void
  /** 보기(전문 확인) 클릭 핸들러 — 실제 약관 전문 연결 전까지는 no-op */
  onView: () => void
}

// ─── Sub Components ───────────────────────────────────────────────────────────

/** 필수/선택 약관 항목 한 줄 — 체크 아이콘은 checkMarkIcon 자산을 그대로 두고 opacity로 체크 여부를 표현한다 */
function TermsCheckboxRow({ label, checked, onToggle, onView }: TermsCheckboxRowProps) {
  return (
    <div className="flex w-full items-center gap-2">
      <button
        type="button"
        aria-pressed={checked}
        onClick={onToggle}
        className="flex flex-1 items-center gap-1"
      >
        <img
          src={checkMarkIcon}
          alt=""
          aria-hidden
          className={`size-4 shrink-0 ${checked ? 'opacity-100' : 'opacity-30'}`}
        />
        <span className="flex-1 text-left text-xs text-[#1a1a17]">{label}</span>
      </button>
      <button
        type="button"
        onClick={onView}
        className="shrink-0 whitespace-nowrap text-[10px] text-[#1a1a17] underline decoration-solid opacity-50 [text-underline-position:from-font]"
      >
        보기
      </button>
    </div>
  )
}

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * 회원가입 4단계 — 서비스 이용약관 동의.
 * 3단계(가입 여부 안내, 신규 사용자)에서 "회원가입 계속" 클릭 시 진입한다.
 * 필수 약관(이용약관/개인정보 수집·이용) 2개를 모두 동의해야 "동의" 버튼이 활성화되며,
 * 마케팅 정보 수신 동의(선택) 여부는 registerFlowStore에 저장해 5단계(이메일 인증)로 전달한다.
 */
export function RegisterTermsPage() {
  const navigate = useNavigate()
  const termsAgreementInStore = useRegisterFlowStore((s) => s.termsAgreement)
  const setTermsAgreement = useRegisterFlowStore((s) => s.setTermsAgreement)
  const identityVerifySource = useRegisterFlowStore((s) => s.identityVerifySource)

  // 되돌아가기 경로는 진행 경로와 대칭이어야 한다 — 아이디·비밀번호 찾기에서 넘어온 사용자는
  // 2·3단계를 건너뛰고 1단계에서 바로 이 화면으로 왔으므로 1단계로 되돌려보낸다. 3단계로 보내면
  // 방금 찾기 화면에서 본 "가입된 계정이 없습니다" 안내를 중복해서 보여주게 된다
  const previousStepPath =
    identityVerifySource === 'find-account' ? '/register' : '/register-account-check'

  // '이전' 버튼으로 되돌아온 경우 store에 남아있는 이전 동의 상태를 복원한다. termsAgreement는
  // 필수 약관(이용약관/개인정보 수집·이용)에 모두 동의해야만 저장되므로, 존재 여부만으로 두
  // 필수 항목을 복원할 수 있다
  const [agreedTerms, setAgreedTerms] = useState(!!termsAgreementInStore)
  const [agreedPrivacy, setAgreedPrivacy] = useState(!!termsAgreementInStore)
  const [agreedMarketing, setAgreedMarketing] = useState(
    termsAgreementInStore?.marketingOptIn ?? false
  )
  const [isTermsPreviewExpanded, setIsTermsPreviewExpanded] = useState(false)

  const allAgreed = agreedTerms && agreedPrivacy && agreedMarketing
  const canSubmit = agreedTerms && agreedPrivacy

  const handleToggleAll = () => {
    const next = !allAgreed
    setAgreedTerms(next)
    setAgreedPrivacy(next)
    setAgreedMarketing(next)
  }

  const handleSubmit = () => {
    if (!canSubmit) return
    setTermsAgreement({ marketingOptIn: agreedMarketing })
    void navigate({ to: '/register-email-verification' })
  }

  // [TEMP] 26.08.25 법무팀 검토본(약관 전문) 연동 전까지 항목별 "보기"는 동작하지 않는다.
  // 연동 완료 시 각 약관 상세 페이지/모달로 이동하도록 교체
  const handleView = () => {}

  return (
    <AuthCardLayout title="회원가입">
      <div className="flex w-full flex-col items-start gap-5">
        <p className="w-full text-xl font-bold leading-7 text-[#1a1a17]">
          서비스 이용약관에 동의해 주세요
        </p>

        <div className="flex w-full flex-col items-start gap-3">
          <button
            type="button"
            aria-pressed={allAgreed}
            onClick={handleToggleAll}
            className="flex w-full items-center gap-2"
          >
            {allAgreed ? (
              <img src={checkCircleFilledIcon} alt="" aria-hidden className="size-4 shrink-0" />
            ) : (
              <span aria-hidden className="size-4 shrink-0 rounded-full border border-[#c9c9c4]" />
            )}
            <span className="text-xs font-bold text-[#1a1a17]">전체 동의</span>
          </button>

          <TermsCheckboxRow
            label="(필수) 이용약관 동의"
            checked={agreedTerms}
            onToggle={() => setAgreedTerms((prev) => !prev)}
            onView={handleView}
          />
          <TermsCheckboxRow
            label="(필수) 개인정보 수집 및 이용 동의"
            checked={agreedPrivacy}
            onToggle={() => setAgreedPrivacy((prev) => !prev)}
            onView={handleView}
          />
          <TermsCheckboxRow
            label="(선택) 마케팅 정보 수신 동의"
            checked={agreedMarketing}
            onToggle={() => setAgreedMarketing((prev) => !prev)}
            onView={handleView}
          />

          <div className="flex w-full items-center gap-2">
            <img src={minusLineIcon} alt="" aria-hidden className="size-4 shrink-0" />
            <span className="flex-1 text-xs text-[#1a1a17]">개인정보 수집 및 이용 안내</span>
            <button
              type="button"
              onClick={handleView}
              className="shrink-0 whitespace-nowrap text-[10px] text-[#1a1a17] underline decoration-solid opacity-50 [text-underline-position:from-font]"
            >
              보기
            </button>
          </div>

          {/* [TEMP] 26.08.25 법무팀 검토본 삽입 전 자리 표시 문구 — 연동 완료 시 실제 약관 전문으로 교체 */}
          <div className="flex w-full flex-col items-center justify-center gap-2.5 rounded-xl bg-[#f4f4f3] px-3.5 pb-2 pt-2.5">
            <p className="w-full text-[10px] leading-[14px] text-[#9e9e96]">
              이용약관 전문 — 법무팀 검토본 삽입 예정
            </p>
            {/* [TEMP] 26.08.25 실제 약관 전문이 없어 펼침 상태만 토글할 뿐 표시 내용은 그대로다.
                연동 완료 시 isTermsPreviewExpanded에 따라 전문을 펼쳐 보여주도록 교체 */}
            <button
              type="button"
              aria-expanded={isTermsPreviewExpanded}
              onClick={() => setIsTermsPreviewExpanded((prev) => !prev)}
              className="flex w-full items-center justify-center gap-1"
            >
              <span className="text-[10px] text-[#2b2b29]">더보기</span>
              <img
                src={chevronDownIcon}
                alt=""
                aria-hidden
                className={`h-[7px] w-3.5 ${isTermsPreviewExpanded ? 'rotate-180' : ''}`}
              />
            </button>
          </div>
        </div>
      </div>

      <AuthFormActions
        primaryLabel="동의"
        primaryType="button"
        primaryDisabled={!canSubmit}
        onPrimaryClick={handleSubmit}
        secondaryLeft={
          <button
            type="button"
            onClick={() => {
              void navigate({ to: previousStepPath })
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
