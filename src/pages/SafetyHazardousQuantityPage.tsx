import { Layout } from '../components/layout/Layout'
import { PAGE_TITLES } from '../components/layout/sidebarMenu'

export function SafetyHazardousQuantityPage() {
  return (
    <Layout>
      <section aria-labelledby="safety-hazardous-quantity-page-title" className="w-full">
        <h1 id="safety-hazardous-quantity-page-title" className="text-2xl font-bold text-gray-900">
          {PAGE_TITLES['/safety/hazardous-quantity']}
        </h1>
        <p className="mt-2 text-sm text-gray-600">준비중입니다.</p>
      </section>
    </Layout>
  )
}
