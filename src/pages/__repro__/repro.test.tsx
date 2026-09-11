import { useNavigate } from '@tanstack/react-router'
import { waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { server } from '../../../../home/sanga/projects/kp-lab-manager-pro-2.0/src/test/mocks/server'
import { useAuthStore } from '../../../../home/sanga/projects/kp-lab-manager-pro-2.0/src/stores/authStore'
import { useEmailVerificationLimitStore } from '../../../../home/sanga/projects/kp-lab-manager-pro-2.0/src/stores/emailVerificationLimitStore'
import { useLoginFlowStore } from '../../../../home/sanga/projects/kp-lab-manager-pro-2.0/src/stores/loginFlowStore'
import {
  render,
  screen,
} from '../../../../home/sanga/projects/kp-lab-manager-pro-2.0/src/test/test-utils'
import { LoginDeviceVerificationPage } from '../../../../home/sanga/projects/kp-lab-manager-pro-2.0/src/pages/LoginDeviceVerificationPage'

vi.mock('@tanstack/react-router', () => ({
  useNavigate: vi.fn(),
}))

const PENDING = {
  email: 'user@koreapetroleum.com',
  password: 'password1',
  fingerprintCode: 'fp-1234',
  device: 'W' as const,
}

describe('repro - real request() path', () => {
  beforeEach(() => {
    vi.mocked(useNavigate).mockReturnValue(vi.fn())
    sessionStorage.clear()
    document.cookie = 'emailVerificationLimit=; max-age=0; path=/'
    useEmailVerificationLimitStore.setState({ records: {} })
    useAuthStore.setState({ isLoggedIn: false, userSession: null })
    useLoginFlowStore.setState({ pending: PENDING })
  })

  it('실제 request() 경로로 409 응답이 오면 메시지를 표시한다', async () => {
    server.use(
      http.post('*/v1/user/email/sendCode', () =>
        HttpResponse.json(
          {
            result: false,
            data: null,
            message: [
              '인증코드 발송 횟수(5회)를 초과했습니다. 마지막 발송 후 24시간이 지나면 다시 요청할 수 있습니다',
            ],
            statusCode: 409,
          },
          { status: 409 }
        )
      )
    )

    render(<LoginDeviceVerificationPage />)

    await waitFor(() => {
      expect(screen.getByText(/인증코드 발송 횟수\(5회\)를 초과했습니다/)).toBeInTheDocument()
    })
  })
})
