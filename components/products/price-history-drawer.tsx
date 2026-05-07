'use client'

import { useState, useEffect } from 'react'
import { ArrowRight, TrendingUp, TrendingDown, Minus, Plus } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { formatINR, formatDate } from '@/lib/format'
import { getProductPriceHistory } from '@/app/(app)/products/actions'
import type { Product } from '@/types'
import type { PriceHistoryRow, ProductWithManufacturer } from '@/app/(app)/products/actions'

interface PriceHistoryDrawerProps {
  product: ProductWithManufacturer | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onRecordChange: () => void
}

export function PriceHistoryDrawer({
  product,
  open,
  onOpenChange,
  onRecordChange,
}: PriceHistoryDrawerProps) {
  const [history, setHistory] = useState<PriceHistoryRow[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && product) {
      setLoading(true)
      getProductPriceHistory(product.id)
        .then(setHistory)
        .catch(() => setHistory([]))
        .finally(() => setLoading(false))
    }
  }, [open, product])

  if (!product) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton
        className="sm:max-w-md flex flex-col"
      >
        <SheetHeader className="border-b border-[#E7E3DC] pb-4">
          <p className="text-[10px] uppercase tracking-widest text-[#78716C]">Price history</p>
          <SheetTitle className="font-display text-lg text-[#1C1917] leading-tight">
            {product.name}
          </SheetTitle>
          <p className="text-xs text-[#78716C]">
            {product.manufacturer_name} · {product.unit}
          </p>
        </SheetHeader>

        {/* Current prices */}
        <div className="px-4 py-4 border-b border-[#E7E3DC]">
          <p className="text-[10px] uppercase tracking-widest text-[#78716C] mb-3">Current rates</p>
          <div className="flex gap-6">
            <div>
              <p className="text-xs text-[#78716C]">Mfr price</p>
              <p className="text-lg font-semibold text-[#1C1917]">{formatINR(product.mfr_price)}</p>
            </div>
            <div>
              <p className="text-xs text-[#78716C]">Sell price</p>
              <p className="text-lg font-semibold text-[#1C1917]">{formatINR(product.sell_price)}</p>
            </div>
            <div>
              <p className="text-xs text-[#78716C]">Commission</p>
              <p className="text-lg font-semibold text-[#92400E]">{formatINR(product.commission)}</p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse space-y-2">
                  <div className="h-3 w-24 bg-[#E7E3DC] rounded" />
                  <div className="h-16 bg-[#E7E3DC] rounded-lg" />
                </div>
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-[#78716C]">No price changes recorded yet.</p>
              <p className="text-xs text-[#78716C] mt-1">
                Changes are logged automatically when you edit prices.
              </p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[7px] top-2 bottom-0 w-px bg-[#E7E3DC]" />

              <div className="space-y-5">
                {history.map((entry, i) => {
                  const mfrDelta = (entry.new_mfr_price ?? 0) - (entry.old_mfr_price ?? 0)
                  const sellDelta = (entry.new_sell_price ?? 0) - (entry.old_sell_price ?? 0)

                  return (
                    <div key={entry.id} className="flex gap-4">
                      {/* Timeline dot */}
                      <div
                        className={`mt-1 w-4 h-4 rounded-full border-2 shrink-0 z-10 ${
                          i === 0
                            ? 'bg-[#92400E] border-[#92400E]'
                            : 'bg-white border-[#E7E3DC]'
                        }`}
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="text-xs text-[#78716C]">{formatDate(entry.changed_at)}</p>
                          {i === 0 && (
                            <span className="text-[10px] uppercase tracking-wide bg-[#92400E] text-white px-1.5 py-0.5 rounded">
                              Latest
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <PriceChangeCard
                            label="Mfr ₹"
                            oldVal={entry.old_mfr_price}
                            newVal={entry.new_mfr_price}
                            delta={mfrDelta}
                          />
                          <PriceChangeCard
                            label="Sell ₹"
                            oldVal={entry.old_sell_price}
                            newVal={entry.new_sell_price}
                            delta={sellDelta}
                          />
                        </div>

                        {entry.reason && (
                          <p className="text-xs text-[#78716C] italic mt-2 pl-1">
                            "{entry.reason}"
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#E7E3DC] p-4">
          <Button
            className="w-full bg-[#92400E] hover:bg-[#78350F] text-white gap-1.5"
            onClick={() => {
              onOpenChange(false)
              onRecordChange()
            }}
          >
            <Plus size={14} />
            Record price change
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function PriceChangeCard({
  label,
  oldVal,
  newVal,
  delta,
}: {
  label: string
  oldVal: number | null
  newVal: number | null
  delta: number
}) {
  const Icon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus
  const deltaColor = delta > 0 ? 'text-red-600' : delta < 0 ? 'text-green-600' : 'text-[#78716C]'

  return (
    <div className="bg-[#FAF7F2] border border-[#E7E3DC] rounded-lg px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-[#78716C] mb-1">{label}</p>
      <div className="flex items-center gap-1 text-xs">
        <span className="text-[#78716C]">{formatINR(oldVal ?? 0)}</span>
        <ArrowRight size={10} className="text-[#78716C]" />
        <span className="font-semibold text-[#1C1917]">{formatINR(newVal ?? 0)}</span>
      </div>
      <div className={`flex items-center gap-0.5 mt-1 text-[10px] font-medium ${deltaColor}`}>
        <Icon size={10} />
        {delta !== 0 && (
          <span>
            {delta > 0 ? '+' : ''}
            {formatINR(delta)}
          </span>
        )}
        {delta === 0 && <span>No change</span>}
      </div>
    </div>
  )
}
