import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { RenderOptions } from '@testing-library/react'
import React from 'react'
import type { ReactElement } from 'react'

// 테스트용 QueryClient 생성 함수
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  })

// 모든 테스트에서 공통으로 필요한 프로바이더들을 래핑하는 컴포넌트
export function AllTheProviders({ children }: { children: React.ReactNode }) {
  const queryClient = createTestQueryClient()
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

// 기존 render 함수를 확장한 커스텀 render 함수
const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(ui, { wrapper: AllTheProviders, ...options })

// testing-library의 모든 것을 다시 내보내고, 커스텀 render를 덮어씁니다.
export * from '@testing-library/react'
export { customRender as render }
