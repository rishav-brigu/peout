'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { MobileNav } from '@/components/layout/mobile-nav'
import { LogOut } from 'lucide-react'

export function Topbar() {
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="flex items-center justify-between h-14 px-6 border-b border-[#E7E3DC] bg-white shrink-0">
      <MobileNav />
      <div className="flex-1" />
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSignOut}
        className="text-[#78716C] hover:text-[#1C1917] hidden md:flex"
      >
        <LogOut size={16} className="mr-1.5" />
        Sign out
      </Button>
    </header>
  )
}
