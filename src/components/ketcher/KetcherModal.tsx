import 'ketcher-react/dist/index.css'

import { Editor } from 'ketcher-react'
import { StandaloneStructServiceProvider } from 'ketcher-standalone'
import { useRef } from 'react'

// ─── Module Level ─────────────────────────────────────────────────────────────

const structServiceProvider = new StandaloneStructServiceProvider()

// ─── Types ────────────────────────────────────────────────────────────────────

// Ketcher editor instance (internal API)
interface KetcherInstance {
  getSmiles: () => Promise<string>
  setMolecule: (smiles: string) => Promise<void>
}

interface KetcherModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (smiles: string) => void
  initialSmiles?: string
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function KetcherModal({
  isOpen,
  onClose,
  onConfirm,
  initialSmiles,
}: KetcherModalProps) {
  const ketcherRef = useRef<KetcherInstance | null>(null)

  if (!isOpen) return null

  const handleConfirm = async () => {
    try {
      if (!ketcherRef.current) return
      const smiles = await ketcherRef.current.getSmiles()
      onConfirm(smiles)
      onClose()
    } catch (err) {
      console.error('[Ketcher] SMILES 도출 실패:', err)
    }
  }

  const handleEditorInit = (ketcher: KetcherInstance) => {
    ketcherRef.current = ketcher
    if (initialSmiles) void ketcher.setMolecule(initialSmiles)
  }

  const handleBackdropKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      onKeyDown={handleBackdropKeyDown}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="화학 구조 편집기"
        className="flex h-full max-h-[800px] w-full max-w-5xl flex-col rounded-xl bg-white shadow-2xl"
        style={{ overflow: 'visible' }}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-900">화학 구조 편집</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Ketcher 에디터 */}
        <div className="min-h-0 flex-1 relative" style={{ overflow: 'visible' }}>
          <Editor
            staticResourcesUrl={import.meta.env.VITE_KETCHER_ASSETS_URL || '/assets/ketcher'}
            structServiceProvider={structServiceProvider}
            onInit={handleEditorInit}
            errorHandler={(message: string) => console.error('[Ketcher]', message)}
          />
        </div>

        {/* 푸터 */}
        <div className="flex justify-end gap-2 border-t px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleConfirm as React.MouseEventHandler<HTMLButtonElement>}
            className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  )
}
