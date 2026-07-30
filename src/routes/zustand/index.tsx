import { createFileRoute } from '@tanstack/react-router'

import { ZustandExample } from '../../pages/ZustandExample'
import { requireAuth } from '../../utils/requireAuth'

export const Route = createFileRoute('/zustand/')({
  beforeLoad: requireAuth,
  component: ZustandPage,
})

export function ZustandPage() {
  return (
    <section aria-labelledby="zustand-page-title" className="w-full">
      <div className="mb-6">
        <h1 id="zustand-page-title" className="text-2xl font-bold text-gray-900">
          Zustand
        </h1>
        <p className="mt-1 text-sm text-gray-600">전역 상태 관리 예시 페이지</p>
      </div>
      <div className="max-w-2xl">
        <ZustandExample />
      </div>
    </section>
  )
}
