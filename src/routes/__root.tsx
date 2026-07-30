import { createRootRoute, Outlet } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900">
      <Outlet />
    </div>
  )
}
