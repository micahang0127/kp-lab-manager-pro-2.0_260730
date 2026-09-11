import {
  isValidPassword,
  PASSWORD_MISMATCH_MESSAGE,
  PASSWORD_RULE_MESSAGE,
} from '../../utils/rules/validationRules'
import { PasswordField } from './PasswordField'

// ─── Types ────────────────────────────────────────────────────────────────────

interface NewPasswordFieldsProps {
  newPasswordId: string
  newPasswordLabel: string
  confirmPasswordId: string
  confirmPasswordLabel: string
  newPassword: string
  onNewPasswordChange: (value: string) => void
  confirmPassword: string
  onConfirmPasswordChange: (value: string) => void
}

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * "새 비밀번호" + "비밀번호 확인" 입력 두 칸을 한 쌍으로 묶은 컴포넌트.
 * 형식 검증(영문+숫자 조합 8자리 이상)과 일치 여부 검증을 공통으로 수행해 에러를 표시한다.
 * 회원가입 비밀번호 설정, 비밀번호 재설정 등 "새 비밀번호를 두 번 입력받는" 모든 화면에서 재사용한다.
 * 값은 상위 컴포넌트가 들고 있다(제출 시 실제 값이 필요하므로) — 제출 가능 여부는
 * validationRules의 isNewPasswordFieldsValid로 별도 판단해 제출 버튼의 disabled 조건 등에 사용한다.
 */
export function NewPasswordFields({
  newPasswordId,
  newPasswordLabel,
  confirmPasswordId,
  confirmPasswordLabel,
  newPassword,
  onNewPasswordChange,
  confirmPassword,
  onConfirmPasswordChange,
}: NewPasswordFieldsProps) {
  const isNewPasswordInvalid = newPassword.length > 0 && !isValidPassword(newPassword)
  const isConfirmMismatch = confirmPassword.length > 0 && confirmPassword !== newPassword

  return (
    <div className="flex w-full flex-col items-start gap-5">
      <PasswordField
        id={newPasswordId}
        label={newPasswordLabel}
        value={newPassword}
        onChange={onNewPasswordChange}
        error={isNewPasswordInvalid ? PASSWORD_RULE_MESSAGE : null}
        hint={PASSWORD_RULE_MESSAGE}
      />
      <PasswordField
        id={confirmPasswordId}
        label={confirmPasswordLabel}
        value={confirmPassword}
        onChange={onConfirmPasswordChange}
        error={isConfirmMismatch ? PASSWORD_MISMATCH_MESSAGE : null}
      />
    </div>
  )
}
