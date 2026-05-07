'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Pencil, Plus, Clock, ExternalLink } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { StatusBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { ManufacturerForm } from './manufacturer-form'
import { formatINR, formatDate, formatMonthYear } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Manufacturer, Product } from '@/types'
import type { ManufacturerOrderRow } from '@/app/(app)/manufacturers/actions'
import { Package2, ShoppingCart } from 'lucide-react'

interface ManufacturerDetailClientProps {
  manufacturer: Manufacturer
  products: Product[]
  orders: ManufacturerOrderRow[]
  stats: { total_orders: number; active_skus: number; total_commission: number }
}

export function ManufacturerDetailClient({
  manufacturer,
  products,
  orders,
  stats,
}: ManufacturerDetailClientProps) {
  const [editOpen, setEditOpen] = useState(false)

  return (
    <>
      <div className="space-y-5">
        {/* Top bar */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl text-[#1C1917]">{manufacturer.name}</h1>
            <p className="text-sm text-[#78716C] mt-0.5">
              Manufacturer · since {formatMonthYear(manufacturer.created_at)}
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
              href={`/orders/new?manufacturer_id=${manufacturer.id}`}
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
                {manufacturer.name.slice(0, 2).toUpperCase()}
              </span>
            </div>

            {/* Contact */}
            <div className="flex-1 min-w-0 space-y-1">
              {manufacturer.phone && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-[#78716C]">Phone</p>
                  <p className="text-sm font-medium text-[#1C1917]">{manufacturer.phone}</p>
                </div>
              )}
              {manufacturer.address && (
                <div className="mt-2">
                  <p className="text-[10px] uppercase tracking-widest text-[#78716C]">Address</p>
                  <p className="text-sm text-[#1C1917] leading-snug">{manufacturer.address}</p>
                </div>
              )}
              {!manufacturer.phone && !manufacturer.address && (
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
                  <p className="text-xl font-semibold text-[#1C1917]">{stats.active_skus}</p>
                  <p className="text-xs text-[#78716C]">Active SKUs</p>
                </div>
                <div>
                  <p className="text-xl font-semibold text-[#92400E]">
                    {formatINR(stats.total_commission)}
                  </p>
                  <p className="text-xs text-[#78716C]">Commission earned</p>
                </div>
              </div>
            </div>

            {/* Notes */}
            {manufacturer.notes && (
              <div className="md:max-w-xs w-full">
                <p className="text-[10px] uppercase tracking-widest text-[#78716C] mb-1">Notes</p>
                <div className="bg-[#FEF9F0] border border-[#FDE68A] rounded-lg px-3 py-2">
                  <p className="text-xs text-[#78350F] leading-relaxed italic">
                    {manufacturer.notes}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="products">
          <TabsList variant="line" className="border-b border-[#E7E3DC] w-full rounded-none pb-0 h-auto">
            <TabsTrigger
              value="products"
              className="text-sm pb-3 px-1 mr-4 data-[active]:text-[#92400E] [&[data-active]]:after:bg-[#92400E]"
            >
              Products · {products.length}
            </TabsTrigger>
            <TabsTrigger
              value="orders"
              className="text-sm pb-3 px-1 data-[active]:text-[#92400E] [&[data-active]]:after:bg-[#92400E]"
            >
              Orders · {orders.length}
            </TabsTrigger>
          </TabsList>

          {/* Products tab */}
          <TabsContent value="products" className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-[#1C1917]">Products</span>
              <Button
                size="sm"
                className="bg-[#92400E] hover:bg-[#78350F] text-white gap-1.5"
                disabled
              >
                <Plus size={13} />
                Add product
              </Button>
            </div>

            {products.length === 0 ? (
              <EmptyState
                icon={Package2}
                title="No products yet"
                description="Products for this manufacturer will appear here once added."
              />
            ) : (
              <div className="bg-white border border-[#E7E3DC] rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#E7E3DC] bg-[#FAF7F2]">
                      <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wide text-[#78716C] font-medium">
                        Product
                      </th>
                      <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wide text-[#78716C] font-medium">
                        Unit
                      </th>
                      <th className="text-right px-4 py-3 text-[10px] uppercase tracking-wide text-[#78716C] font-medium">
                        Mfr ₹
                      </th>
                      <th className="text-right px-4 py-3 text-[10px] uppercase tracking-wide text-[#78716C] font-medium">
                        Sell ₹
                      </th>
                      <th className="text-right px-4 py-3 text-[10px] uppercase tracking-wide text-[#78716C] font-medium text-[#92400E]">
                        Commission
                      </th>
                      <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wide text-[#78716C] font-medium">
                        Last updated
                      </th>
                      <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wide text-[#78716C] font-medium">
                        Status
                      </th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7E3DC]">
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-[#FAF7F2] transition-colors">
                        <td className="px-4 py-3 font-medium text-[#1C1917]">{p.name}</td>
                        <td className="px-4 py-3 text-[#78716C]">{p.unit}</td>
                        <td className="px-4 py-3 text-right text-[#1C1917]">
                          {p.mfr_price.toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 text-right text-[#1C1917]">
                          {p.sell_price.toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-[#92400E]">
                          {p.commission.toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 text-[#78716C]">{formatDate(p.updated_at)}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={p.is_active ? 'Active' : 'Inactive'} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              className="p-1 rounded text-[#78716C] hover:text-[#1C1917] hover:bg-[#FAF7F2] transition-colors"
                              title="Price history"
                            >
                              <Clock size={14} />
                            </button>
                            <button
                              className="p-1 rounded text-[#78716C] hover:text-[#1C1917] hover:bg-[#FAF7F2] transition-colors"
                              title="Edit product"
                            >
                              <Pencil size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          {/* Orders tab */}
          <TabsContent value="orders" className="mt-4">
            {orders.length === 0 ? (
              <EmptyState
                icon={ShoppingCart}
                title="No orders yet"
                description="Orders for this manufacturer will appear here once created."
                actionLabel="New order"
                actionHref={`/orders/new?manufacturer_id=${manufacturer.id}`}
              />
            ) : (
              <div className="bg-white border border-[#E7E3DC] rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#E7E3DC] bg-[#FAF7F2]">
                      <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wide text-[#78716C] font-medium">
                        Order ID
                      </th>
                      <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wide text-[#78716C] font-medium">
                        Date
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
                      <th className="text-right px-4 py-3 text-[10px] uppercase tracking-wide text-[#78716C] font-medium">
                        Commission
                      </th>
                      <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wide text-[#78716C] font-medium">
                        Payment
                      </th>
                      <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wide text-[#78716C] font-medium">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7E3DC]">
                    {orders.map((o) => (
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
                          {o.buyer_name}
                          {o.buyer_city && (
                            <span className="text-[#78716C]"> · {o.buyer_city}</span>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <ManufacturerForm
        open={editOpen}
        onOpenChange={setEditOpen}
        manufacturer={manufacturer}
      />
    </>
  )
}
