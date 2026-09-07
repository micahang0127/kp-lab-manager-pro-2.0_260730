interface ErrorFallbackProps {
  /** "다시 시도" 클릭 시 실행할 콜백 (에러 바운더리 상태 초기화 등) */
  onRetry: () => void
}

/**
 * 렌더링 중 처리되지 않은 예외가 발생했을 때 화이트 스크린 대신 보여줄 공통 안내 화면.
 * `ErrorBoundary`와 라우터 루트의 `errorComponent`에서 함께 사용한다.
 */
export function ErrorFallback({ onRetry }: ErrorFallbackProps) {
  return (
    <div
      role="alert"
      className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 p-6 text-center"
    >
      <h1 className="text-xl font-bold text-gray-900">문제가 발생했습니다</h1>
      <p className="text-sm text-gray-600">
        예상치 못한 오류로 화면을 표시할 수 없습니다. 잠시 후 다시 시도해주세요.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onRetry}
          className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          다시 시도
        </button>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          새로고침
        </button>
      </div>
    </div>
  )
}
