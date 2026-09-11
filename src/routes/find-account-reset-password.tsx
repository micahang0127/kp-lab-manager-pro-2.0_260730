import { createFileRoute, redirect } from '@tanstack/react-router'

import { FindAccountResetPasswordPage } from '../pages/FindAccountResetPasswordPage'
import { useFindAccountFlowStore } from '../stores/findAccountFlowStore'
import { redirectIfAuthenticated } from '../utils/requireAuth'

export const Route = createFileRoute('/find-account-reset-password')({
  beforeLoad: () => {
    const authRedirect = redirectIfAuthenticated()
    if (authRedirect) return authRedirect

    // 본인인증(find-account)을 거치지 않고(예: 새로고침·직접 URL 접근) 들어온 경우
    // 아이디·비밀번호 찾기 첫 화면으로 돌려보낸다.
    if (!useFindAccountFlowStore.getState().verifiedIdentity?.identityVerificationCode) {
      return redirect({ to: '/find-account' })
    }
  },
  component: FindAccountResetPasswordPage,
})
