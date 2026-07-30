import { createFileRoute } from '@tanstack/react-router'

import { SafetySpecialSubstancePage } from '../../pages/SafetySpecialSubstancePage'
import { requireAuth } from '../../utils/requireAuth'

export const Route = createFileRoute('/safety/special-substance')({
  beforeLoad: requireAuth,
  component: SafetySpecialSubstancePage,
})
