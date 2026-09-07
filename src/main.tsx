import './index.css'

import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { ErrorBoundary } from './components/error/ErrorBoundary'
import { queryClient } from './queryClient'
import { router } from './router'

// dayjs 플러그인 초기화
dayjs.extend(utc)
dayjs.extend(timezone)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* 라우터(__root.tsx)의 errorComponent가 라우트 렌더링/로더 오류를 1차로 잡아주지만,
        QueryClientProvider 등 라우터 바깥에서 발생하는 예외까지는 잡지 못하므로 최상위에서
        한 번 더 감싸 이중으로 방어한다 */}
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>
)
