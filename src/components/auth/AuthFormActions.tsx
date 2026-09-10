// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthFormActionsProps {
  /** 주 액션 버튼 텍스트 (pending 시 문구 전환 등은 호출부에서 계산해 전달) */
  primaryLabel: string
  /** 기본 'submit'. onClick으로 처리하는 화면만 'button' */
  primaryType?: 'submit' | 'button'
  onPrimaryClick?: () => void
  primaryDisabled?: boolean
  /** 주 버튼 "위"에 배치 (예: 로그인의 봇 차단 위젯 + 에러 배너) */
  beforePrimary?: React.ReactNode
  /** 주 버튼과 보조 버튼 행 "사이"에 배치 (예: 제출 에러 메시지) */
  belowPrimary?: React.ReactNode
  /** 보조 버튼 행 좌측 — 보통 "← 이전" 류 텍스트 버튼 */
  secondaryLeft?: React.ReactNode
  /** 보조 버튼 행 우측 — 있을 때만 렌더링 */
  secondaryRight?: React.ReactNode
  /** 보조 버튼 행 "아래"에 배치 — 드문 예외 전용 (임시 스킵 버튼 등), 남용하지 않는다 */
  afterSecondary?: React.ReactNode
}

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * 인증 관련 페이지 하단의 주 액션 버튼 + 보조 버튼 행을 담당하는 공통 컴포넌트.
 * 철저히 프레젠테이셔널하다 — disabled 여부/버튼 문구/클릭 핸들러는 이미 계산된 값을 그대로
 * 받아 렌더링만 하고, canSubmit 판정이나 mutation 호출 같은 로직은 갖지 않는다.
 */
export function AuthFormActions({
  primaryLabel,
  primaryType = 'submit',
  onPrimaryClick,
  primaryDisabled = false,
  beforePrimary,
  belowPrimary,
  secondaryLeft,
  secondaryRight,
  afterSecondary,
}: AuthFormActionsProps) {
  const secondaryJustifyClassName =
    secondaryLeft && secondaryRight ? 'justify-between' : secondaryRight ? 'justify-end' : ''

  return (
    <div className="flex w-full flex-col items-start gap-5">
      {beforePrimary}

      <button
        type={primaryType}
        onClick={onPrimaryClick}
        disabled={primaryDisabled}
        className="flex h-11 w-full items-center justify-center rounded bg-[#001e43] text-sm font-medium text-white hover:bg-[#00152f] disabled:opacity-50"
      >
        {primaryLabel}
      </button>

      {belowPrimary}

      {(secondaryLeft || secondaryRight) && (
        <div
          className={`flex w-full items-center text-xs font-medium text-[#1a1a17] ${secondaryJustifyClassName}`}
        >
          {secondaryLeft}
          {secondaryRight}
        </div>
      )}

      {afterSecondary}
    </div>
  )
}
