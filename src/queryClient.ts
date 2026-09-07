import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
  // 각 페이지가 개별적으로 isError/onError를 확인해 에러를 안내하는 것이 기본이지만, 그걸
  // 깜빡해도 최소한 콘솔에는 남도록 하는 안전망이다. 페이지가 자체적으로 처리한 에러까지
  // 여기서 다시 사용자에게 노출하면 안 되므로, 사용자 알림(토스트 등)은 추가하지 않고 로깅만
  // 한다 — 공통 토스트 컴포넌트가 생기면 이 자리에 추가한다.
  queryCache: new QueryCache({
    onError: (error, query) => {
      console.error(`[QueryClient] 쿼리 실패 (${JSON.stringify(query.queryKey)}):`, error)
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      console.error(
        `[QueryClient] mutation 실패${mutation.options.mutationKey ? ` (${JSON.stringify(mutation.options.mutationKey)})` : ''}:`,
        error
      )
    },
  }),
})
