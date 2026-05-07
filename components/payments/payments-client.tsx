'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, Download, CreditCard } from 'lucide-react'
import { exportPayments } from '@/lib/export'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StatusBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { formatINR, formatDate } from '@/lib/format'
import type { PaymentRow } from '@/app/(app)/payments/actions'
import type { PaymentMode } from '@/types'

const MODES: PaymentMode[] = ['Cash', 'UPI', 'Cheque', 'Bank Transfer']

const DATE_RANGES = [
  { label: 'All time', value: 'all' },
  { label: 'This month', value: 'this_month' },
  { label: 'Last month', value: 'last_month' },
  { label: 'Last 3 months', value: 'last_3' },
  { label: 'This year', value: 'this_year' },
] as const
type DateRange = (typeof DATE_RANGES)[number]['value']

function getDateBoundary(range: DateRange): Date | null {
  const now = new Date()
  switch (range) {
    case 'this_month':
      return new Date(now.getFullYear(), now.getMonth(), 1)
    case 'last_month':
      return new Date(now.getFullYear(), now.getMonth() - 1, 1)
    case 'last_3':
      return new Date(now.getFullYear(), now.getMonth() - 2, 1)
    case 'this_year':
      return new Date(now.getFullYear(), 0, 1)
    default:
      return null
  }
}

function getDateUpperBound(range: DateRange): Date | null {
  if (range !== 'last_month') return null
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
}


interface PaymentsClientProps {
  payments: PaymentRow[]
}

export function PaymentsClient({ payments }: PaymentsClientProps) {
  const [search, setSearch] = useState('')
  const [modeFilter, setModeFilter] = useState<PaymentMode | 'all'>('all')
  const [dateRange, setDateRange] = useState<DateRange>('all')
  const [buyerFilter, setBuyerFilter] = useState('all')
  const [manufacturerFilter, setManufacturerFilter] = useState('all')

  const buyers = useMemo(
    () =>
      Array.from(new Map(payments.map((p) => [p.buyer_id, p.buyer_name])).entries())
        .map(([id, name]) => ({ id, name }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [payments]
  )

  const manufacturers = useMemo(
    () =>
      Array.from(new Set(payments.map((p) => p.manufacturer_name)))
        .sort()
        .filter(Boolean),
    [payments]
  )

  const filtered = useMemo(() => {
    const lower = getDateBoundary(dateRange)
    const upper = getDateUpperBound(dateRange)

    return payments.filter((p) => {
      if (search.trim()) {
        const q = search.toLowerCase()
        if (
          !p.order_number.toLowerCase().includes(q) &&
          !p.buyer_name.toLowerCase().includes(q) &&
          !p.manufacturer_name.toLowerCase().includes(q)
        )
          return false
      }
      if (modeFilter !== 'all' && p.mode !== modeFilter) return false
      if (buyerFilter !== 'all' && p.buyer_id !== buyerFilter) return false
      if (manufacturerFilter !== 'all' && p.manufacturer_name !== manufacturerFilter) return false
      if (lower) {
        const d = new Date(p.paid_at)
        if (d < lower) return false
        if (upper && d > upper) return false
      }
      return true
    })
  }, [payments, search, modeFilter, dateRange, buyerFilter, manufacturerFilter])

  const modeTotals = useMemo(() => {
    const totals: Record<PaymentMode, { amount: number; count: number }> = {
      Cash: { amount: 0, count: 0 },
      UPI: { amount: 0, count: 0 },
      Cheque: { amount: 0, count: 0 },
      'Bank Transfer': { amount: 0, count: 0 },
    }
    for (const p of filtered) {
      totals[p.mode].amount += p.amount
      totals[p.mode].count += 1
    }
    return totals
  }, [filtered])

  const totalFiltered = filtered.reduce((s, p) => s + p.amount, 0)

  return (
    <>
      {/* Mode summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {MODES.map((mode) => (
          <div key={mode} className="bg-white border border-[#E7E3DC] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <StatusBadge status={mode} />
            </div>
            <p className="text-xl font-bold text-[#1C1917]">
              {formatINR(modeTotals[mode].amount)}
            </p>
            <p className="text-xs text-[#78716C] mt-0.5">
              {modeTotals[mode].count}{' '}
              {modeTotals[mode].count === 1 ? 'payment' : 'payments'}
            </p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#78716C]" />
          <Input
            placeholder="Search by order, buyer, manufacturer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 border-[#E7E3DC] focus-visible:ring-[#92400E] h-8 text-sm"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-[#78716C]">Period:</span>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRange)}
            className="h-8 rounded-lg border border-[#E7E3DC] bg-white px-2 text-sm text-[#1C1917] focus:outline-none focus:ring-1 focus:ring-[#92400E]"
          >
            {DATE_RANGES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-[#78716C]">Mode:</span>
          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value as PaymentMode | 'all')}
            className="h-8 rounded-lg border border-[#E7E3DC] bg-white px-2 text-sm text-[#1C1917] focus:outline-none focus:ring-1 focus:ring-[#92400E]"
          >
            <option value="all">All</option>
            {MODES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {buyers.length > 1 && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[#78716C]">Buyer:</span>
            <select
              value={buyerFilter}
              onChange={(e) => setBuyerFilter(e.target.value)}
              className="h-8 rounded-lg border border-[#E7E3DC] bg-white px-2 text-sm text-[#1C1917] focus:outline-none focus:ring-1 focus:ring-[#92400E]"
            >
              <option value="all">All</option>
              {buyers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {manufacturers.length > 1 && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[#78716C]">Manufacturer:</span>
            <select
              value={manufacturerFilter}
              onChange={(e) => setManufacturerFilter(e.target.value)}
              className="h-8 rounded-lg border border-[#E7E3DC] bg-white px-2 text-sm text-[#1C1917] focus:outline-none focus:ring-1 focus:ring-[#92400E]"
            >
              <option value="all">All</option>
              {manufacturers.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportPayments(filtered)}
            className="border-[#E7E3DC] text-[#78716C] gap-1.5"
          >
            <Download size={14} />
            Export
          </Button>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title={
            search || modeFilter !== 'all' || dateRange !== 'all' || buyerFilter !== 'all' || manufacturerFilter !== 'all'
              ? 'No payments match your filters'
              : 'No payments recorded yet'
          }
          description={
            search || modeFilter !== 'all' || dateRange !== 'all' || buyerFilter !== 'all' || manufacturerFilter !== 'all'
              ? 'Try adjusting your filters.'
              : 'Payments are recorded from the order detail page.'
          }
        />
      ) : (
        <div className="bg-white border border-[#E7E3DC] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[500px]">
            <thead>
              <tr className="border-b border-[#E7E3DC] bg-[#FAF7F2]">
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wide text-[#78716C] font-medium">
                  Date
                </th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wide text-[#78716C] font-medium">
                  Order
                </th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wide text-[#78716C] font-medium">
                  Buyer
                </th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wide text-[#78716C] font-medium hidden md:table-cell">
                  Manufacturer
                </th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wide text-[#78716C] font-medium">
                  Mode
                </th>
                <th className="text-right px-4 py-3 text-[10px] uppercase tracking-wide text-[#78716C] font-medium">
                  Amount
                </th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wide text-[#78716C] font-medium hidden lg:table-cell">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E3DC]">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-[#FAF7F2] transition-colors">
                  <td className="px-4 py-3 text-[#78716C]">{formatDate(p.paid_at)}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/orders/${p.order_id}`}
                      className="font-medium text-[#92400E] hover:underline"
                    >
                      {p.order_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[#1C1917]">
                    {p.buyer_name}
                    {p.buyer_city && (
                      <span className="text-[#A8A29E] text-xs"> · {p.buyer_city}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[#78716C] hidden md:table-cell">
                    {p.manufacturer_name}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.mode} />
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-green-600">
                    +{formatINR(p.amount)}
                  </td>
                  <td className="px-4 py-3 text-[#78716C] text-xs italic hidden lg:table-cell">
                    {p.notes ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[#E7E3DC] bg-[#FAF7F2]">
                <td
                  colSpan={5}
                  className="px-4 py-3 text-xs font-semibold text-[#78716C]"
                >
                  Total this view · {filtered.length} {filtered.length === 1 ? 'payment' : 'payments'}
                </td>
                <td className="px-4 py-3 text-right font-bold text-green-600">
                  +{formatINR(totalFiltered)}
                </td>
                <td className="hidden lg:table-cell" />
              </tr>
            </tfoot>
          </table>
          </div>
        </div>
      )}
    </>
  )
}
