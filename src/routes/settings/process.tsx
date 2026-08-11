import { createFileRoute } from '@tanstack/react-router'

import { SettingsProcessPage } from '../../pages/SettingsProcessPage'
import { requireAuth } from '../../utils/requireAuth'

export const Route = createFileRoute('/settings/process')({
  beforeLoad: requireAuth,
  component: SettingsProcessPage,
})
