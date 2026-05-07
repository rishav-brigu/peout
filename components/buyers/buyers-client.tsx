'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Plus, Search, Upload, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { buttonVariants } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { BuyerForm } from './buyer-form'
import { formatINR } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { BuyerWithStats } from '@/app/(app)/buyers/actions'
import type { Buyer } from '@/types'

const SORT_OPTIONS = [
  { value: 'outstanding', label: 'Most outstanding' },
  { value: 'purchased', label: 'Most purchased' },
  { value: 'orders', label: 'Most orders' },
  { value: 'name', label: 'Name A–Z' },
] as const

type SortKey = (typeof SORT_OPTIONS)[number]['value']

const OUTSTANDING_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'has', label: 'Has outstanding' },
  { value: 'none', label: 'Fully paid' },
] as const

type OutstandingFilter = (typeof OUTSTANDING_OPTIONS)[number]['value']

interface BuyersClientProps {
  buyers: BuyerWithStats[]
  cities: string[]
}

export function BuyersClient({ buyers, cities }: BuyersClientProps) {
  const [search, setSearch] = useState('')
  const [cityFilter, setCityFilter] = useState('all')
  const [outstandingFilter, setOutstandingFilter] = useState<OutstandingFilter>('all')
  const [sort, setSort] = useState<SortKey>('outstanding')
  const [formOpen, setFormOpen] = useState(false)
  const [editingBuyer, setEditingBuyer] = useState<Buyer | null>(null)

  const filtered = useMemo(() => {
    let list = buyers

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.city?.toLowerCase().includes(q) ||
          b.phone?.toLowerCase().includes(q) ||
          b.gstin?.toLowerCase().includes(q)
      )
    }

    if (cityFilter !== 'all') {
      list = list.filter((b) => b.city === cityFilter)
    }

    if (outstandingFilter === 'has') {
      list = list.filter((b) => b.outstanding > 0)
    } else if (outstandingFilter === 'none') {
      list = list.filter((b) => b.outstanding <= 0)
    }

    return [...list].sort((a, b) => {
      if (sort === 'outstanding') return b.outstanding - a.outstanding
      if (sort === 'purchased') return b.total_purchased - a.total_purchased
      if (sort === 'orders') return b.order_count - a.order_count
      return a.name.localeCompare(b.name)
    })
  }, [buyers, search, cityFilter, outstandingFilter, sort])

  function openAdd() {
    setEditingBuyer(null)
    setFormOpen(true)
  }

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#78716C]" />
          <Input
            placeholder="Search buyers…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 border-[#E7E3DC] focus-visible:ring-[#92400E] h-8 text-sm"
          />
        </div>

        {cities.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[#78716C]">City:</span>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="h-8 rounded-lg border border-[#E7E3DC] bg-white px-2 text-sm text-[#1C1917] focus:outline-none focus:ring-1 focus:ring-[#92400E]"
            >
              <option value="all">All</option>
              {cities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-[#78716C]">Outstanding:</span>
          <select
            value={outstandingFilter}
            onChange={(e) => setOutstandingFilter(e.target.value as OutstandingFilter)}
            className="h-8 rounded-lg border border-[#E7E3DC] bg-white px-2 text-sm text-[#1C1917] focus:outline-none focus:ring-1 focus:ring-[#92400E]"
          >
            {OUTSTANDING_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-[#78716C]">Sort:</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="h-8 rounded-lg border border-[#E7E3DC] bg-white px-2 text-sm text-[#1C1917] focus:outline-none focus:ring-1 focus:ring-[#92400E]"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" className="border-[#E7E3DC] text-[#78716C] gap-1.5">
            <Upload size={14} />
            Export
          </Button>
          <Button
            size="sm"
            onClick={openAdd}
            className="bg-[#92400E] hover:bg-[#78350F] text-white gap-1.5"
          >
            <Plus size={14} />
            Add buyer
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={
            search || cityFilter !== 'all' || outstandingFilter !== 'all'
              ? 'No buyers match your filters'
              : 'No buyers yet'
          }
          description={
            search || cityFilter !== 'all' || outstandingFilter !== 'all'
              ? 'Try adjusting your search or filters.'
              : 'Add your first buyer to get started.'
          }
          actionLabel="Add buyer"
          onAction={openAdd}
        />
      ) : (
        <div className="bg-white border border-[#E7E3DC] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E7E3DC] bg-[#FAF7F2]">
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wide text-[#78716C] font-medium">
                  Buyer
                </th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wide text-[#78716C] font-medium">
                  City
                </th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wide text-[#78716C] font-medium">
                  Phone
                </th>
                <th className="text-center px-4 py-3 text-[10px] uppercase tracking-wide text-[#78716C] font-medium">
                  Orders
                </th>
                <th className="text-right px-4 py-3 text-[10px] uppercase tracking-wide text-[#78716C] font-medium">
                  Total purchased
                </th>
                <th className="text-right px-4 py-3 text-[10px] uppercase tracking-wide text-[#78716C] font-medium">
                  Outstanding
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E3DC]">
              {filtered.map((b) => (
                <tr key={b.id} className="hover:bg-[#FAF7F2] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#92400E] text-white flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold font-display">
                          {b.name.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-[#1C1917]">{b.name}</p>
                        {b.gstin && (
                          <p className="text-[10px] text-[#78716C] font-mono">{b.gstin}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#78716C]">{b.city ?? '—'}</td>
                  <td className="px-4 py-3 text-[#78716C]">{b.phone ?? '—'}</td>
                  <td className="px-4 py-3 text-center text-[#1C1917]">{b.order_count}</td>
                  <td className="px-4 py-3 text-right text-[#1C1917]">
                    {b.total_purchased > 0 ? formatINR(b.total_purchased) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {b.outstanding > 0 ? (
                      <span className="font-semibold text-red-600">{formatINR(b.outstanding)}</span>
                    ) : (
                      <span className="text-[#78716C]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/buyers/${b.id}`}
                      className={cn(
                        buttonVariants({ variant: 'outline', size: 'sm' }),
                        'border-[#E7E3DC] text-[#78716C] hover:text-[#1C1917] h-7 text-xs'
                      )}
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <BuyerForm
        open={formOpen}
        onOpenChange={setFormOpen}
        buyer={editingBuyer}
      />
    </>
  )
}
