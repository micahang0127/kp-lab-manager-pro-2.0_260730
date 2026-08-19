import { createFileRoute } from '@tanstack/react-router'

import { SettingsStorageLocationPage } from '../../pages/SettingsStorageLocationPage'
import { requireAuth } from '../../utils/requireAuth'

export const Route = createFileRoute('/settings/storage-location')({
  beforeLoad: requireAuth,
  component: SettingsStorageLocationPage,
})
