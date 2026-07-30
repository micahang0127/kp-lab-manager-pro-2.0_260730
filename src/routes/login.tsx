import { createFileRoute, redirect } from '@tanstack/react-router'

import { LoginPage } from '../pages/LoginPage'

export const Route = createFileRoute('/login')({
  beforeLoad: () => {
    if (sessionStorage.getItem('accessToken')) {
      return redirect({ to: '/main' })
    }
  },
  component: LoginPage,
})
