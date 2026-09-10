// ─── Types ────────────────────────────────────────────────────────────────────

interface MaskedIdentityBoxProps {
  /** formatMaskedIdentity 등으로 만들어진, 개행이 포함된 마스킹 개인정보 문자열 */
  maskedIdentity: string
}

// ─── Component ─────────────────────────────────────────────────────────────────

/** 마스킹된 개인정보(이름/생년월일/성별/전화번호 등)를 보여주는 회색 박스. 값이 없으면 렌더링하지 않는다 */
export function MaskedIdentityBox({ maskedIdentity }: MaskedIdentityBoxProps) {
  if (!maskedIdentity) return null

  return (
    <div className="w-full rounded-xl bg-[#f4f4f3] px-5 py-4">
      <p className="whitespace-pre text-[10px] text-[#1a1a17]">{maskedIdentity}</p>
    </div>
  )
}
