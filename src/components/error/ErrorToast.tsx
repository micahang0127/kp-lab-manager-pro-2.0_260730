import warningTriangleIcon from '../../assets/icons/common/warning-triangle.svg'

interface ErrorToastProps {
  /** 서버가 내려준 안내 문구. null/undefined/빈 문자열이면 아무것도 렌더링하지 않는다 */
  message?: string | null
  /** 토스트 안에 함께 노출할 보조 액션 (예: "비밀번호 찾기" 링크) */
  children?: React.ReactNode
}

/**
 * 경고 아이콘 + 서버 message를 함께 보여주는 공통 에러 토스트 (Figma node-id=684:3253 기준).
 * 로그인 실패처럼 사용자 입력 오류를 즉시 눈에 띄게 안내해야 하는 화면에서 사용한다.
 * 배너 형태로 화면에 계속 남아있는 `ServerErrorBanner`와 달리, 카드형 UI(아이콘 포함)로
 * 폼 안쪽에 인라인 배치하는 용도다.
 */
export function ErrorToast({ message, children }: ErrorToastProps) {
  if (!message) return null

  return (
    <div
      role="alert"
      className="flex w-full flex-col gap-1 rounded-xl border border-[#f87168] bg-[#f87168]/10 px-3 py-2.5 backdrop-blur-[2px]"
    >
      <div className="flex items-center gap-2">
        <div aria-hidden className="size-4 shrink-0">
          <img src={warningTriangleIcon} alt="" className="size-full" />
        </div>
        <p className="break-words text-[10px] leading-[14px] text-[#1a1a17]">{message}</p>
      </div>
      {children}
    </div>
  )
}
