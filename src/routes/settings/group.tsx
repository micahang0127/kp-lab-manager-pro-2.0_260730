import { createFileRoute } from '@tanstack/react-router'

import { SettingsGroupPage } from '../../pages/SettingsGroupPage'
import { requireAuth } from '../../utils/requireAuth'

export const Route = createFileRoute('/settings/group')({
  beforeLoad: requireAuth,
  component: SettingsGroupPage,
})
