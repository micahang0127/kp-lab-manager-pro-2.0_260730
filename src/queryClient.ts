import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
  // 각 페이지가 개별적으로 isError/onError를 확인해 에러를 안내하는 것이 기본이지만(5xx 포함,
  // 별도의 전역 배너 없이 각 화면이 알아서 노출한다), 그걸 깜빡해도 최소한 콘솔에는 남도록
  // 하는 안전망이다. 페이지가 자체적으로 처리한 에러까지 여기서 다시 사용자에게 노출하면
  // 안 되므로, 사용자 알림(토스트 등)은 추가하지 않고 로깅만 한다.
  queryCache: new QueryCache({
    onError: (error, query) => {
      console.error(`[QueryClient] 쿼리 실패 (${JSON.stringify(query.queryKey)}):`, error)
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      // 로그인 실패(계정 잠금·비밀번호 오류 등)처럼 페이지가 이미 화면에 에러를 안내하고 있어
      // "정상적으로 발생하는" 사용자 입력 오류까지 안전망이 또 콘솔에 남기면, 실제 버그와
      // 구분이 안 돼 콘솔이 시끄러워진다 — meta: { suppressConsoleLog: true }로 표시된
      // mutation은 이 안전망 로깅에서 제외한다.
      if (mutation.meta?.suppressConsoleLog) return

      console.error(
        `[QueryClient] mutation 실패${mutation.options.mutationKey ? ` (${JSON.stringify(mutation.options.mutationKey)})` : ''}:`,
        error
      )
    },
  }),
})
