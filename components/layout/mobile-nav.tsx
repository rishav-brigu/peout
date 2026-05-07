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
  { href: '/manufacturers', label: 'Mfrs', icon: Factory },
  { href: '/buyers', label: 'Buyers', icon: Users },
  { href: '/products', label: 'Products', icon: Package },
  { href: '/payments', label: 'Payments', icon: Wallet },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function MobileNav() {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#E7E3DC] flex">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-1 flex-col items-center justify-center py-2 gap-0.5 text-[10px] font-medium transition-colors',
              isActive(href) ? 'text-[#92400E]' : 'text-[#78716C]'
            )}
          >
            <Icon size={20} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      {/* Mobile spacer to push the header logo area */}
      <div className="md:hidden flex items-center gap-2">
        <div className="flex items-center justify-center w-7 h-7 rounded bg-[#92400E] text-white">
          <span className="font-display text-sm font-bold leading-none">P</span>
        </div>
        <span className="font-display text-base text-[#1C1917]">PeOut</span>
      </div>
    </>
  )
}
