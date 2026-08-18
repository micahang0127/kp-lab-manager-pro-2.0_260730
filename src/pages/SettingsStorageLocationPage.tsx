import { useQuery } from '@tanstack/react-query'

import { getStorageLocations } from '../api/storageLocation'
import { Layout } from '../components/layout/Layout'
import { PAGE_TITLES } from '../components/layout/sidebarMenu'
import { StorageLocationTree } from '../components/storageLocation/StorageLocationTree'

export function SettingsStorageLocationPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['storageLocations'],
    queryFn: getStorageLocations,
    select: (res) => res.data,
  })

  return (
    <Layout>
      <section aria-labelledby="settings-storage-location-page-title" className="w-full">
        <h1 id="settings-storage-location-page-title" className="text-2xl font-bold text-gray-900">
          {PAGE_TITLES['/settings/storage-location']}
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          보관위치를 계층 구조로 관리합니다. 드래그로 순서를 바꾸거나 하위 위치를 추가/삭제할 수
          있습니다.
        </p>

        {isLoading && <p className="mt-4 text-sm text-gray-600">불러오는 중...</p>}
        {isError && (
          <p role="alert" className="mt-4 text-sm text-red-600">
            보관위치 목록을 불러오지 못했습니다.
          </p>
        )}

        {data && (
          <div className="mt-4">
            <StorageLocationTree initialData={data} />
          </div>
        )}
      </section>
    </Layout>
  )
}
