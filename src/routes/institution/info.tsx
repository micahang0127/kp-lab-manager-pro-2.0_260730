import { createFileRoute } from '@tanstack/react-router'

import { InstitutionInfoPage } from '../../pages/InstitutionInfoPage'
import { requireAuth } from '../../utils/requireAuth'

export const Route = createFileRoute('/institution/info')({
  beforeLoad: requireAuth,
  component: InstitutionInfoPage,
})
