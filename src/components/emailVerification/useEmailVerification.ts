import { useMutation } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import type { ApiResponse } from '../../api'
import { EMAIL_CODE_EXPIRES_IN_SECONDS, isValidEmail } from '../../utils/rules/validationRules'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SendEmailCodeResult {
  /** 인증코드 발송 성공 여부 */
  success: boolean
}

interface UseEmailVerificationOptions {
  /** 인증번호 발송 API 호출 함수. 화면(회원가입/계정 찾기 등)마다 엔드포인트가 다르므로 주입받는다 */
  sendCode: (email: string) => Promise<ApiResponse<SendEmailCodeResult>>
  /** 인증번호 유효 시간(초). 발송 API 응답에 유효 시간이 내려오지 않아 프론트에서 관리하며,
   *  기본값은 EMAIL_CODE_EXPIRES_IN_SECONDS(180초)다 */
  expiresInSeconds?: number
}

export interface UseEmailVerificationResult {
  email: string
  setEmail: (value: string) => void
  isEmailValid: boolean
  emailCode: string
  setEmailCode: (value: string) => void
  /** 인증번호를 전송한 적이 있는지 여부 (이메일 입력칸 비활성화 등에 사용) */
  isCodeSent: boolean
  /** 인증번호 발송(최초 전송/재전송 모두 포함)에 성공한 횟수. 호출 측이 이 값의 변화를
   *  감지해 자체 인증번호 확인(verify) mutation의 이전 실패 상태(에러 메시지 등)를
   *  초기화하는 데 사용한다 — 재전송해도 이전 "인증번호가 틀렸습니다" 에러 UI가
   *  그대로 남아있는 문제를 막기 위함 */
  sendSuccessCount: number
  /** 남은 유효 시간(초) */
  timeLeft: number
  /** 유효 시간이 만료되었는지 여부 */
  isCodeExpired: boolean
  /** 인증번호 전송(최초 전송/재전송 공용) */
  sendCode: () => void
  isSending: boolean
  sendCodeError: string | null
}

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * 이메일 인증번호 발송 + 유효시간 타이머 + 인증번호 입력값을 캡슐화한 훅.
 * "이메일로 인증번호를 보내고 입력받는" 화면(회원가입 이메일 인증 등)에서 공통으로 재사용한다.
 * 인증번호 최종 검증(확인) API는 화면마다 응답 처리 방식이 달라 이 훅의 책임 밖이며,
 * 호출 측이 반환된 email/emailCode 값으로 별도 mutation을 구성해야 한다.
 */
export function useEmailVerification({
  sendCode: sendCodeApi,
  expiresInSeconds = EMAIL_CODE_EXPIRES_IN_SECONDS,
}: UseEmailVerificationOptions): UseEmailVerificationResult {
  const [email, setEmail] = useState('')
  const [emailCode, setEmailCode] = useState('')
  const [expiresAt, setExpiresAt] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  // 인증번호가 실제로 발송된 이메일 주소 — 전송 이후 사용자가 이메일을 다시 수정하면
  // 이 값과 달라지므로, isCodeSent가 자동으로 false가 되어 "인증번호 전송" 버튼이
  // 재활성화되고("재전송"이 아닌 최초 전송으로 취급) 인증번호 입력칸도 다시 잠긴다
  const [sentEmail, setSentEmail] = useState<string | null>(null)
  const [sendSuccessCount, setSendSuccessCount] = useState(0)

  const isEmailValid = isValidEmail(email)
  const isCodeSent = expiresAt !== null && email === sentEmail

  // ─── 인증번호 유효 시간 타이머 ─────────────────────────────────────────────────

  useEffect(() => {
    const tick = () => {
      setTimeLeft(expiresAt ? Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)) : 0)
    }

    tick()
    if (!expiresAt) return

    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [expiresAt])

  // ─── Mutation ──────────────────────────────────────────────────────────────────

  const sendCodeMutation = useMutation({
    mutationFn: () => sendCodeApi(email),
    onSuccess: (res) => {
      if (!res.data?.success) return
      setEmailCode('')
      setSentEmail(email)
      setExpiresAt(Date.now() + expiresInSeconds * 1000)
      setSendSuccessCount((count) => count + 1)
    },
  })

  const isCodeExpired = isCodeSent && timeLeft === 0

  const sendCode = () => {
    if (!isEmailValid || sendCodeMutation.isPending) return
    sendCodeMutation.mutate()
  }

  const sendCodeError =
    sendCodeMutation.error instanceof Error ? sendCodeMutation.error.message : null

  return {
    email,
    setEmail,
    isEmailValid,
    emailCode,
    setEmailCode,
    isCodeSent,
    sendSuccessCount,
    timeLeft,
    isCodeExpired,
    sendCode,
    isSending: sendCodeMutation.isPending,
    sendCodeError,
  }
}
