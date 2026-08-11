import { Layout } from '../components/layout/Layout'
import { PAGE_TITLES } from '../components/layout/sidebarMenu'

// [TEMP] 26.08.11 하위 기능 미구현 — 기관관리 > 위치 및 보관함에서 이동. 실제 기능 구현 시 교체
export function SettingsStorageLocationPage() {
  return (
    <Layout>
      <section aria-labelledby="settings-storage-location-page-title" className="w-full">
        <h1 id="settings-storage-location-page-title" className="text-2xl font-bold text-gray-900">
          {PAGE_TITLES['/settings/storage-location']}
        </h1>
        <p className="mt-2 text-sm text-gray-600">준비중입니다.</p>
      </section>
    </Layout>
  )
}
