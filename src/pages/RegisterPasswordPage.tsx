import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import { AuthCardLayout, AuthFormActions, CompletedStepBadge } from '../components/auth'
import { NewPasswordFields } from '../components/password'
import { useRegisterFlowStore } from '../stores/registerFlowStore'
import { isNewPasswordFieldsValid } from '../utils/rules/validationRules'

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

  const canSubmit = isNewPasswordFieldsValid(newPassword, confirmPassword)

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
    <AuthCardLayout title="회원가입" align="center" onSubmit={handleSubmit}>
      <div className="flex w-full flex-col items-start gap-[60px]">
        <div className="flex w-full flex-col items-start gap-3">
          <CompletedStepBadge label="약관 동의 완료" />
          <CompletedStepBadge label="이메일 인증 완료" />
        </div>

        <div className="flex w-full flex-col items-start gap-5">
          <p className="w-full text-xl font-bold leading-7 text-[#1a1a17]">
            비밀번호를 설정해 주세요.
          </p>

          <NewPasswordFields
            newPasswordId="register-new-password"
            newPasswordLabel="신규 비밀번호 *"
            confirmPasswordId="register-confirm-password"
            confirmPasswordLabel="비밀번호 확인 *"
            newPassword={newPassword}
            onNewPasswordChange={setNewPassword}
            confirmPassword={confirmPassword}
            onConfirmPasswordChange={setConfirmPassword}
          />
        </div>
      </div>

      <AuthFormActions
        primaryLabel="다음"
        primaryDisabled={!canSubmit}
        secondaryLeft={
          <button
            type="button"
            onClick={() => {
              void navigate({ to: '/register-email-verification' })
            }}
            className="opacity-50"
          >
            ← 이전
          </button>
        }
      />
    </AuthCardLayout>
  )
}
