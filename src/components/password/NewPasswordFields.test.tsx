import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { render, screen } from '../../test/test-utils'
import { PASSWORD_RULE_MESSAGE } from '../../utils/rules/validationRules'
import { NewPasswordFields } from './NewPasswordFields'

/** value를 스스로 들고 있는 컨트롤드 래퍼 — 실제 사용 화면처럼 입력에 따라 값이 반영되는지 확인할 때 사용 */
function ControlledNewPasswordFields() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  return (
    <NewPasswordFields
      newPasswordId="new-password"
      newPasswordLabel="새 비밀번호 *"
      confirmPasswordId="confirm-password"
      confirmPasswordLabel="새 비밀번호 확인 *"
      newPassword={newPassword}
      onNewPasswordChange={setNewPassword}
      confirmPassword={confirmPassword}
      onConfirmPasswordChange={setConfirmPassword}
    />
  )
}

const VALID_PASSWORD = 'abcd1234!'

describe('NewPasswordFields', () => {
  it('전달받은 두 라벨로 입력란을 렌더링한다', () => {
    render(<ControlledNewPasswordFields />)

    expect(screen.getByLabelText('새 비밀번호 *')).toBeInTheDocument()
    expect(screen.getByLabelText('새 비밀번호 확인 *')).toBeInTheDocument()
  })

  it('입력 전에도 새 비밀번호 형식 규칙 안내 문구를 항상 표시한다', () => {
    render(<ControlledNewPasswordFields />)

    expect(screen.getByText(PASSWORD_RULE_MESSAGE)).toBeInTheDocument()
  })

  it('새 비밀번호가 형식에 맞지 않으면 오류 문구를 표시한다', async () => {
    render(<ControlledNewPasswordFields />)

    await userEvent.type(screen.getByLabelText('새 비밀번호 *'), 'abc')

    expect(screen.getByText(PASSWORD_RULE_MESSAGE)).toBeInTheDocument()
  })

  it('확인 비밀번호가 새 비밀번호와 다르면 불일치 오류 문구를 표시한다', async () => {
    render(<ControlledNewPasswordFields />)

    await userEvent.type(screen.getByLabelText('새 비밀번호 *'), VALID_PASSWORD)
    await userEvent.type(screen.getByLabelText('새 비밀번호 확인 *'), 'different1')

    expect(screen.getByText('비밀번호가 일치하지 않습니다.')).toBeInTheDocument()
  })

  it('두 값이 형식에 맞고 일치하면 오류 문구를 표시하지 않는다', async () => {
    render(<ControlledNewPasswordFields />)

    await userEvent.type(screen.getByLabelText('새 비밀번호 *'), VALID_PASSWORD)
    await userEvent.type(screen.getByLabelText('새 비밀번호 확인 *'), VALID_PASSWORD)

    expect(screen.queryByText('비밀번호가 일치하지 않습니다.')).not.toBeInTheDocument()
  })

  it('새 비밀번호 입력란에 입력하면 onNewPasswordChange만 호출되고, 확인 입력란에 입력하면 onConfirmPasswordChange만 호출된다', async () => {
    const handleNewPasswordChange = vi.fn()
    const handleConfirmPasswordChange = vi.fn()

    render(
      <NewPasswordFields
        newPasswordId="new-password"
        newPasswordLabel="새 비밀번호 *"
        confirmPasswordId="confirm-password"
        confirmPasswordLabel="새 비밀번호 확인 *"
        newPassword=""
        onNewPasswordChange={handleNewPasswordChange}
        confirmPassword=""
        onConfirmPasswordChange={handleConfirmPasswordChange}
      />
    )

    await userEvent.type(screen.getByLabelText('새 비밀번호 *'), 'a')
    expect(handleNewPasswordChange).toHaveBeenCalledWith('a')
    expect(handleConfirmPasswordChange).not.toHaveBeenCalled()

    await userEvent.type(screen.getByLabelText('새 비밀번호 확인 *'), 'b')
    expect(handleConfirmPasswordChange).toHaveBeenCalledWith('b')
  })
})
