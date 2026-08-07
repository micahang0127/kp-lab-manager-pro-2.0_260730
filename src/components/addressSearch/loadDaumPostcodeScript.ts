import './types'
// [NOTE] 위 import는 값을 가져오지 않지만, 이 파일이 window.daum 전역 타입 선언(types.ts)에
// 의존함을 명시하고 tsconfig include 여부와 무관하게 타입이 로드되도록 보장하기 위한 부수효과 import.

// ─── Constants ────────────────────────────────────────────────────────────────

const DAUM_POSTCODE_SCRIPT_SRC = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'
const DAUM_POSTCODE_SCRIPT_ID = 'daum-postcode-script'

// ─── State ────────────────────────────────────────────────────────────────────

let loadPromise: Promise<void> | null = null

// ─── Script Loader ────────────────────────────────────────────────────────────

/**
 * Daum 우편번호 서비스 스크립트를 동적으로 로드한다.
 * 이미 로드되어 있으면 즉시 resolve, 로드 중이면 캐시된 Promise를 재사용한다.
 */
export function loadDaumPostcodeScript(): Promise<void> {
  if (window.daum?.Postcode) return Promise.resolve()
  if (loadPromise) return loadPromise

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.id = DAUM_POSTCODE_SCRIPT_ID
    script.src = DAUM_POSTCODE_SCRIPT_SRC
    script.onload = () => resolve()
    script.onerror = () => {
      loadPromise = null
      reject(new Error('주소 검색 서비스를 불러오지 못했습니다.'))
    }
    document.head.appendChild(script)
  })

  return loadPromise
}
