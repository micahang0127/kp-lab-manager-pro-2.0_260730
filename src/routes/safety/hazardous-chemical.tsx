import { createFileRoute } from '@tanstack/react-router'

import { SafetyHazardousChemicalPage } from '../../pages/SafetyHazardousChemicalPage'
import { requireAuth } from '../../utils/requireAuth'

export const Route = createFileRoute('/safety/hazardous-chemical')({
  beforeLoad: requireAuth,
  component: SafetyHazardousChemicalPage,
})
