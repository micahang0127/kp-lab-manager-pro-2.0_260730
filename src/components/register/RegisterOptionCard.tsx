// ─── Types ────────────────────────────────────────────────────────────────────

interface RegisterOptionCardProps {
  /** 카드 상단에 표시할 아이콘 (32x26 크기 SVG 자산) */
  icon: string
  title: string
  /** 줄바꿈이 필요하면 문자열 안에 개행(\n)을 포함한다 */
  subtitle: string
  /** 카드 제목 옆에 표시할 뱃지 (예: "추천") — 없으면 표시하지 않음 */
  badge?: string
  /** 선택된 카드인지 여부 — 테두리를 강조 색상으로 표시 */
  selected?: boolean
  onClick: () => void
}

// ─── Component ─────────────────────────────────────────────────────────────────

/** 회원가입 방법 선택 카드 (예: "초대받은 조직에 가입", "새 조직 만들기") */
export function RegisterOptionCard({
  icon,
  title,
  subtitle,
  badge,
  selected = false,
  onClick,
}: RegisterOptionCardProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`flex flex-1 flex-col items-center justify-center gap-4 rounded border bg-white px-5 py-[30px] hover:bg-gray-50 ${
        selected ? 'border-[#669df1]' : 'border-[#c9c9c4]'
      }`}
    >
      <img src={icon} alt="" aria-hidden className="h-[26px] w-8" />
      <span className="flex flex-col items-center gap-1 text-[#1a1a17]">
        <span className="flex items-center gap-1.5">
          <span className="text-xl font-bold leading-7">{title}</span>
          {badge && (
            <span className="flex h-4 items-center justify-center rounded-full bg-[#ffbd9f] px-1 py-0.5 text-[11px] leading-none">
              {badge}
            </span>
          )}
        </span>
        <span className="whitespace-pre-line text-center text-[10px] leading-4">{subtitle}</span>
      </span>
    </button>
  )
}
