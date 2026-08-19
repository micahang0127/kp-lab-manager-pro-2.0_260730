import { Link, useNavigate } from '@tanstack/react-router'

import { useAuthStore } from '../../stores/authStore'

export function Header() {
  const navigate = useNavigate()
  const { isLoggedIn, logout } = useAuthStore()

  const handleLogout = async () => {
    logout()
    await navigate({ to: '/login' })
  }

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link to="/" className="text-base font-semibold text-gray-900">
          lab-manager-pro
        </Link>
        <nav aria-label="페이지 이동" className="flex gap-4 text-sm text-gray-600">
          <Link to="/" className="hover:text-indigo-600">
            Home
          </Link>
          <Link to="/main" className="hover:text-indigo-600">
            Main
          </Link>

          {isLoggedIn ? (
            <button
              type="button"
              onClick={() => {
                void handleLogout()
              }}
              className="hover:text-indigo-600"
            >
              Logout
            </button>
          ) : (
            <Link to="/login" className="hover:text-indigo-600">
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
