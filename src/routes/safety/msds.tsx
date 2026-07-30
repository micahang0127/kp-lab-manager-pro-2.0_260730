import { createFileRoute } from '@tanstack/react-router'

import { SafetyMsdsPage } from '../../pages/SafetyMsdsPage'
import { requireAuth } from '../../utils/requireAuth'

export const Route = createFileRoute('/safety/msds')({
  beforeLoad: requireAuth,
  component: SafetyMsdsPage,
})
