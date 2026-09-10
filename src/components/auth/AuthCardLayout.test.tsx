import { fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { render, screen } from '../../test/test-utils'
import { AuthCardLayout } from './AuthCardLayout'

describe('AuthCardLayout', () => {
  it('title을 h1 heading으로 렌더링한다 (기본값)', () => {
    render(<AuthCardLayout title="회원가입">내용</AuthCardLayout>)

    expect(screen.getByRole('heading', { name: '회원가입', level: 1 })).toBeInTheDocument()
  })

  it('titleAs="p"면 heading이 아니라 일반 텍스트로 렌더링한다', () => {
    render(
      <AuthCardLayout title="비밀번호 설정 완료" titleAs="p">
        내용
      </AuthCardLayout>
    )

    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
    expect(screen.getByText('비밀번호 설정 완료')).toBeInTheDocument()
  })

  it('children을 렌더링한다', () => {
    render(<AuthCardLayout title="회원가입">본문 내용</AuthCardLayout>)

    expect(screen.getByText('본문 내용')).toBeInTheDocument()
  })

  it('onSubmit을 전달하면 form으로 감싸고 제출 시 호출된다', () => {
    const handleSubmit = vi.fn((e: React.FormEvent<HTMLFormElement>) => e.preventDefault())
    const { container } = render(
      <AuthCardLayout title="로그인" onSubmit={handleSubmit}>
        <button type="submit">제출</button>
      </AuthCardLayout>
    )

    const form = container.querySelector('form')
    expect(form).toBeInTheDocument()
    if (form) fireEvent.submit(form)

    expect(handleSubmit).toHaveBeenCalledTimes(1)
  })

  it('onSubmit이 없으면 form을 렌더링하지 않는다', () => {
    const { container } = render(<AuthCardLayout title="회원가입">내용</AuthCardLayout>)

    expect(container.querySelector('form')).not.toBeInTheDocument()
  })

  it('afterCard를 전달하면 카드와 함께 렌더링한다', () => {
    render(
      <AuthCardLayout title="회원가입" afterCard={<div>진행 표시</div>}>
        내용
      </AuthCardLayout>
    )

    expect(screen.getByText('진행 표시')).toBeInTheDocument()
  })
})
