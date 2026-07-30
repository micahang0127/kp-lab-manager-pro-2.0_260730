import { lazy, Suspense } from 'react'

const KetcherModal = lazy(() => import('./KetcherModal'))

interface KetcherLoaderProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (smiles: string) => void
  initialSmiles?: string
}

export function KetcherLoader(props: KetcherLoaderProps) {
  if (!props.isOpen) return null

  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded bg-white px-6 py-4 text-sm text-gray-700">
            화학 구조 편집기를 불러오는 중...
          </div>
        </div>
      }
    >
      <KetcherModal {...props} />
    </Suspense>
  )
}
