import { createFileRoute, redirect } from '@tanstack/react-router'

import { EmailVerificationPage } from '../../pages/EmailVerificationPage'
import { useLoginFlowStore } from '../../stores/loginFlowStore'

export const Route = createFileRoute('/login/verify')({
  beforeLoad: () => {
    if (sessionStorage.getItem('accessToken')) {
      return redirect({ to: '/main' })
    }
    // 이메일 인증을 시작한 적 없이(예: 새로고침·직접 URL 접근) 이 경로에 들어온 경우
    // 자격증명 입력 단계로 돌려보낸다.
    if (!useLoginFlowStore.getState().pending) {
      return redirect({ to: '/login' })
    }
  },
  component: EmailVerificationPage,
})
