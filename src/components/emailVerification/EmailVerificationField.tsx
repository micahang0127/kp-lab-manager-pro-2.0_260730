import checkCircleIcon from '../../assets/icons/register/check-circle.svg'
import {
  EMAIL_CODE_LENGTH,
  EMAIL_RULE_MESSAGE,
  HANGUL_INPUT_MESSAGE,
} from '../../utils/rules/validationRules'
import { useHangulGuardedInput } from '../../utils/useHangulGuardedInput'
import { EmailCodeInput } from './EmailCodeInput'
import type { UseEmailVerificationResult } from './useEmailVerification'

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** 초 단위 남은 시간을 'MM:SS' 형식으로 변환 */
function formatTimeLeft(seconds: number): string {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

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
  /** 인증번호 최종 확인(호출 측 verify mutation) 실패 시 에러 메시지 */
  codeError?: string | null
  /** 인증번호 입력칸을 강제로 비활성화할지 여부(기본 false). 호출 측이 자체적으로 판단한 한도
   *  초과(예: 인증 실패 5회 초과) 등을 반영할 때 사용하며, 이 컴포넌트는 "한도"라는 개념 자체는
   *  몰라도 되도록 boolean만 받는다 */
  codeDisabled?: boolean
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
  codeDisabled = false,
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
  // 빈 값에는 표시하지 않는다
  const isEmailFormatInvalid = email.length > 0 && !hasHangulInput && !isEmailValid

  // 입력값 자체가 잘못된 경우(한글 입력, 형식 오류) + 서버가 이메일 자체를 거부한 경우(발송 실패)를
  // 묶어 "이메일 입력 오류" 상태로 취급 — 입력칸 테두리를 빨간색으로 강조한다
  const hasEmailError = hasHangulInput || isEmailFormatInvalid || Boolean(sendCodeError)

  return (
    <>
      <div className="flex w-full flex-col items-start gap-1">
        <label htmlFor={emailId} className="text-xs font-medium text-[#6b6b66]">
          {emailLabel}
        </label>
        <div className="flex w-full items-start gap-1">
          <div
            className={`flex h-10 flex-1 items-center gap-2 rounded border bg-white px-3 ${
              hasEmailError ? 'border-[#bf3329]' : 'border-[#c9c9c4]'
            }`}
          >
            <input
              id={emailId}
              type="email"
              required
              value={email}
              onChange={handleEmailChange}
              onCompositionStart={handleEmailCompositionStart}
              onCompositionEnd={handleEmailCompositionEnd}
              placeholder={emailPlaceholder}
              className="flex-1 text-xs text-black outline-none"
            />
            {isEmailValid && (
              <img src={checkCircleIcon} alt="" aria-hidden className="size-4 shrink-0" />
            )}
          </div>
          <button
            type="button"
            disabled={!isEmailValid || isCodeSent || isSending || isSendLimitExceeded}
            onClick={sendCode}
            className="flex h-10 w-[100px] shrink-0 items-center justify-center rounded border border-[#c9c9c4] bg-white px-2 text-center text-xs text-[#2b2b29] disabled:opacity-30"
          >
            {isSending ? '전송 중...' : '인증번호 전송'}
          </button>
        </div>
        {hasHangulInput && <p className="text-[10px] text-red-600">{HANGUL_INPUT_MESSAGE}</p>}
        {!hasHangulInput && isEmailFormatInvalid && (
          <p className="text-[10px] text-red-600">{EMAIL_RULE_MESSAGE}</p>
        )}
        {sendCodeError && <p className="text-[10px] text-red-600">{sendCodeError}</p>}
      </div>

      <div className="flex w-full flex-col items-start gap-1">
        <p className="text-xs font-medium text-[#6b6b66]">{codeLabel}</p>
        <div className="flex w-full flex-col items-start gap-3">
          <EmailCodeInput
            length={codeLength}
            value={emailCode}
            onChange={setEmailCode}
            disabled={!isCodeSent || isCodeExpired || codeDisabled}
            error={Boolean(codeError)}
            ariaLabel={codeAriaLabel}
          />
          <div className="flex w-full items-center justify-between">
            <p className="text-xs font-medium text-[#1a1a17] opacity-50">
              {codeDisabled
                ? ''
                : isCodeSent
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
        {/* 인증 실패 횟수 초과로 잠긴 상태(codeDisabled)에서는 잠금 안내(codeError)만 보여주고,
            "인증 시간이 만료되었습니다" 안내는 모순되어 보이므로 함께 띄우지 않는다 */}
        {isCodeExpired && !codeDisabled && (
          <p className="text-[10px] text-red-600">인증 시간이 만료되었습니다. 재전송해 주세요.</p>
        )}
        {codeError && (
          <>
            <p className="text-[10px] text-red-600">{codeError}</p>
            {/* [Figma] 396:11296 — "인증번호를 다시 확인해 주세요 (인증 실패 N/5)" 문구는
                백엔드 message를 그대로 쓰기로 해 제외하고, 아래 제한 안내만 반영한다 */}
            <p className="text-[10px] text-red-600">5회 실패 시 24시간 동안 인증이 제한됩니다.</p>
          </>
        )}
      </div>
    </>
  )
}
