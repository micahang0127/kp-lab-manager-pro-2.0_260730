import { createFileRoute } from '@tanstack/react-router'

import { RegisterPage } from '../pages/RegisterPage'
import { redirectIfAuthenticated } from '../utils/requireAuth'

export const Route = createFileRoute('/register')({
  beforeLoad: redirectIfAuthenticated,
  component: RegisterPage,
})
