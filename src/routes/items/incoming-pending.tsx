import { createFileRoute } from '@tanstack/react-router'

import { ItemIncomingPendingPage } from '../../pages/ItemIncomingPendingPage'
import { requireAuth } from '../../utils/requireAuth'

export const Route = createFileRoute('/items/incoming-pending')({
  beforeLoad: requireAuth,
  component: ItemIncomingPendingPage,
})
