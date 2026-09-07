import type { ErrorInfo, ReactNode } from 'react'
import { Component } from 'react'

import { ErrorFallback } from './ErrorFallback'

interface ErrorBoundaryProps {
  children: ReactNode
  /** 에러 발생 시 보여줄 대체 UI. 생략하면 공통 `ErrorFallback`을 렌더링한다 */
  fallback?: (error: Error, reset: () => void) => ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

/**
 * 하위 트리 렌더링 중 발생한 예외를 잡아 화이트 스크린 대신 안내 화면을 보여주는
 * 최상위 방어막. React 에러 바운더리는 클래스 컴포넌트로만 구현 가능하다
 * (`getDerivedStateFromError`/`componentDidCatch`는 훅으로 제공되지 않음).
 *
 * 라우터(`src/routes/__root.tsx`)의 `errorComponent`가 라우트 컴포넌트/로더 오류를 1차로
 * 잡아주지만, 라우터 자체가 초기화되기 전이나 `QueryClientProvider` 등 라우터 바깥 트리에서
 * 발생하는 예외까지는 잡지 못하므로 `main.tsx`에서 한 번 더 감싸 이중으로 방어한다.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] 렌더링 중 처리되지 않은 오류:', error, errorInfo)
  }

  reset = (): void => {
    this.setState({ error: null })
  }

  render() {
    const { error } = this.state
    if (!error) {
      return this.props.children
    }
    if (this.props.fallback) {
      return this.props.fallback(error, this.reset)
    }
    return <ErrorFallback onRetry={this.reset} />
  }
}
