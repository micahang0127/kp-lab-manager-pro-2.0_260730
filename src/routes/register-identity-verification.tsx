import { createFileRoute, redirect } from '@tanstack/react-router'

import { RegisterIdentityVerificationPage } from '../pages/RegisterIdentityVerificationPage'
import { useRegisterFlowStore } from '../stores/registerFlowStore'
import { redirectIfIdentityVerifiedInFindAccount } from '../utils/registerFlowGuard'
import { redirectIfAuthenticated } from '../utils/requireAuth'

export const Route = createFileRoute('/register-identity-verification')({
  beforeLoad: () => {
    const authRedirect = redirectIfAuthenticated()
    if (authRedirect) return authRedirect

    // 1단계(가입 방법 선택)를 거치지 않고(예: 새로고침·직접 URL 접근) 들어온 경우
    // 가입 방법 선택 단계로 돌려보낸다.
    if (!useRegisterFlowStore.getState().registerMethod) {
      return redirect({ to: '/register' })
    }

    // 아이디·비밀번호 찾기에서 본인인증을 마치고 넘어온 경우 2·3단계를 건너뛰고 4단계로 보낸다.
    const findAccountRedirect = redirectIfIdentityVerifiedInFindAccount()
    if (findAccountRedirect) return findAccountRedirect
  },
  component: RegisterIdentityVerificationPage,
})
