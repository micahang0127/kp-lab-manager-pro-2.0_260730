import { useState } from 'react'

import { loadDaumPostcodeScript } from './loadDaumPostcodeScript'

// ─── Types ────────────────────────────────────────────────────────────────────

export type AddressSearchStatus = 'idle' | 'loading' | 'error'

interface UseAddressSearchResult {
  status: AddressSearchStatus
  error: string | null
  search: () => Promise<void>
}

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * Daum 우편번호 서비스 팝업을 열고, 완료 시 도로명주소(없으면 지번주소)를 onComplete로 전달하는 훅.
 * 회원가입의 "사업장 소재지" 등 주소 입력이 필요한 곳에서 재사용한다.
 *
 * @param onComplete 주소 선택 완료 시 선택된 주소 문자열을 전달받는 콜백
 */
export function useAddressSearch(onComplete: (address: string) => void): UseAddressSearchResult {
  const [status, setStatus] = useState<AddressSearchStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const search = async () => {
    setStatus('loading')
    setError(null)

    try {
      await loadDaumPostcodeScript()
      const Postcode = window.daum?.Postcode
      if (!Postcode) throw new Error('주소 검색 서비스를 사용할 수 없습니다.')

      new Postcode({
        oncomplete: (data) => {
          onComplete(data.roadAddress || data.address)
          setStatus('idle')
        },
        // 주소를 선택하지 않고 팝업을 닫아도(예: 닫기 버튼, 바깥 영역 클릭) 버튼이
        // "불러오는 중" disabled 상태로 남지 않도록 idle로 되돌린다.
        onclose: () => {
          setStatus('idle')
        },
      }).open()
    } catch (err) {
      const message = err instanceof Error ? err.message : '주소 검색 중 오류가 발생했습니다.'
      setError(message)
      setStatus('error')
    }
  }

  return { status, error, search }
}
