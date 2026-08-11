import { createFileRoute } from '@tanstack/react-router'

import { SettingsInventoryConfigPage } from '../../pages/SettingsInventoryConfigPage'
import { requireAuth } from '../../utils/requireAuth'

export const Route = createFileRoute('/settings/inventory-config')({
  beforeLoad: requireAuth,
  component: SettingsInventoryConfigPage,
})
