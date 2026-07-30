import { createFileRoute } from '@tanstack/react-router'

import { InstitutionLocationPage } from '../../pages/InstitutionLocationPage'
import { requireAuth } from '../../utils/requireAuth'

export const Route = createFileRoute('/institution/location')({
  beforeLoad: requireAuth,
  component: InstitutionLocationPage,
})
