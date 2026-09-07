import { describe, expect, it, vi } from 'vitest'

import { render, screen } from '../../test/test-utils'
import { ErrorBoundary } from './ErrorBoundary'

/** 렌더링 시 항상 예외를 던지는 테스트 전용 컴포넌트 */
function Bomb(): never {
  throw new Error('테스트용 렌더링 오류')
}

describe('ErrorBoundary', () => {
  it('자식이 정상 렌더링되면 그대로 보여준다', () => {
    render(
      <ErrorBoundary>
        <div>정상 화면</div>
      </ErrorBoundary>
    )

    expect(screen.getByText('정상 화면')).toBeInTheDocument()
  })

  it('자식 렌더링 중 예외가 발생하면 화이트 스크린 대신 기본 안내 화면을 보여준다', () => {
    // React가 캐치된 에러도 콘솔에 함께 출력하므로 테스트 로그를 깔끔하게 유지하기 위해 억제한다
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    )

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('문제가 발생했습니다')).toBeInTheDocument()
    expect(consoleErrorSpy).toHaveBeenCalled()

    consoleErrorSpy.mockRestore()
  })

  it('fallback prop을 전달하면 커스텀 대체 UI를 렌더링한다', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary fallback={(error) => <div>커스텀 오류: {error.message}</div>}>
        <Bomb />
      </ErrorBoundary>
    )

    expect(screen.getByText('커스텀 오류: 테스트용 렌더링 오류')).toBeInTheDocument()

    vi.restoreAllMocks()
  })

  it('"다시 시도" 클릭 시 에러 상태를 초기화하고 children을 다시 렌더링한다', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    let shouldThrow = true
    function MaybeBomb() {
      if (shouldThrow) {
        throw new Error('일시적 오류')
      }
      return <div>복구된 화면</div>
    }

    const { rerender } = render(
      <ErrorBoundary>
        <MaybeBomb />
      </ErrorBoundary>
    )

    expect(screen.getByText('문제가 발생했습니다')).toBeInTheDocument()

    // 실제로는 재시도해도 같은 원인으로 다시 던져질 수 있으므로, 원인이 해소된 상태를
    // 가정하고 재시도 버튼 클릭 전에 조건을 바꿔둔다
    shouldThrow = false
    screen.getByRole('button', { name: '다시 시도' }).click()
    rerender(
      <ErrorBoundary>
        <MaybeBomb />
      </ErrorBoundary>
    )

    expect(screen.getByText('복구된 화면')).toBeInTheDocument()

    vi.restoreAllMocks()
  })
})
