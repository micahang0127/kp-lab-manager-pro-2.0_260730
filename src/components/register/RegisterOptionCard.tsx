import chevronDown from '../../assets/icons/register/chevron-down.svg'

// ─── Types ────────────────────────────────────────────────────────────────────

interface RegisterOptionCardProps {
  /** 카드 좌측에 표시할 아이콘 (16x13 크기 SVG 자산) */
  icon: string
  title: string
  subtitle: string
  /** 선택된 카드인지 여부 — 테두리를 강조 색상으로 표시 */
  selected?: boolean
  onClick: () => void
}

// ─── Component ─────────────────────────────────────────────────────────────────

/** 회원가입 방법 선택 카드 (예: "기존 조직에 가입", "새 조직 만들기") */
export function RegisterOptionCard({
  icon,
  title,
  subtitle,
  selected = false,
  onClick,
}: RegisterOptionCardProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`flex w-full items-center justify-center gap-3 rounded border bg-white py-[13px] pl-9 pr-4 hover:bg-gray-50 ${
        selected ? 'border-[#669df1]' : 'border-[#c9c9c4]'
      }`}
    >
      <span className="flex flex-1 flex-col items-center gap-3">
        <img src={icon} alt="" aria-hidden className="h-[13px] w-4" />
        <span className="flex flex-col items-center whitespace-nowrap text-[#1a1a17]">
          <span className="text-xl font-bold leading-7">{title}</span>
          <span className="text-[10px] leading-[18px]">{subtitle}</span>
        </span>
      </span>
      <span className="flex size-4 shrink-0 items-center justify-center">
        <img src={chevronDown} alt="" aria-hidden className="h-[7px] w-3.5 -rotate-90" />
      </span>
    </button>
  )
}
