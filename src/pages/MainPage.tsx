import { useNavigate } from '@tanstack/react-router'

import { Layout } from '../components/layout/Layout'
import { useAuthStore } from '../stores/authStore'
import { formatDate, formatDateTime } from '../utils/date'

export function MainPage() {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)

  const handleLogout = async () => {
    logout()
    await navigate({ to: '/login' })
  }

  const sampleUtcDate = '2024-01-15T09:00:00Z'

  return (
    <Layout>
      <section className="w-full">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">메인 페이지</h1>

        <div className="mb-6 rounded border border-gray-200 bg-gray-50 p-4">
          <h2 className="mb-2 text-lg font-semibold text-gray-700">날짜 포맷 예제</h2>
          <p className="mb-1 text-sm text-gray-600">
            UTC: <span className="font-mono">{sampleUtcDate}</span>
          </p>
          <p className="mb-1 text-sm text-gray-600">
            formatDate: <span className="font-mono text-blue-600">{formatDate(sampleUtcDate)}</span>
          </p>
          <p className="text-sm text-gray-600">
            formatDateTime:{' '}
            <span className="font-mono text-blue-600">{formatDateTime(sampleUtcDate)}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            void handleLogout()
          }}
          className="mt-6 rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
        >
          로그아웃
        </button>
      </section>
    </Layout>
  )
}
