import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { render, screen } from '../../test/test-utils'
import { RegisterOptionCard } from './RegisterOptionCard'

describe('RegisterOptionCard', () => {
  it('제목과 부제목을 렌더링한다', () => {
    render(
      <RegisterOptionCard
        icon="icon.svg"
        title="기존 조직에 가입"
        subtitle="조직 초대 필요"
        onClick={vi.fn()}
      />
    )

    expect(screen.getByText('기존 조직에 가입')).toBeInTheDocument()
    expect(screen.getByText('조직 초대 필요')).toBeInTheDocument()
  })

  it('클릭하면 onClick이 호출된다', async () => {
    const handleClick = vi.fn()
    render(
      <RegisterOptionCard
        icon="icon.svg"
        title="새 조직 만들기"
        subtitle="사업자등록증 필요"
        onClick={handleClick}
      />
    )

    await userEvent.click(screen.getByRole('button', { name: /새 조직 만들기/ }))

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('selected가 false면 aria-pressed가 false다', () => {
    render(
      <RegisterOptionCard
        icon="icon.svg"
        title="기존 조직에 가입"
        subtitle="조직 초대 필요"
        onClick={vi.fn()}
      />
    )

    expect(screen.getByRole('button', { name: /기존 조직에 가입/ })).toHaveAttribute(
      'aria-pressed',
      'false'
    )
  })

  it('selected가 true면 aria-pressed가 true다', () => {
    render(
      <RegisterOptionCard
        icon="icon.svg"
        title="기존 조직에 가입"
        subtitle="조직 초대 필요"
        selected
        onClick={vi.fn()}
      />
    )

    expect(screen.getByRole('button', { name: /기존 조직에 가입/ })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
  })

  it('badge가 있으면 뱃지 텍스트를 렌더링한다', () => {
    render(
      <RegisterOptionCard
        icon="icon.svg"
        title="초대받은 조직에 가입"
        subtitle="조직 초대 필요"
        badge="추천"
        onClick={vi.fn()}
      />
    )

    expect(screen.getByText('추천')).toBeInTheDocument()
  })

  it('badge가 없으면 뱃지를 렌더링하지 않는다', () => {
    render(
      <RegisterOptionCard
        icon="icon.svg"
        title="새 조직 만들기"
        subtitle="사업자등록증 필요"
        onClick={vi.fn()}
      />
    )

    expect(screen.queryByText('추천')).not.toBeInTheDocument()
  })

  it('subtitle에 개행이 포함되면 줄바꿈되어 렌더링된다', () => {
    render(
      <RegisterOptionCard
        icon="icon.svg"
        title="새 조직 만들기"
        subtitle={'첫 번째 줄\n두 번째 줄'}
        onClick={vi.fn()}
      />
    )

    expect(
      screen.getByText((_, element) => element?.textContent === '첫 번째 줄\n두 번째 줄')
    ).toBeInTheDocument()
  })
})
