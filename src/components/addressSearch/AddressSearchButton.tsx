import { useAddressSearch } from './useAddressSearch'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AddressSearchButtonProps {
  label?: string
  onComplete: (address: string) => void
}

// ─── Component ─────────────────────────────────────────────────────────────────

/** Daum 우편번호 서비스 팝업을 열어 주소를 검색하는 버튼. 선택 완료 시 onComplete로 상위에 전달한다. */
export function AddressSearchButton({ label = '주소검색', onComplete }: AddressSearchButtonProps) {
  const { status, error, search } = useAddressSearch(onComplete)
  const isLoading = status === 'loading'

  return (
    <div>
      <button
        type="button"
        disabled={isLoading}
        onClick={() => {
          void search()
        }}
        className="rounded border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
      >
        {isLoading ? '불러오는 중...' : label}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
