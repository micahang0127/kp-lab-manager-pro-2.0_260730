import { createFileRoute, redirect } from '@tanstack/react-router'

import { RegisterPage } from '../pages/RegisterPage'

export const Route = createFileRoute('/register')({
  beforeLoad: () => {
    if (sessionStorage.getItem('accessToken')) {
      return redirect({ to: '/main' })
    }
  },
  component: RegisterPage,
})
