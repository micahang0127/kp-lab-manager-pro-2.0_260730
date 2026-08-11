import { Layout } from '../components/layout/Layout'
import { PAGE_TITLES } from '../components/layout/sidebarMenu'

// [TEMP] 26.08.11 하위 기능 미구현 — 사이드바 자리만 확보한 placeholder 페이지. 실제 기능 구현 시 교체
export function SettingsGroupPage() {
  return (
    <Layout>
      <section aria-labelledby="settings-group-page-title" className="w-full">
        <h1 id="settings-group-page-title" className="text-2xl font-bold text-gray-900">
          {PAGE_TITLES['/settings/group']}
        </h1>
        <p className="mt-2 text-sm text-gray-600">준비중입니다.</p>
      </section>
    </Layout>
  )
}
