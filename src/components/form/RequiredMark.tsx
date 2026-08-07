// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * 필수 입력 항목임을 나타내는 표시. label 텍스트 오른쪽에 붙여서 사용한다.
 * [TEMP] 26.08.07 아이콘 디자인 확정 전까지 빨간 텍스트로 임시 표기. 디자인 확정 시 아이콘으로 교체할 것
 */
export function RequiredMark() {
  return (
    <span aria-hidden="true" className="ml-0.5 text-red-500">
      *
    </span>
  )
}
