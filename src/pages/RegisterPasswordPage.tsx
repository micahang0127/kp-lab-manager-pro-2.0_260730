import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import checkCircleIcon from '../assets/icons/register/check-circle.svg'
import { PasswordField } from '../components/password'
import { useRegisterFlowStore } from '../stores/registerFlowStore'
import { isValidPassword, PASSWORD_RULE_MESSAGE } from '../utils/rules/validationRules'

// ─── Message ───────────────────────────────────────────────────────────────────

const PASSWORD_MISMATCH_MESSAGE = '비밀번호가 일치하지 않습니다.'

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * 회원가입 6단계 — 비밀번호 설정.
 * 5단계(이메일 인증) 완료 후 진입한다. 신규 비밀번호와 확인 비밀번호를 입력받아 형식(영문+숫자
 * 조합 8자리 이상)과 일치 여부를 검증하고, 통과하면 registerFlowStore에 비밀번호를 저장한 뒤
 * 7단계(새 조직 등록)로 이동한다.
 */
export function RegisterPasswordPage() {
  const navigate = useNavigate()
  const registerPasswordInStore = useRegisterFlowStore((s) => s.registerPassword)
  const setRegisterPassword = useRegisterFlowStore((s) => s.setRegisterPassword)

  // '이전' 버튼으로 되돌아온 경우, store에 이미 저장된 비밀번호가 있으면 화면에도 복원한다
  // (제출 시 두 입력값이 일치해야만 저장되므로 하나의 값으로 양쪽 다 복원할 수 있다)
  const [newPassword, setNewPassword] = useState(registerPasswordInStore ?? '')
  const [confirmPassword, setConfirmPassword] = useState(registerPasswordInStore ?? '')

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
                hint={PASSWORD_RULE_MESSAGE}
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
