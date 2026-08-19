import { createFileRoute } from '@tanstack/react-router'

import { SettingsMemberPage } from '../../pages/SettingsMemberPage'
import { requireAuth } from '../../utils/requireAuth'

export const Route = createFileRoute('/settings/member')({
  beforeLoad: requireAuth,
  component: SettingsMemberPage,
})
