import type { ApiResponse } from '.'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StorageLocationNode {
  id: string
  name: string
  children?: StorageLocationNode[]
}

export interface CreateStorageLocationRequest {
  parentId: string | null
  name: string
}

export interface RenameStorageLocationRequest {
  id: string
  name: string
}

export interface UpdateStorageLocationOrderRequest {
  id: string
  parentId: string | null
  index: number
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

// [TEMP] 26.08.18
const seedStorageLocations: StorageLocationNode[] = [
  {
    id: 'loc-1',
    name: '본관',
    children: [
      {
        id: 'loc-1-1',
        name: '1층',
        children: [
          { id: 'loc-1-1-1', name: '시약보관실 A' },
          { id: 'loc-1-1-2', name: '시약보관실 B' },
        ],
      },
      {
        id: 'loc-1-2',
        name: '2층',
        children: [
          { id: 'loc-1-2-1', name: '기구보관실 1' },
          { id: 'loc-1-2-2', name: '기구보관실 2' },
        ],
      },
    ],
  },
  {
    id: 'loc-2',
    name: '별관',
    children: [
      {
        id: 'loc-2-1',
        name: '1층',
        children: [
          { id: 'loc-2-1-1', name: '소모품보관실 1' },
          { id: 'loc-2-1-2', name: '소모품보관실 2' },
        ],
      },
    ],
  },
]

// ─── API ─────────────────────────────────────────────────────────────────────

/** 보관위치 트리 전체 조회 */
// [TEMP] 26.08.18 백엔드 미연동 — 시드 트리를 그대로 반환. 연동 완료 시 아래 stub 제거
// export const getStorageLocations = (): Promise<ApiResponse<StorageLocationNode[]>> =>
//   api.get<StorageLocationNode[]>('/storage-locations')

// [TEMP] 26.08.18
export const getStorageLocations = (): Promise<ApiResponse<StorageLocationNode[]>> =>
  Promise.resolve({
    result: true,
    statusCode: 200,
    data: structuredClone(seedStorageLocations),
    message: [],
  })

/** 보관위치 노드 생성 (하위 위치 추가 포함) */
// [TEMP] 26.08.18 백엔드 미연동 — 항상 성공 처리. 연동 완료 시 아래 stub을 실제 API 호출로 교체
// export const createStorageLocation = (
//   body: CreateStorageLocationRequest
// ): Promise<ApiResponse<boolean>> => api.post<boolean>('/storage-locations', body)

// [TEMP] 26.08.18
export const createStorageLocation = (
  _body: CreateStorageLocationRequest
): Promise<ApiResponse<boolean>> =>
  Promise.resolve({ result: true, statusCode: 200, data: true, message: [] })

/** 보관위치 노드 이름 변경 */
// [TEMP] 26.08.18 백엔드 미연동 — 항상 성공 처리. 연동 완료 시 아래 stub을 실제 API 호출로 교체
// export const renameStorageLocation = (
//   body: RenameStorageLocationRequest
// ): Promise<ApiResponse<boolean>> => api.patch(`/storage-locations/${body.id}`, { name: body.name })

// [TEMP] 26.08.18
export const renameStorageLocation = (
  _body: RenameStorageLocationRequest
): Promise<ApiResponse<boolean>> =>
  Promise.resolve({ result: true, statusCode: 200, data: true, message: [] })

/** 보관위치 노드 삭제 (하위 노드 포함 전체 삭제) */
// [TEMP] 26.08.18 백엔드 미연동 — 항상 성공 처리. 연동 완료 시 아래 stub을 실제 API 호출로 교체
// export const deleteStorageLocation = (id: string): Promise<ApiResponse<boolean>> =>
//   api.delete(`/storage-locations/${id}`)

// [TEMP] 26.08.18
export const deleteStorageLocation = (_id: string): Promise<ApiResponse<boolean>> =>
  Promise.resolve({ result: true, statusCode: 200, data: true, message: [] })

/** 드래그로 변경된 보관위치의 새 부모/순서(index)를 반영 */
// [TEMP] 26.08.18 백엔드 미연동 — 항상 성공 처리. 연동 완료 시 아래 stub을 실제 API 호출로 교체
// export const updateStorageLocationOrder = (
//   body: UpdateStorageLocationOrderRequest
// ): Promise<ApiResponse<boolean>> => api.patch('/storage-locations/order', body)

// [TEMP] 26.08.18
export const updateStorageLocationOrder = (
  _body: UpdateStorageLocationOrderRequest
): Promise<ApiResponse<boolean>> =>
  Promise.resolve({ result: true, statusCode: 200, data: true, message: [] })
