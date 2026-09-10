import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import { resetPassword } from '../api/user'
import { AuthCardLayout, AuthFormActions } from '../components/auth'
import { ErrorToast } from '../components/error/ErrorToast'
import { NewPasswordFields } from '../components/password'
import { useFindAccountFlowStore } from '../stores/findAccountFlowStore'
import { isNewPasswordFieldsValid } from '../utils/rules/validationRules'

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * 아이디·비밀번호 찾기 화면에서 "가입된 계정이 있습니다" 안내 후 "비밀번호 재설정"을 눌러
 * 진입하는 비밀번호 재설정 화면.
 * 새 비밀번호/확인 입력은 회원가입 비밀번호 설정 화면과 동일하게 형식·일치 여부를 검증한다
 * (NewPasswordFields 공통 컴포넌트, RegisterResetPasswordPage와 동일 패턴).
 * API 요청에 필요한 본인인증 키(identityVerificationId)는 find-account 본인인증 완료 시
 * findAccountFlowStore에 저장해둔 값을 그대로 재사용한다 — 이 화면에서 본인인증을 다시 요구하지 않는다.
 */
export function FindAccountResetPasswordPage() {
  const navigate = useNavigate()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const identityVerificationCode = useFindAccountFlowStore(
    (s) => s.verifiedIdentity?.identityVerificationCode
  )
  const clearVerifiedIdentity = useFindAccountFlowStore((s) => s.clearVerifiedIdentity)

  const resetPasswordMutation = useMutation({
    mutationFn: () => {
      // 라우트 가드(find-account-reset-password.tsx)가 identityVerificationCode 유무를
      // 확인하지만, 여기서 한 번 더 방어적으로 확인한다.
      if (!identityVerificationCode) {
        return Promise.reject(new Error('본인인증 정보가 없습니다. 처음부터 다시 진행해 주세요.'))
      }
      return resetPassword({
        identityVerificationId: identityVerificationCode,
        password: newPassword,
        passwordConfirm: confirmPassword,
      })
    },
    onSuccess: () => {
      // 비밀번호 재설정 흐름은 여기서 끝나고 로그인 페이지로 이동해 새 비밀번호로 다시
      // 로그인해야 하므로, RegisterResetPasswordPage와 동일한 이유로 findAccountFlowStore를 비운다.
      clearVerifiedIdentity()
      void navigate({ to: '/register-reset-password-complete' })
    },
  })

  const canSubmit =
    isNewPasswordFieldsValid(newPassword, confirmPassword) && !resetPasswordMutation.isPending

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!canSubmit) return
    resetPasswordMutation.mutate()
  }

  const errorMessage =
    resetPasswordMutation.error instanceof Error ? resetPasswordMutation.error.message : null

  return (
    <AuthCardLayout title="비밀번호 재설정" onSubmit={handleSubmit}>
      <div className="flex w-full flex-col items-start gap-5">
        <p className="w-full text-xl font-bold leading-7 text-[#1a1a17]">
          비밀번호를 설정해 주세요.
        </p>

        <NewPasswordFields
          newPasswordId="find-account-reset-new-password"
          newPasswordLabel="새 비밀번호 *"
          confirmPasswordId="find-account-reset-confirm-password"
          confirmPasswordLabel="새 비밀번호 확인 *"
          newPassword={newPassword}
          onNewPasswordChange={setNewPassword}
          confirmPassword={confirmPassword}
          onConfirmPasswordChange={setConfirmPassword}
        />

        {errorMessage && <ErrorToast message={errorMessage} />}
      </div>

      <AuthFormActions
        primaryLabel={resetPasswordMutation.isPending ? '재설정 중...' : '비밀번호 재설정'}
        primaryDisabled={!canSubmit}
        secondaryLeft={
          <button
            type="button"
            onClick={() => {
              void navigate({ to: '/find-account' })
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
