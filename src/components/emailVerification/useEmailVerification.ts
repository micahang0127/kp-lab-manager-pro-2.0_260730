import { useMutation } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import type { ApiResponse } from '../../api'
import {
  type EmailVerificationLimitPurpose,
  formatLimitWindowHours,
  isAttemptLimitExceeded,
  useEmailVerificationLimitStore,
} from '../../stores/emailVerificationLimitStore'
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
  /** 발송 횟수 제한 설정. 지정하면 emailVerificationLimitStore에 기록된 로컬 카운트가 이
   *  한도를 초과했을 때 서버 API를 호출하지 않고 프론트에서 즉시 막는다. 실제 방어는 서버가
   *  담당하며(한도 초과 시 409 응답), 이 옵션은 그 정책을 화면에 선제 반영해 불필요한 요청을
   *  줄이기 위한 보조 가드일 뿐이다. 지정하지 않으면 이 가드 없이 항상 API를 호출한다(기존
   *  동작 유지) */
  sendLimit?: {
    purpose: EmailVerificationLimitPurpose
    maxAttempts: number
    windowMs: number
  }
  /** 이메일 입력칸 초기값. 이전 단계에서 이미 인증에 성공한 이메일이 있으면(예: 회원가입 중
   *  '이전' 버튼으로 이 화면에 되돌아온 경우) 다시 타이핑하지 않도록 복원하는 용도로 쓴다.
   *  인증번호(emailCode)는 시간 제한이 있는 1회용 값이라 복원 대상이 아니며, 재전송 후 다시
   *  입력해야 한다 */
  initialEmail?: string
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
  /** sendLimit으로 지정한 한도에 도달한 상태에서 사용자가 실제로 전송을 시도했는지 여부.
   *  sendLimit 미지정 시 항상 false다. 한도에 딱 도달한 시점(정상적으로 성공한 마지막 시도)
   *  자체는 포함하지 않고, 그 이후에 한 번 더 시도했을 때만 true가 된다 — 그래야 정상적으로
   *  성공한 마지막 시도에 대해 에러처럼 보이는 문구가 뜨지 않는다. true면 "인증번호 전송"/
   *  "재전송" 버튼을 비활성화하고 한도 초과 안내를 보여주는 데 사용한다 */
  isSendLimitExceeded: boolean
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
  sendLimit,
  initialEmail = '',
}: UseEmailVerificationOptions): UseEmailVerificationResult {
  const [email, setEmail] = useState(initialEmail)
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

  const limitRecords = useEmailVerificationLimitStore((s) => s.records)
  const recordLimitAttempt = useEmailVerificationLimitStore((s) => s.recordAttempt)
  // 한도(maxAttempts)에 "도달"한 것과 한도 초과 상태에서 "다시 시도"한 것은 구분해야 한다.
  // 정상적으로 성공한 마지막(예: 5번째) 시도 직후에는 카운트가 이미 한도에 도달해 있지만,
  // 그 시도 자체는 성공했으므로 에러를 보여주면 안 된다. 실제로 한도를 넘겨 다시 시도했을
  // 때만(sendCode 참고) isSendLimitReached를 true로 기록해 그때부터 에러/비활성화를 보여준다.
  const isAtOrOverSendLimit = sendLimit
    ? isAttemptLimitExceeded(
        limitRecords,
        sendLimit.purpose,
        email,
        sendLimit.maxAttempts,
        sendLimit.windowMs
      )
    : false
  const [isSendLimitReached, setIsSendLimitReached] = useState(false)
  // 이메일이 바뀌면 이전 이메일 기준의 "한도 초과 후 재시도" 표시는 이어지지 않아야 한다.
  // useEffect로 리셋하면 한 프레임 동안 이전 상태가 그대로 보이는 문제가 있어, 렌더링 중
  // 값이 바뀐 것을 감지해 즉시 반영하는 React 공식 패턴(state 파생값 비교)을 사용한다.
  const [lastEmailForSendLimit, setLastEmailForSendLimit] = useState(email)
  if (email !== lastEmailForSendLimit) {
    setLastEmailForSendLimit(email)
    setIsSendLimitReached(false)
  }

  const isSendLimitExceeded = isSendLimitReached && isAtOrOverSendLimit

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
      if (sendLimit) recordLimitAttempt(sendLimit.purpose, email, sendLimit.windowMs)
      setEmailCode('')
      setSentEmail(email)
      setExpiresAt(Date.now() + expiresInSeconds * 1000)
      setSendSuccessCount((count) => count + 1)
    },
  })

  const isCodeExpired = isCodeSent && timeLeft === 0

  const sendCode = () => {
    if (!isEmailValid || sendCodeMutation.isPending) return
    if (isAtOrOverSendLimit) {
      setIsSendLimitReached(true)
      return
    }
    sendCodeMutation.mutate()
  }

  const sendCodeError =
    isSendLimitExceeded && sendLimit
      ? `인증코드 발송 횟수(${sendLimit.maxAttempts}회)를 초과했습니다. 마지막 발송 후 ${formatLimitWindowHours(sendLimit.windowMs)}이 지나면 다시 요청할 수 있습니다.`
      : sendCodeMutation.error instanceof Error
        ? sendCodeMutation.error.message
        : null

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
    isSendLimitExceeded,
  }
}
