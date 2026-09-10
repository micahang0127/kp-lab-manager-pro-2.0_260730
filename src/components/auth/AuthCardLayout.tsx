// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthCardLayoutProps {
  /** 카드 상단 제목 */
  title: string
  /** 제목 태그 — 기본 'h1'. 완료 안내 화면처럼 원래 heading이 아니었던 경우만 'p'로 지정 */
  titleAs?: 'h1' | 'p'
  /** 카드 내부 정렬 — 기본 'start'(items-start). 로그인류 중앙 정렬 폼은 'center' */
  align?: 'start' | 'center'
  /** 카드 최대 폭 — 기본 'default'(336px 고정). 반응형으로 더 넓어야 하는 화면만 'wide' */
  maxWidth?: 'default' | 'wide'
  /** 전달하면 카드 내부를 <form onSubmit>으로 감싼다. 없으면 <div> */
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void
  /** 카드 "바깥"에 같은 세로 스택으로 배치할 요소 (예: 회원가입 단계 진행 표시) */
  afterCard?: React.ReactNode
  children: React.ReactNode
}

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * 인증 관련 페이지(로그인·회원가입·아이디/비밀번호 찾기)가 공통으로 쓰는 카드형 레이아웃.
 * 화면 중앙에 흰색 카드를 배치하고 제목을 표시한 뒤 children을 그 안에 렌더링한다.
 * 각 페이지의 상태/로직에는 관여하지 않는 순수 레이아웃 컴포넌트다.
 */
export function AuthCardLayout({
  title,
  titleAs = 'h1',
  align = 'start',
  maxWidth = 'default',
  onSubmit,
  afterCard,
  children,
}: AuthCardLayoutProps) {
  const Title = titleAs
  const contentClassName = `flex w-full flex-col ${
    align === 'center' ? 'items-center' : 'items-start'
  } gap-8`

  const content = (
    <>
      <Title className="w-full text-center text-xl font-bold text-[#1a1a17]">{title}</Title>
      {children}
    </>
  )

  return (
    <div
      className={`flex flex-1 items-center justify-center px-4 py-10${
        afterCard ? ' flex-col gap-[10px]' : ''
      }`}
    >
      <div
        className={`w-full ${
          maxWidth === 'wide'
            ? 'mobile:max-w-[336px] tablet:max-w-[672px] web:max-w-[814px]'
            : 'max-w-[336px]'
        } rounded-xl border border-[#e0e0db] bg-white px-8 py-10`}
      >
        {onSubmit ? (
          <form onSubmit={onSubmit} className={contentClassName}>
            {content}
          </form>
        ) : (
          <div className={contentClassName}>{content}</div>
        )}
      </div>
      {afterCard}
    </div>
  )
}
