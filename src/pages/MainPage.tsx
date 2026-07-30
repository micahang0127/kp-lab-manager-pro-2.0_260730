import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import { KetcherLoader } from '../components/ketcher/KetcherLoader'
import { Layout } from '../components/layout/Layout'
import { useAuthStore } from '../stores/authStore'
import { formatDate, formatDateTime } from '../utils/date'

export function MainPage() {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)

  // Ketcher 상태
  const [isKetcherOpen, setIsKetcherOpen] = useState(false)
  const [smiles, setSmiles] = useState('')

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

        {/* ─── Ketcher 섹션 ─────────────────────────────────────────── */}

        <div className="my-6 flex items-center gap-3">
          <hr className="flex-1 border-gray-200" />
          <span className="text-xs text-gray-400">화학 구조</span>
          <hr className="flex-1 border-gray-200" />
        </div>

        <button
          type="button"
          onClick={() => setIsKetcherOpen(true)}
          className="w-full rounded border border-indigo-300 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
        >
          화학 구조 그리기 (SMILES)
        </button>

        {smiles && (
          <p className="mt-2 break-all rounded border border-gray-200 bg-gray-50 p-2 font-mono text-xs text-gray-700">
            SMILES: {smiles}
          </p>
        )}

        <KetcherLoader
          isOpen={isKetcherOpen}
          onClose={() => setIsKetcherOpen(false)}
          onConfirm={(result) => {
            setSmiles(result)
          }}
        />

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
