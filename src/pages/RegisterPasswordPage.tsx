import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import checkCircleIcon from '../assets/icons/register/check-circle.svg'
import clearCircleIcon from '../assets/icons/register/clear-circle.svg'
import eyeHideIcon from '../assets/icons/register/eye-hide.svg'
import eyeShowIcon from '../assets/icons/register/eye-show.svg'
import { useRegisterFlowStore } from '../stores/registerFlowStore'
import {
  isValidPassword,
  PASSWORD_RULE_MESSAGE,
  sanitizePasswordInput,
} from '../utils/rules/validationRules'

// ─── Message ───────────────────────────────────────────────────────────────────

const PASSWORD_MISMATCH_MESSAGE = '비밀번호가 일치하지 않습니다.'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PasswordFieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string | null
}

// ─── Sub Components ───────────────────────────────────────────────────────────

/**
 * 비밀번호 입력칸 한 줄 — 눈 아이콘으로 평문/마스킹 표시를 전환하고, 값이 있을 때만
 * 지우기(x) 아이콘을 보여준다. 형식/일치 오류가 있으면 테두리를 빨간색으로 강조하고
 * 입력칸 아래에 오류 문구를 표시한다
 */
function PasswordField({ id, label, value, onChange, error }: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false)
  const hasError = Boolean(error)

  return (
    <div className="flex w-full flex-col items-start gap-1">
      <label htmlFor={id} className="text-xs font-medium text-[#6b6b66]">
        {label}
      </label>
      <div
        className={`flex h-10 w-full items-center gap-2 rounded border bg-white px-3 ${
          hasError ? 'border-[#d44038]' : 'border-[#c9c9c4]'
        }`}
      >
        <input
          id={id}
          type={isVisible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(sanitizePasswordInput(e.target.value))}
          placeholder="비밀번호를 입력해 주세요"
          className="flex-1 text-xs text-[#1a1a17] outline-none"
        />
        {value && (
          <button
            type="button"
            aria-label="입력값 지우기"
            onClick={() => onChange('')}
            className="flex size-4 shrink-0 items-center justify-center"
          >
            <img src={clearCircleIcon} alt="" aria-hidden className="size-3" />
          </button>
        )}
        <button
          type="button"
          aria-label={isVisible ? '비밀번호 숨기기' : '비밀번호 표시'}
          onClick={() => setIsVisible((prev) => !prev)}
          className="flex size-4 shrink-0 items-center justify-center"
        >
          <img src={isVisible ? eyeShowIcon : eyeHideIcon} alt="" aria-hidden className="size-4" />
        </button>
      </div>
      {hasError && <p className="text-[10px] text-red-600">{error}</p>}
    </div>
  )
}

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * 회원가입 6단계 — 비밀번호 설정.
 * 5단계(이메일 인증) 완료 후 진입한다. 신규 비밀번호와 확인 비밀번호를 입력받아 형식(영문+숫자
 * 조합 8자리 이상)과 일치 여부를 검증하고, 통과하면 registerFlowStore에 비밀번호를 저장한 뒤
 * 7단계(새 조직 등록)로 이동한다.
 */
export function RegisterPasswordPage() {
  const navigate = useNavigate()
  const setRegisterPassword = useRegisterFlowStore((s) => s.setRegisterPassword)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const isNewPasswordInvalid = newPassword.length > 0 && !isValidPassword(newPassword)
  const isConfirmMismatch = confirmPassword.length > 0 && confirmPassword !== newPassword

  const canSubmit = isValidPassword(newPassword) && confirmPassword === newPassword

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!canSubmit) return

    setRegisterPassword(newPassword)
    // [TEMP] 26.08.25 "기존 조직에 가입"(registerMethod: 'existing') 플로우의 다음 단계
    // Figma 디자인이 아직 없어 방법 구분 없이 7단계(새 조직 등록)로 이동한다. 디자인이 나오면
    // registerMethod에 따라 분기하도록 교체한다.
    void navigate({ to: '/register-organization' })
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-[336px] rounded-xl border border-[#e0e0db] bg-white px-8 py-10">
        <form onSubmit={handleSubmit} className="flex w-full flex-col items-center gap-8">
          <h1 className="w-full text-center text-xl font-bold text-[#1a1a17]">회원가입</h1>

          <div className="flex w-full flex-col items-start gap-[60px]">
            <div className="flex w-full flex-col items-start gap-3">
              <div className="flex w-full items-center gap-2">
                <img src={checkCircleIcon} alt="" aria-hidden className="size-4 shrink-0" />
                <p className="text-xs text-[#1a1a17]">약관 동의 완료</p>
              </div>
              <div className="flex w-full items-center gap-2">
                <img src={checkCircleIcon} alt="" aria-hidden className="size-4 shrink-0" />
                <p className="text-xs text-[#1a1a17]">이메일 인증 완료</p>
              </div>
            </div>

            <div className="flex w-full flex-col items-start gap-5">
              <p className="w-full text-xl font-bold leading-7 text-[#1a1a17]">
                비밀번호를 설정해 주세요.
              </p>

              <PasswordField
                id="register-new-password"
                label="신규 비밀번호 *"
                value={newPassword}
                onChange={setNewPassword}
                error={isNewPasswordInvalid ? PASSWORD_RULE_MESSAGE : null}
              />
              <PasswordField
                id="register-confirm-password"
                label="비밀번호 확인 *"
                value={confirmPassword}
                onChange={setConfirmPassword}
                error={isConfirmMismatch ? PASSWORD_MISMATCH_MESSAGE : null}
              />
            </div>
          </div>

          <div className="flex w-full flex-col items-start gap-5">
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex h-11 w-full items-center justify-center rounded bg-[#001e43] text-sm font-medium text-white hover:bg-[#00152f] disabled:opacity-50"
            >
              다음
            </button>

            <div className="flex w-full items-center justify-between text-xs font-medium text-[#1a1a17]">
              <button
                type="button"
                onClick={() => {
                  void navigate({ to: '/register-email-verification' })
                }}
                className="opacity-50"
              >
                ← 이전
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
