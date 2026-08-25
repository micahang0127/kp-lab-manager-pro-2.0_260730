// ─── Types ────────────────────────────────────────────────────────────────────

interface RegisterStepProgressProps {
  /** 현재 단계 (1부터 시작) */
  currentStep: number
  /** 전체 단계 수 */
  totalSteps: number
}

// ─── Component ─────────────────────────────────────────────────────────────────

/** 회원가입 단계 진행률 표시 바 (예: "1/3") — 본인인증 등 다단계 가입 화면에서 공통으로 사용 */
export function RegisterStepProgress({ currentStep, totalSteps }: RegisterStepProgressProps) {
  return (
    <div className="flex w-full max-w-[336px] flex-col items-start gap-1">
      <div className="flex w-full items-start">
        {Array.from({ length: totalSteps }, (_, index) => (
          <div
            key={index}
            aria-hidden
            className={`h-1 flex-1 ${index < currentStep ? 'bg-[#fec741]' : 'bg-[#c9c9c4]'}`}
          />
        ))}
      </div>
      <p className="w-full text-right text-[10px] leading-[14px] text-[#1a1a17]">
        {currentStep}/{totalSteps}
      </p>
    </div>
  )
}
