import { createFileRoute } from '@tanstack/react-router'

import { SafetyHazardousQuantityPage } from '../../pages/SafetyHazardousQuantityPage'
import { requireAuth } from '../../utils/requireAuth'

export const Route = createFileRoute('/safety/hazardous-quantity')({
  beforeLoad: requireAuth,
  component: SafetyHazardousQuantityPage,
})
