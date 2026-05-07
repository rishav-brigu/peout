'use client'

import { useState, useMemo } from 'react'
import { Plus, Search, Download, Factory } from 'lucide-react'
import { exportManufacturers } from '@/lib/export'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ManufacturerCard } from './manufacturer-card'
import { ManufacturerForm } from './manufacturer-form'
import { EmptyState } from '@/components/shared/empty-state'
import type { ManufacturerWithStats } from '@/app/(app)/manufacturers/actions'
import type { Manufacturer } from '@/types'

const SORT_OPTIONS = [
  { value: 'commission', label: 'Most commission' },
  { value: 'orders', label: 'Most orders' },
  { value: 'name', label: 'Name A–Z' },
] as const

type SortKey = (typeof SORT_OPTIONS)[number]['value']

interface ManufacturersClientProps {
  manufacturers: ManufacturerWithStats[]
  cities: string[]
}

export function ManufacturersClient({ manufacturers, cities }: ManufacturersClientProps) {
  const [search, setSearch] = useState('')
  const [cityFilter, setCityFilter] = useState('all')
  const [sort, setSort] = useState<SortKey>('commission')
  const [formOpen, setFormOpen] = useState(false)
  const [editingManufacturer, setEditingManufacturer] = useState<Manufacturer | null>(null)

  const filtered = useMemo(() => {
    let list = manufacturers

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.city?.toLowerCase().includes(q) ||
          m.phone?.toLowerCase().includes(q)
      )
    }

    if (cityFilter !== 'all') {
      list = list.filter((m) => m.city === cityFilter)
    }

    return [...list].sort((a, b) => {
      if (sort === 'commission') return b.total_commission - a.total_commission
      if (sort === 'orders') return b.order_count - a.order_count
      return a.name.localeCompare(b.name)
    })
  }, [manufacturers, search, cityFilter, sort])

  function openAdd() {
    setEditingManufacturer(null)
    setFormOpen(true)
  }

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#78716C]" />
          <Input
            placeholder="Search manufacturers…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 border-[#E7E3DC] focus-visible:ring-[#92400E] h-8 text-sm"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-[#78716C]">City:</span>
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="h-8 rounded-lg border border-[#E7E3DC] bg-white px-2 text-sm text-[#1C1917] focus:outline-none focus:ring-1 focus:ring-[#92400E]"
          >
            <option value="all">All</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
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
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportManufacturers(filtered)}
            className="border-[#E7E3DC] text-[#78716C] gap-1.5"
          >
            <Download size={14} />
            Export
          </Button>
          <Button
            size="sm"
            onClick={openAdd}
            className="bg-[#92400E] hover:bg-[#78350F] text-white gap-1.5"
          >
            <Plus size={14} />
            Add manufacturer
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Factory}
          title={
            search || cityFilter !== 'all'
              ? 'No manufacturers match your filters'
              : 'No manufacturers yet'
          }
          description={
            search || cityFilter !== 'all'
              ? 'Try adjusting your search or filters.'
              : 'Add your first manufacturer to get started.'
          }
          actionLabel="Add manufacturer"
          onAction={openAdd}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((m) => (
            <ManufacturerCard key={m.id} manufacturer={m} />
          ))}
        </div>
      )}

      <ManufacturerForm
        open={formOpen}
        onOpenChange={setFormOpen}
        manufacturer={editingManufacturer}
      />
    </>
  )
}
