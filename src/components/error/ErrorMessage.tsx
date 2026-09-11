// ─── Types ────────────────────────────────────────────────────────────────────

interface ErrorMessageProps {
  /** 표시할 오류 문구. falsy(null/undefined/빈 문자열)면 아무것도 렌더링하지 않는다 —
   *  호출 측에서 별도 조건부 래핑(`{error && ...}`) 없이 바로 넘길 수 있다 */
  message?: string | null
  /** 텍스트 크기 — 'xs'(기본값, 폼 필드 인라인 오류) | 'sm'(페이지 레벨 배너 오류) */
  size?: 'xs' | 'sm'
  /** 추가 클래스 (예: 상단 여백 mt-2/mt-4) */
  className?: string
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const SIZE_CLASS_NAME: Record<NonNullable<ErrorMessageProps['size']>, string> = {
  xs: 'text-[10px]',
  sm: 'text-sm',
}

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * 프로젝트 전역에서 공통으로 쓰는 빨간 글씨 오류 메시지.
 * 폼 필드 인라인 오류(기본 size='xs')와 페이지 레벨 목록 조회 실패 배너(size='sm') 모두에서
 * 재사용한다. message가 falsy면 아무것도 렌더링하지 않으므로 호출부에서 `{error && ...}`로
 * 감쌀 필요 없이 바로 전달해도 된다.
 */
export function ErrorMessage({ message, size = 'xs', className = '' }: ErrorMessageProps) {
  if (!message) return null

  return (
    <p role="alert" className={`text-red-600 ${SIZE_CLASS_NAME[size]} ${className}`.trim()}>
      {message}
    </p>
  )
}
