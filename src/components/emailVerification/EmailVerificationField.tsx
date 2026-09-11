import clearCircleIcon from '../../assets/icons/register/clear-circle.svg'
import { formatTimeLeft } from '../../utils/formatTimeLeft'
import {
  EMAIL_CODE_LENGTH,
  EMAIL_RULE_MESSAGE,
  HANGUL_INPUT_MESSAGE,
} from '../../utils/rules/validationRules'
import { useHangulGuardedInput } from '../../utils/useHangulGuardedInput'
import { ErrorMessage } from '../error/ErrorMessage'
import { EmailCodeInput } from './EmailCodeInput'
import type { UseEmailVerificationResult } from './useEmailVerification'

// ─── Types ────────────────────────────────────────────────────────────────────

interface EmailVerificationFieldProps {
  /** 이메일 입력 input의 id (label htmlFor와 연결) */
  emailId: string
  /** 이메일 입력칸 라벨 (기본값 '이메일 *') */
  emailLabel?: string
  /** 이메일 입력칸 placeholder (기본값 '회사 이메일을 입력해 주세요') */
  emailPlaceholder?: string
  /** 인증번호 입력칸 라벨 (기본값 '인증번호 *') */
  codeLabel?: string
  /** 인증번호 입력칸 각 자리의 aria-label 접두어 (기본값 '인증번호') */
  codeAriaLabel?: string
  /** 인증번호 자릿수 (기본값 EMAIL_CODE_LENGTH) */
  codeLength?: number
  /** useEmailVerification 훅의 반환값 — 이메일/인증번호 발송 상태를 그대로 전달받는다 */
  verification: UseEmailVerificationResult
  /** 인증번호 최종 확인(호출 측 verify mutation) 실패 시 에러 메시지 — 서버가 내려준 메시지를
   *  그대로 표시한다 */
  codeError?: string | null
  /** true면 이메일 입력칸을 비활성화(disabled)한다(기본 false). 로그인 2차 인증처럼 이전
   *  단계에서 이메일이 이미 확정되어 변경하면 검증이 깨지는 화면에서 사용한다. 비활성화 상태일
   *  때는 한글/형식 오류 문구를 표시하지 않는다(사용자가 직접 입력한 값이 아니므로 검증 대상이
   *  아님) */
  emailDisabled?: boolean
}

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * 이메일 입력 → 인증번호 전송 → 인증번호 입력(+ 남은 시간/재전송)까지의 UI를 묶은 공통 필드.
 * 회원가입 이메일 인증 등 "이메일로 인증번호를 받아 확인"하는 화면에서 재사용한다.
 * 상태/발송 로직은 `useEmailVerification` 훅이 담당하고, 이 컴포넌트는 그 결과를 그대로
 * 렌더링만 한다 — 인증번호 최종 검증(확인 버튼 클릭 시 동작)은 호출 측이 별도로 구성한다.
 */
export function EmailVerificationField({
  emailId,
  emailLabel = '이메일 *',
  emailPlaceholder = '회사 이메일을 입력해 주세요',
  codeLabel = '인증번호 *',
  codeAriaLabel = '인증번호',
  codeLength = EMAIL_CODE_LENGTH,
  verification,
  codeError,
  emailDisabled = false,
}: EmailVerificationFieldProps) {
  const {
    email,
    setEmail,
    isEmailValid,
    emailCode,
    setEmailCode,
    isCodeSent,
    timeLeft,
    isCodeExpired,
    sendCode,
    isSending,
    sendCodeError,
    isSendLimitExceeded,
  } = verification

  // 이메일은 한글을 허용하지 않는다. 조합(IME) 중에는 값을 건드리지 않다가 조합이 끝난
  // 시점에만 한글을 제거해 반영한다(그렇지 않으면 조합이 깨지면서 엉뚱한 영문자가 입력되는
  // 문제가 있음)
  const {
    hasHangulInput,
    handleChange: handleEmailChange,
    handleCompositionStart: handleEmailCompositionStart,
    handleCompositionEnd: handleEmailCompositionEnd,
  } = useHangulGuardedInput({ onChange: setEmail })

  // 한글은 아니지만 형식 자체가 이메일이 아닌 경우(예: '@' 누락) — 아직 입력 중일 수 있는
  // 빈 값에는 표시하지 않는다. emailDisabled일 때는 사용자가 직접 입력한 값이 아니므로
  // (이전 단계에서 이미 검증된 값) 한글/형식 오류 자체를 판정하지 않는다
  const isEmailFormatInvalid =
    !emailDisabled && email.length > 0 && !hasHangulInput && !isEmailValid
  const showHangulError = !emailDisabled && hasHangulInput

  // 입력값 자체가 잘못된 경우(한글 입력, 형식 오류) + 서버가 이메일 자체를 거부한 경우(발송 실패)를
  // 묶어 "이메일 입력 오류" 상태로 취급 — 입력칸 테두리를 빨간색으로 강조한다
  const hasEmailError = showHangulError || isEmailFormatInvalid || Boolean(sendCodeError)

  return (
    <>
      <div className="flex w-full flex-col items-start gap-1">
        <label htmlFor={emailId} className="text-xs font-medium text-[#6b6b66]">
          {emailLabel}
        </label>
        <div className="flex w-full items-start gap-1">
          <div
            className={`flex h-10 flex-1 items-center gap-2 rounded border px-3 ${
              emailDisabled ? 'bg-gray-100' : 'bg-white'
            } ${hasEmailError ? 'border-[#bf3329]' : 'border-[#c9c9c4]'}`}
          >
            <input
              id={emailId}
              type="email"
              required
              disabled={emailDisabled}
              value={email}
              onChange={handleEmailChange}
              onCompositionStart={handleEmailCompositionStart}
              onCompositionEnd={handleEmailCompositionEnd}
              placeholder={emailPlaceholder}
              className={`flex-1 bg-transparent text-xs outline-none ${
                emailDisabled ? 'text-[#6b6b66]' : 'text-black'
              }`}
            />
            {/* emailDisabled(로그인 2차 인증처럼 이메일이 이전 단계에서 이미 확정된 화면)일 때는
                지울 수 있는 값이 아니므로 지우기 버튼 자체를 노출하지 않는다 */}
            {!emailDisabled && email && (
              <button
                type="button"
                aria-label="이메일 입력값 지우기"
                onClick={() => setEmail('')}
                className="flex size-4 shrink-0 items-center justify-center"
              >
                <img src={clearCircleIcon} alt="" aria-hidden className="size-3" />
              </button>
            )}
          </div>
          <button
            type="button"
            disabled={!isEmailValid || isCodeSent || isSending || isSendLimitExceeded}
            onClick={sendCode}
            className="flex h-10 w-[100px] shrink-0 items-center justify-center rounded border border-[#c9c9c4] bg-white px-2 text-center text-xs text-[#2b2b29] disabled:opacity-30"
          >
            인증번호 전송
          </button>
        </div>
        {showHangulError && <ErrorMessage message={HANGUL_INPUT_MESSAGE} />}
        {!showHangulError && isEmailFormatInvalid && <ErrorMessage message={EMAIL_RULE_MESSAGE} />}
        <ErrorMessage message={sendCodeError} />
      </div>

      <div className="flex w-full flex-col items-start gap-1">
        <p className="text-xs font-medium text-[#6b6b66]">{codeLabel}</p>
        <div className="flex w-full flex-col items-start gap-3">
          <EmailCodeInput
            length={codeLength}
            value={emailCode}
            onChange={setEmailCode}
            disabled={!isCodeSent || isCodeExpired}
            error={Boolean(codeError)}
            ariaLabel={codeAriaLabel}
          />
          <div className="flex w-full items-center justify-between">
            <p className="text-xs font-medium text-[#1a1a17] opacity-50">
              {isCodeSent
                ? `남은 시간 ${formatTimeLeft(timeLeft)}`
                : '이메일 인증번호를 전송해 주세요'}
            </p>
            <button
              type="button"
              disabled={!isCodeSent || isSending || isSendLimitExceeded}
              onClick={sendCode}
              className="text-xs font-medium text-[#1a1a17] opacity-50 disabled:opacity-30"
            >
              재전송
            </button>
          </div>
        </div>
        {isCodeExpired && <ErrorMessage message="인증 시간이 만료되었습니다. 재전송해 주세요." />}
        <ErrorMessage message={codeError} />
      </div>
    </>
  )
}
