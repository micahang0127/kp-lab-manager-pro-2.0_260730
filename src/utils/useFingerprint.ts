import { useMutation } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'

import { issueFingerprint } from '../api/user'
import { useFingerprintStore } from '../stores/fingerprintStore'

/**
 * 브라우저 핑거프린트 코드를 반환하는 훅. 쿠키(fingerprintStore)에 이미 값이 있으면 그대로
 * 재사용하고, 없으면(최초 방문 등) 마운트 시 발급 API(issueFingerprint)를 호출해 쿠키에
 * 저장한다. 회원가입 이메일 인증, 로그인처럼 fingerprintCode가 필요한 화면에서 공용으로
 * 사용한다. 발급이 완료되기 전이거나 실패하면 null을 반환한다.
 */
export function useFingerprint(): string | null {
  const fingerprintCode = useFingerprintStore((s) => s.fingerprintCode)
  const saveFingerprintCode = useFingerprintStore((s) => s.saveFingerprintCode)
  // 재렌더링·mutate 참조 변경과 무관하게 마운트당 발급 요청을 정확히 1회만 보내기 위한 가드
  const hasRequestedRef = useRef(false)

  const { mutate } = useMutation({
    mutationFn: issueFingerprint,
    onSuccess: (res) => {
      if (res.data?.fingerprintCode) {
        saveFingerprintCode(res.data.fingerprintCode)
      }
    },
    // 발급 실패 시에도 fingerprintCode는 null로 유지하는 게 의도된 정책이지만(아래 반환문 참고),
    // 원인 파악이 가능하도록 최소한 콘솔에는 남긴다 — 그렇지 않으면 실패가 완전히 조용히
    // 묻혀서, 이후 화면(예: 이메일 인증코드 발송)에서 왜 fingerprintCode가 없는지 추적하기 어렵다
    onError: (err) => {
      console.error('[useFingerprint] 브라우저 지문 코드 발급 실패:', err)
    },
  })

  useEffect(() => {
    if (fingerprintCode || hasRequestedRef.current) return
    hasRequestedRef.current = true
    mutate()
  }, [fingerprintCode, mutate])

  return fingerprintCode
}
