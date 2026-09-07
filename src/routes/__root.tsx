import type { ErrorComponentProps } from '@tanstack/react-router'
import { createRootRoute, Outlet } from '@tanstack/react-router'

import { ErrorFallback } from '../components/error/ErrorFallback'

export const Route = createRootRoute({
  component: RootComponent,
  // 개별 라우트가 자체 errorComponent를 두지 않는 한, 렌더링/로더 중 발생한 예외는 모두
  // 여기로 버블링된다 — 화이트 스크린 대신 공통 안내 화면을 보여준다.
  errorComponent: RootErrorComponent,
})

function RootComponent() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900">
      <Outlet />
    </div>
  )
}

function RootErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error('[Router] 라우트 렌더링 중 처리되지 않은 오류:', error)
  return <ErrorFallback onRetry={reset} />
}
