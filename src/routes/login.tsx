import { createFileRoute } from '@tanstack/react-router'

import { LoginPage } from '../pages/LoginPage'
import { redirectIfAuthenticated } from '../utils/requireAuth'

export const Route = createFileRoute('/login')({
  beforeLoad: redirectIfAuthenticated,
  component: LoginPage,
})
