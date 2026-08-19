import { createFileRoute } from '@tanstack/react-router'

import { SettingsCategoryPage } from '../../pages/SettingsCategoryPage'
import { requireAuth } from '../../utils/requireAuth'

export const Route = createFileRoute('/settings/category')({
  beforeLoad: requireAuth,
  component: SettingsCategoryPage,
})
