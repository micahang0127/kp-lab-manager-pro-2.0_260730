import { createFileRoute } from '@tanstack/react-router'

import { RegisterResetPasswordCompletePage } from '../pages/RegisterResetPasswordCompletePage'
import { redirectIfAuthenticated } from '../utils/requireAuth'

export const Route = createFileRoute('/register-reset-password-complete')({
  beforeLoad: redirectIfAuthenticated,
  component: RegisterResetPasswordCompletePage,
})
