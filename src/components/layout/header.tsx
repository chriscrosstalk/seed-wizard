'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sprout, Package, Calendar, Settings } from 'lucide-react'

const navItems = [
  { href: '/dashboard/inventory', label: 'My Seeds', icon: Package },
  { href: '/dashboard/calendar', label: 'Calendar', icon: Calendar },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export function Header() {
  const pathname = usePathname()

  return (
    <header className="border-b border-[var(--color-parchment)] bg-[var(--color-warm-white)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="group flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-sage)] shadow-sm shadow-[var(--color-sage)]/20 transition-transform group-hover:scale-105">
              <Sprout className="h-5 w-5 text-white" />
            </div>
            <span className="font-[var(--font-display)] text-xl font-bold text-[var(--color-soil)] tracking-tight">
              Seed Wizard
            </span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href)
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium
                    transition-all duration-200
                    ${isActive
                      ? 'bg-[var(--color-sage-light)]/40 text-[var(--color-sage-dark)]'
                      : 'text-[var(--color-bark)] hover:bg-[var(--color-parchment)] hover:text-[var(--color-soil)]'
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </header>
  )
}
