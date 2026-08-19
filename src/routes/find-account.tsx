import { createFileRoute, redirect } from '@tanstack/react-router'

import { FindAccountPage } from '../pages/FindAccountPage'

export const Route = createFileRoute('/find-account')({
  beforeLoad: () => {
    if (sessionStorage.getItem('accessToken')) {
      return redirect({ to: '/main' })
    }
  },
  component: FindAccountPage,
})
