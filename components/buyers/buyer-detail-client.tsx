'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Pencil, Plus } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { StatusBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { BuyerForm } from './buyer-form'
import { formatINR, formatDate, formatMonthYear } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Buyer } from '@/types'
import type { BuyerOrderRow, BuyerPaymentRow } from '@/app/(app)/buyers/actions'
import { ShoppingCart, CreditCard } from 'lucide-react'

interface BuyerDetailClientProps {
  buyer: Buyer
  orders: BuyerOrderRow[]
  payments: BuyerPaymentRow[]
  stats: { total_orders: number; total_purchased: number; outstanding: number }
}

export function BuyerDetailClient({ buyer, orders, payments, stats }: BuyerDetailClientProps) {
  const [editOpen, setEditOpen] = useState(false)

  return (
    <>
      <div className="space-y-5">
        {/* Top bar */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl text-[#1C1917]">{buyer.name}</h1>
            <p className="text-sm text-[#78716C] mt-0.5">
              Buyer · since {formatMonthYear(buyer.created_at)}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditOpen(true)}
              className="border-[#E7E3DC] gap-1.5"
            >
              <Pencil size={13} />
              Edit details
            </Button>
            <Link
              href={`/orders/new?buyer_id=${buyer.id}`}
              className={cn(
                buttonVariants({ size: 'sm' }),
                'bg-[#92400E] hover:bg-[#78350F] text-white gap-1.5'
              )}
            >
              <Plus size={13} />
              New order
            </Link>
          </div>
        </div>

        {/* Info card */}
        <div className="bg-white border border-[#E7E3DC] rounded-xl p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-xl bg-[#92400E] text-white flex items-center justify-center shrink-0 self-start">
              <span className="font-display text-2xl font-bold">
                {buyer.name.slice(0, 2).toUpperCase()}
              </span>
            </div>

            {/* Contact */}
            <div className="flex-1 min-w-0 space-y-2">
              {buyer.phone && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-[#78716C]">Phone</p>
                  <p className="text-sm font-medium text-[#1C1917]">{buyer.phone}</p>
                </div>
              )}
              {buyer.address && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-[#78716C]">Address</p>
                  <p className="text-sm text-[#1C1917] leading-snug">{buyer.address}</p>
                </div>
              )}
              {buyer.gstin && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-[#78716C]">GSTIN</p>
                  <p className="text-sm font-mono text-[#1C1917]">{buyer.gstin}</p>
                </div>
              )}
              {!buyer.phone && !buyer.address && !buyer.gstin && (
                <p className="text-sm text-[#78716C] italic">No contact details</p>
              )}
            </div>

            {/* Lifetime stats */}
            <div className="shrink-0">
              <p className="text-[10px] uppercase tracking-widest text-[#78716C] mb-2">Lifetime</p>
              <div className="flex gap-6">
                <div>
                  <p className="text-xl font-semibold text-[#1C1917]">{stats.total_orders}</p>
                  <p className="text-xs text-[#78716C]">Orders</p>
                </div>
                <div>
                  <p className="text-xl font-semibold text-[#1C1917]">
                    {formatINR(stats.total_purchased)}
                  </p>
                  <p className="text-xs text-[#78716C]">Total purchased</p>
                </div>
                <div>
                  {stats.outstanding > 0 ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-700 border border-red-200">
                      {formatINR(stats.outstanding)}
                    </span>
                  ) : (
                    <p className="text-xl font-semibold text-green-700">
                      {formatINR(0)}
                    </p>
                  )}
                  <p className="text-xs text-[#78716C] mt-1">Outstanding</p>
                </div>
              </div>
            </div>

            {/* Notes */}
            {buyer.notes && (
              <div className="md:max-w-xs w-full">
                <p className="text-[10px] uppercase tracking-widest text-[#78716C] mb-1">Notes</p>
                <div className="bg-[#FEF9F0] border border-[#FDE68A] rounded-lg px-3 py-2">
                  <p className="text-xs text-[#78350F] leading-relaxed italic">{buyer.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="orders">
          <TabsList variant="line" className="border-b border-[#E7E3DC] w-full rounded-none pb-0 h-auto">
            <TabsTrigger
              value="orders"
              className="text-sm pb-3 px-1 mr-4 data-[active]:text-[#92400E] [&[data-active]]:after:bg-[#92400E]"
            >
              Orders · {orders.length}
            </TabsTrigger>
            <TabsTrigger
              value="payments"
              className="text-sm pb-3 px-1 data-[active]:text-[#92400E] [&[data-active]]:after:bg-[#92400E]"
            >
              Payments · {payments.length}
            </TabsTrigger>
          </TabsList>

          {/* Orders tab */}
          <TabsContent value="orders" className="mt-4">
            {orders.length === 0 ? (
              <EmptyState
                icon={ShoppingCart}
                title="No orders yet"
                description="Orders for this buyer will appear here once created."
                actionLabel="New order"
                actionHref={`/orders/new?buyer_id=${buyer.id}`}
              />
            ) : (
              <div className="bg-white border border-[#E7E3DC] rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[620px]">
                  <thead>
                    <tr className="border-b border-[#E7E3DC] bg-[#FAF7F2]">
                      <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wide text-[#78716C] font-medium">Order ID</th>
                      <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wide text-[#78716C] font-medium">Date</th>
                      <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wide text-[#78716C] font-medium">Manufacturer</th>
                      <th className="text-center px-4 py-3 text-[10px] uppercase tracking-wide text-[#78716C] font-medium">Items</th>
                      <th className="text-right px-4 py-3 text-[10px] uppercase tracking-wide text-[#78716C] font-medium">Order value</th>
                      <th className="text-right px-4 py-3 text-[10px] uppercase tracking-wide text-[#78716C] font-medium">Commission</th>
                      <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wide text-[#78716C] font-medium">Payment</th>
                      <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wide text-[#78716C] font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7E3DC]">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-[#FAF7F2] transition-colors">
                        <td className="px-4 py-3">
                          <Link href={`/orders/${o.id}`} className="font-medium text-[#92400E] hover:underline">
                            {o.order_number}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-[#78716C]">{formatDate(o.created_at)}</td>
                        <td className="px-4 py-3 text-[#1C1917]">
                          {o.manufacturer_name}
                          {o.manufacturer_city && (
                            <span className="text-[#78716C]"> · {o.manufacturer_city}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center text-[#78716C]">{o.items}</td>
                        <td className="px-4 py-3 text-right text-[#1C1917]">{formatINR(o.order_value)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-[#92400E]">{formatINR(o.commission)}</td>
                        <td className="px-4 py-3"><StatusBadge status={o.payment_status} /></td>
                        <td className="px-4 py-3"><StatusBadge status={o.order_status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Payments tab */}
          <TabsContent value="payments" className="mt-4">
            {payments.length === 0 ? (
              <EmptyState
                icon={CreditCard}
                title="No payments recorded"
                description="Payments for this buyer will appear here once recorded from an order."
              />
            ) : (
              <div className="bg-white border border-[#E7E3DC] rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[400px]">
                  <thead>
                    <tr className="border-b border-[#E7E3DC] bg-[#FAF7F2]">
                      <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wide text-[#78716C] font-medium">Date</th>
                      <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wide text-[#78716C] font-medium">Order ID</th>
                      <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wide text-[#78716C] font-medium">Mode</th>
                      <th className="text-right px-4 py-3 text-[10px] uppercase tracking-wide text-[#78716C] font-medium">Amount</th>
                      <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wide text-[#78716C] font-medium">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7E3DC]">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-[#FAF7F2] transition-colors">
                        <td className="px-4 py-3 text-[#78716C]">{formatDate(p.paid_at)}</td>
                        <td className="px-4 py-3">
                          <Link href={`/orders/${p.order_id}`} className="font-medium text-[#92400E] hover:underline">
                            {p.order_number}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={p.mode} />
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-green-700">
                          +{formatINR(p.amount)}
                        </td>
                        <td className="px-4 py-3 text-[#78716C] text-xs italic">
                          {p.notes ?? '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-[#E7E3DC] bg-[#FAF7F2]">
                      <td colSpan={3} className="px-4 py-3 text-xs font-medium text-[#78716C]">
                        Total received
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-green-700">
                        +{formatINR(payments.reduce((s, p) => s + p.amount, 0))}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <BuyerForm open={editOpen} onOpenChange={setEditOpen} buyer={buyer} />
    </>
  )
}
