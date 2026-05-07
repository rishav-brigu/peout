export const dynamic = 'force-dynamic'

import { requireAuth } from '@/lib/auth'
import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAuth()

  return (
    <div className="flex h-screen bg-[#FAF7F2] overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto px-6 py-6 pb-20 md:pb-6">
          {children}
        </main>
      </div>
    </div>
  )
}
