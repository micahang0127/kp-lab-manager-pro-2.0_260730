import { createFileRoute, redirect } from '@tanstack/react-router'

import { RegisterEmailVerificationPage } from '../pages/RegisterEmailVerificationPage'
import { useRegisterFlowStore } from '../stores/registerFlowStore'
import { redirectIfAuthenticated } from '../utils/requireAuth'

export const Route = createFileRoute('/register-email-verification')({
  beforeLoad: () => {
    const authRedirect = redirectIfAuthenticated()
    if (authRedirect) return authRedirect

    // 1단계(가입 방법 선택)를 거치지 않은 경우 1단계로 돌려보낸다.
    if (!useRegisterFlowStore.getState().registerMethod) {
      return redirect({ to: '/register' })
    }
    // 2단계(본인인증)를 완료하지 않고(예: 새로고침·직접 URL 접근) 들어온 경우
    // 본인인증 단계로 돌려보낸다.
    if (!useRegisterFlowStore.getState().identityVerifyResult) {
      return redirect({ to: '/register-identity-verification' })
    }
    // 4단계(이용약관 동의)를 완료하지 않고 들어온 경우 약관 동의 단계로 돌려보낸다.
    if (!useRegisterFlowStore.getState().termsAgreement) {
      return redirect({ to: '/register-terms' })
    }
  },
  component: RegisterEmailVerificationPage,
})
