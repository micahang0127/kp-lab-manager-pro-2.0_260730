import { createFileRoute } from '@tanstack/react-router'

import { MainPage } from '../pages/MainPage'
import { requireAuth } from '../utils/requireAuth'

export const Route = createFileRoute('/main')({
  beforeLoad: requireAuth,
  component: MainPage,
})
