import { createFileRoute } from '@tanstack/react-router'

import { ItemPhotoPendingPage } from '../../pages/ItemPhotoPendingPage'
import { requireAuth } from '../../utils/requireAuth'

export const Route = createFileRoute('/items/photo-pending')({
  beforeLoad: requireAuth,
  component: ItemPhotoPendingPage,
})
