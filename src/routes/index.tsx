import { createFileRoute, redirect } from '@tanstack/react-router'

import { requireAuth } from '../utils/requireAuth'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    const auth = requireAuth()
    // 토큰이 없으면 requireAuth가 /login으로 리디렉션
    if (auth) return auth
    // 토큰이 있으면 /main으로 이동
    return redirect({ to: '/main' })
  },
})
