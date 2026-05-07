'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  ShoppingCart,
  Factory,
  Users,
  Package,
  Wallet,
  Settings,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/manufacturers', label: 'Manufacturers', icon: Factory },
  { href: '/buyers', label: 'Buyers', icon: Users },
  { href: '/products', label: 'Products', icon: Package },
  { href: '/payments', label: 'Payments', icon: Wallet },
]

const bottomItems = [
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <aside className="hidden md:flex flex-col w-60 border-r border-[#E7E3DC] bg-white shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-[#E7E3DC]">
        <div className="flex items-center justify-center w-8 h-8 rounded-md bg-[#92400E] text-white">
          <span className="font-display text-base font-bold leading-none">P</span>
        </div>
        <span className="font-display text-lg text-[#1C1917] tracking-tight">PeOut</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              isActive(href)
                ? 'bg-[#FEF3C7] text-[#92400E]'
                : 'text-[#78716C] hover:bg-[#FAF7F2] hover:text-[#1C1917]'
            )}
          >
            <Icon size={17} className={isActive(href) ? 'text-[#92400E]' : 'text-[#78716C]'} />
            {label}
          </Link>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-3 border-t border-[#E7E3DC]">
        {bottomItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              isActive(href)
                ? 'bg-[#FEF3C7] text-[#92400E]'
                : 'text-[#78716C] hover:bg-[#FAF7F2] hover:text-[#1C1917]'
            )}
          >
            <Icon size={17} />
            {label}
          </Link>
        ))}
      </div>
    </aside>
  )
}
