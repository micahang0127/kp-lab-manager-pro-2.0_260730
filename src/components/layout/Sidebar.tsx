import { Link, useLocation } from '@tanstack/react-router'
import { useState } from 'react'

import { getInitiallyExpandedKeys, SIDEBAR_MENU } from './sidebarMenu'

// ─── Styles ───────────────────────────────────────────────────────────────────

const LINK_CLASSNAME =
  'block rounded px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-indigo-600'
const LINK_ACTIVE_PROPS = { className: 'bg-indigo-50 font-medium text-indigo-700' }

// ─── Component ─────────────────────────────────────────────────────────────────

export function Sidebar() {
  const { pathname } = useLocation()
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(() =>
    getInitiallyExpandedKeys(pathname)
  )

  const toggleGroup = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  return (
    <nav
      aria-label="사이드바 내비게이션"
      className="w-56 shrink-0 border-r border-gray-200 bg-white px-4 py-6"
    >
      <ul className="space-y-1">
        {SIDEBAR_MENU.map((item) => {
          if (item.kind === 'link') {
            return (
              <li key={item.key}>
                <Link to={item.to} className={LINK_CLASSNAME} activeProps={LINK_ACTIVE_PROPS}>
                  {item.label}
                </Link>
              </li>
            )
          }

          const isExpanded = expandedKeys.has(item.key)
          const groupPanelId = `sidebar-group-${item.key}`

          return (
            <li key={item.key}>
              <button
                type="button"
                aria-expanded={isExpanded}
                aria-controls={groupPanelId}
                onClick={() => toggleGroup(item.key)}
                className="flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm font-medium text-gray-900 hover:bg-gray-50"
              >
                {item.label}
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                  className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              <ul id={groupPanelId} hidden={!isExpanded} className="mt-1 space-y-1 pl-3">
                {item.children.map((child) => (
                  <li key={child.key}>
                    <Link to={child.to} className={LINK_CLASSNAME} activeProps={LINK_ACTIVE_PROPS}>
                      {child.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
