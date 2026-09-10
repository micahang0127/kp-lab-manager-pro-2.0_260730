import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { render, screen } from '../../test/test-utils'
import { AuthFormActions } from './AuthFormActions'

describe('AuthFormActions', () => {
  it('주 버튼을 렌더링한다 (기본 type=submit)', () => {
    render(<AuthFormActions primaryLabel="다음" />)

    expect(screen.getByRole('button', { name: '다음' })).toHaveAttribute('type', 'submit')
  })

  it('primaryType="button"이면 클릭 시 onPrimaryClick이 호출된다', async () => {
    const handleClick = vi.fn()
    render(
      <AuthFormActions primaryLabel="동의" primaryType="button" onPrimaryClick={handleClick} />
    )

    await userEvent.click(screen.getByRole('button', { name: '동의' }))

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('primaryDisabled가 true면 버튼이 비활성화된다', () => {
    render(<AuthFormActions primaryLabel="다음" primaryDisabled />)

    expect(screen.getByRole('button', { name: '다음' })).toBeDisabled()
  })

  it('secondaryLeft만 있으면 좌측 요소만 렌더링한다', () => {
    render(
      <AuthFormActions primaryLabel="다음" secondaryLeft={<button type="button">← 이전</button>} />
    )

    expect(screen.getByRole('button', { name: '← 이전' })).toBeInTheDocument()
  })

  it('secondaryLeft와 secondaryRight가 모두 있으면 둘 다 렌더링한다', () => {
    render(
      <AuthFormActions
        primaryLabel="로그인"
        secondaryLeft={<span>QR 로그인(예정)</span>}
        secondaryRight={<button type="button">회원가입</button>}
      />
    )

    expect(screen.getByText('QR 로그인(예정)')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '회원가입' })).toBeInTheDocument()
  })

  it('beforePrimary/belowPrimary/afterSecondary를 각각 렌더링한다', () => {
    render(
      <AuthFormActions
        primaryLabel="다음"
        beforePrimary={<p>위 슬롯</p>}
        belowPrimary={<p>중간 슬롯</p>}
        afterSecondary={<p>아래 슬롯</p>}
      />
    )

    expect(screen.getByText('위 슬롯')).toBeInTheDocument()
    expect(screen.getByText('중간 슬롯')).toBeInTheDocument()
    expect(screen.getByText('아래 슬롯')).toBeInTheDocument()
  })
})
