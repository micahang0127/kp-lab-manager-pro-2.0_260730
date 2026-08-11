import { createFileRoute } from '@tanstack/react-router'

import { ReservationPreparingPage } from '../../pages/ReservationPreparingPage'
import { requireAuth } from '../../utils/requireAuth'

export const Route = createFileRoute('/reservation/preparing')({
  beforeLoad: requireAuth,
  component: ReservationPreparingPage,
})
