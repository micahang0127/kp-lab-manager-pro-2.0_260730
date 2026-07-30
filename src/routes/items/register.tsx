import { createFileRoute } from '@tanstack/react-router'

import { ItemRegisterPage } from '../../pages/ItemRegisterPage'
import { requireAuth } from '../../utils/requireAuth'

export const Route = createFileRoute('/items/register')({
  beforeLoad: requireAuth,
  component: ItemRegisterPage,
})
