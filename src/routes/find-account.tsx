import { createFileRoute } from '@tanstack/react-router'

import { FindAccountPage } from '../pages/FindAccountPage'
import { redirectIfAuthenticated } from '../utils/requireAuth'

export const Route = createFileRoute('/find-account')({
  beforeLoad: redirectIfAuthenticated,
  component: FindAccountPage,
})
