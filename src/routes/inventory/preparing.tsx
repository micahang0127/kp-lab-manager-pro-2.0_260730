import { createFileRoute } from '@tanstack/react-router'

import { InventoryPreparingPage } from '../../pages/InventoryPreparingPage'
import { requireAuth } from '../../utils/requireAuth'

export const Route = createFileRoute('/inventory/preparing')({
  beforeLoad: requireAuth,
  component: InventoryPreparingPage,
})
