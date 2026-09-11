interface ServerErrorBannerProps {
  /** 서버가 내려준 안내 문구. null/undefined/빈 문자열이면 아무것도 렌더링하지 않는다 */
  message?: string | null
  /** 배너 안에 함께 노출할 보조 액션 (예: "비밀번호 찾기" 링크) */
  children?: React.ReactNode
}

/**
 * 서버 message를 그대로 보여주는 공통 에러 배너. 로그인·로그인 2차 인증처럼 서버가 내려준
 * 문구(잠금 안내, 남은 시도 횟수 등)를 가공 없이 그대로 노출해야 하는 화면에서 사용한다.
 */
export function ServerErrorBanner({ message, children }: ServerErrorBannerProps) {
  if (!message) return null

  return (
    <div
      role="alert"
      className="flex w-full flex-col gap-1 rounded border border-[#d44038] bg-[#d44038]/10 px-3 py-2 text-xs text-[#d44038]"
    >
      <p>{message}</p>
      {children}
    </div>
  )
}
