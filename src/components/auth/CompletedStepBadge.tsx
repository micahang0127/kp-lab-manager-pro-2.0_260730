import checkCircleIcon from '../../assets/icons/register/check-circle.svg'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CompletedStepBadgeProps {
  /** "본인인증 완료" / "약관 동의 완료" / "이메일 인증 완료" 등 완료 안내 문구 */
  label: string
}

// ─── Component ─────────────────────────────────────────────────────────────────

/** 이전 단계가 완료됐음을 알리는 체크 아이콘 + 한 줄 문구 (회원가입/계정찾기 다단계 화면 공통) */
export function CompletedStepBadge({ label }: CompletedStepBadgeProps) {
  return (
    <div className="flex w-full items-center gap-2">
      <img src={checkCircleIcon} alt="" aria-hidden className="size-4 shrink-0" />
      <p className="text-xs text-[#1a1a17]">{label}</p>
    </div>
  )
}
