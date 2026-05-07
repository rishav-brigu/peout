'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, Plus, Eye } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StatusBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { formatINR, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { ShoppingCart } from 'lucide-react'
import type { OrderListRow } from '@/app/(app)/orders/actions'
import type { OrderStatus, PaymentStatus } from '@/types'

const ORDER_STATUSES: OrderStatus[] = ['Draft', 'Confirmed', 'Delivered', 'Closed', 'Cancelled']
const PAYMENT_STATUSES: PaymentStatus[] = ['Unpaid', 'Partial', 'Paid']

interface OrdersClientProps {
  orders: OrderListRow[]
}

export function OrdersClient({ orders }: OrdersClientProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | 'all'>('all')

  const filtered = useMemo(() => {
    let list = orders

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (o) =>
          o.order_number.toLowerCase().includes(q) ||
          o.manufacturer_name.toLowerCase().includes(q) ||
          o.buyer_name.toLowerCase().includes(q)
      )
    }

    if (statusFilter !== 'all') {
      list = list.filter((o) => o.order_status === statusFilter)
    }

    if (paymentFilter !== 'all') {
      list = list.filter((o) => o.payment_status === paymentFilter)
    }

    return list
  }, [orders, search, statusFilter, paymentFilter])

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#78716C]" />
          <Input
            placeholder="Search by order ID, manufacturer, buyer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 border-[#E7E3DC] focus-visible:ring-[#92400E] h-8 text-sm"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-[#78716C]">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
            className="h-8 rounded-lg border border-[#E7E3DC] bg-white px-2 text-sm text-[#1C1917] focus:outline-none focus:ring-1 focus:ring-[#92400E]"
          >
            <option value="all">All</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-[#78716C]">Payment:</span>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value as PaymentStatus | 'all')}
            className="h-8 rounded-lg border border-[#E7E3DC] bg-white px-2 text-sm text-[#1C1917] focus:outline-none focus:ring-1 focus:ring-[#92400E]"
          >
            <option value="all">All</option>
            {PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="ml-auto">
          <Link
            href="/orders/new"
            className={cn(
              buttonVariants({ size: 'sm' }),
              'bg-[#92400E] hover:bg-[#78350F] text-white gap-1.5'
            )}
          >
            <Plus size={14} />
            New order
          </Link>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title={
            search || statusFilter !== 'all' || paymentFilter !== 'all'
              ? 'No orders match your filters'
              : 'No orders yet'
          }
          description={
            search || statusFilter !== 'all' || paymentFilter !== 'all'
              ? 'Try adjusting your search or filters.'
              : 'Create your first order to get started.'
          }
          actionLabel="New order"
          actionHref="/orders/new"
        />
      ) : (
        <div className="bg-white border border-[#E7E3DC] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[750px]">
            <thead>
              <tr className="border-b border-[#E7E3DC] bg-[#FAF7F2]">
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wide text-[#78716C] font-medium">
                  Order ID
                </th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wide text-[#78716C] font-medium">
                  Date
                </th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wide text-[#78716C] font-medium">
                  Manufacturer
                </th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wide text-[#78716C] font-medium">
                  Buyer
                </th>
                <th className="text-center px-4 py-3 text-[10px] uppercase tracking-wide text-[#78716C] font-medium">
                  Items
                </th>
                <th className="text-right px-4 py-3 text-[10px] uppercase tracking-wide text-[#78716C] font-medium">
                  Order value
                </th>
                <th className="text-right px-4 py-3 text-[10px] uppercase tracking-wide text-[#78716C] font-medium text-[#92400E]">
                  Commission
                </th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wide text-[#78716C] font-medium">
                  Payment
                </th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wide text-[#78716C] font-medium">
                  Status
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E3DC]">
              {filtered.map((o) => (
                <tr key={o.id} className="hover:bg-[#FAF7F2] transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/orders/${o.id}`}
                      className="font-medium text-[#92400E] hover:underline"
                    >
                      {o.order_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[#78716C]">{formatDate(o.created_at)}</td>
                  <td className="px-4 py-3 text-[#1C1917]">
                    {o.manufacturer_name}
                    {o.manufacturer_city && (
                      <span className="text-[#A8A29E]"> · {o.manufacturer_city}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[#1C1917]">
                    {o.buyer_name}
                    {o.buyer_city && (
                      <span className="text-[#A8A29E]"> · {o.buyer_city}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-[#78716C]">{o.items}</td>
                  <td className="px-4 py-3 text-right text-[#1C1917]">
                    {formatINR(o.order_value)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-[#92400E]">
                    {formatINR(o.commission)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={o.payment_status} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={o.order_status} />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/orders/${o.id}`}
                      className="p-1 rounded text-[#78716C] hover:text-[#1C1917] hover:bg-[#FAF7F2] transition-colors inline-flex"
                      title="View order"
                    >
                      <Eye size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          <div className="px-4 py-2 border-t border-[#E7E3DC] bg-[#FAF7F2] text-xs text-[#78716C]">
            Showing {filtered.length} of {orders.length} orders
          </div>
        </div>
      )}
    </>
  )
}
