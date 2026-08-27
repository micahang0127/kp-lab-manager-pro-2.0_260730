import { useNavigate } from '@tanstack/react-router'
import { fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useRegisterFlowStore } from '../stores/registerFlowStore'
import { render, screen } from '../test/test-utils'
import { RegisterOrganizationPage } from './RegisterOrganizationPage'

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: vi.fn(),
}))

const createPdfFile = (name = '사업자등록증.pdf', sizeInBytes = 1024) => {
  const file = new File([new Uint8Array(sizeInBytes)], name, { type: 'application/pdf' })
  return file
}

describe('RegisterOrganizationPage', () => {
  beforeEach(() => {
    vi.mocked(useNavigate).mockReturnValue(mockNavigate)
    vi.clearAllMocks()
    useRegisterFlowStore.setState({ businessRegistrationFile: null })
  })

  it('페이지 제목과 안내 문구, 업로드 영역을 렌더링한다', () => {
    render(<RegisterOrganizationPage />)

    expect(screen.getByRole('heading', { name: '회원가입' })).toBeInTheDocument()
    expect(screen.getByText('새 조직을 등록해 주세요.')).toBeInTheDocument()
    expect(screen.getByText('사업자등록증 업로드')).toBeInTheDocument()
  })

  it('파일을 선택하기 전에는 "새 조직으로 가입 →" 버튼이 disabled다', () => {
    render(<RegisterOrganizationPage />)

    expect(screen.getByRole('button', { name: '새 조직으로 가입 →' })).toBeDisabled()
  })

  it('PDF 파일을 선택하면 파일명이 표시되고 버튼이 활성화된다', async () => {
    render(<RegisterOrganizationPage />)

    const file = createPdfFile()
    const input = screen.getByLabelText('사업자등록증 파일 선택')

    await userEvent.upload(input, file)

    expect(screen.getByText('사업자등록증.pdf')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '새 조직으로 가입 →' })).not.toBeDisabled()
  })

  it('PDF가 아닌 파일을 드래그해 놓으면 오류 문구를 표시하고 버튼은 disabled 상태를 유지한다', () => {
    // input의 accept 속성은 파일 선택창(클릭 업로드)에서만 필터링되고 드래그앤드롭에는
    // 적용되지 않으므로, 잘못된 파일 형식은 드롭 시나리오로 재현한다.
    render(<RegisterOrganizationPage />)

    const file = new File(['dummy'], '사업자등록증.png', { type: 'image/png' })
    const dropZone = screen.getByRole('button', { name: /사업자등록증 업로드/ })

    fireEvent.drop(dropZone, { dataTransfer: { files: [file] } })

    expect(screen.getByText('PDF 파일만 업로드할 수 있습니다.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '새 조직으로 가입 →' })).toBeDisabled()
  })

  it('20MB를 초과하는 파일을 선택하면 오류 문구를 표시하고 버튼은 disabled 상태를 유지한다', async () => {
    render(<RegisterOrganizationPage />)

    const file = createPdfFile('사업자등록증.pdf', 21 * 1024 * 1024)
    const input = screen.getByLabelText('사업자등록증 파일 선택')

    await userEvent.upload(input, file)

    expect(screen.getByText('파일 크기는 최대 20MB까지 업로드할 수 있습니다.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '새 조직으로 가입 →' })).toBeDisabled()
  })

  it('유효한 파일로 "새 조직으로 가입 →"를 클릭하면 businessRegistrationFile을 저장한다', async () => {
    render(<RegisterOrganizationPage />)

    const file = createPdfFile()
    const input = screen.getByLabelText('사업자등록증 파일 선택')
    await userEvent.upload(input, file)

    await userEvent.click(screen.getByRole('button', { name: '새 조직으로 가입 →' }))

    expect(useRegisterFlowStore.getState().businessRegistrationFile).toBe(file)
  })

  it('"← 이전" 버튼을 클릭하면 6단계(비밀번호 설정)로 이동한다', async () => {
    render(<RegisterOrganizationPage />)

    await userEvent.click(screen.getByRole('button', { name: /이전/ }))

    expect(mockNavigate).toHaveBeenCalledWith({ to: '/register-password' })
  })
})
