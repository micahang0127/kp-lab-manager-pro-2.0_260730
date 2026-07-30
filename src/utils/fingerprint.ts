import FingerprintJS from '@fingerprintjs/fingerprintjs'

// 모듈 로드 시 즉시 초기화 — LoginPage 렌더 시점부터 준비됨
const fpPromise = FingerprintJS.load()

/**
 * 브라우저 핑거프린트 visitorId를 반환합니다.
 * 실패 시 null 반환 — 로그인 흐름을 절대 차단하지 않습니다.
 */
export async function getFingerprint(): Promise<string | null> {
  try {
    const fp = await fpPromise
    const result = await fp.get()
    return result.visitorId
  } catch {
    return null
  }
}
