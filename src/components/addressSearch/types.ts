// ─── Types ────────────────────────────────────────────────────────────────────

/** Daum 우편번호 서비스 팝업 완료 시 전달되는 데이터 (사용하는 필드만 최소 정의) */
export interface DaumPostcodeData {
  zonecode: string
  address: string
  roadAddress: string
  jibunAddress: string
}

export interface DaumPostcodeOptions {
  oncomplete: (data: DaumPostcodeData) => void
  onclose?: () => void
}

export interface DaumPostcodeInstance {
  open: () => void
}

declare global {
  interface Window {
    daum?: {
      Postcode: new (options: DaumPostcodeOptions) => DaumPostcodeInstance
    }
  }
}
