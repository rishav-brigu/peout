'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { formatDate } from '@/lib/format'
import type { OrderDetailData } from '@/app/(app)/orders/actions'
import type { CopyType } from '@/components/pdf/order-document'

const OrderPdfPanel = dynamic(() => import('./order-pdf-panel'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-20 text-[#78716C] gap-2">
      <Loader2 size={18} className="animate-spin" />
      <span className="text-sm">Generating preview…</span>
    </div>
  ),
})

interface OrderExportClientProps {
  order: OrderDetailData
}

export function OrderExportClient({ order }: OrderExportClientProps) {
  const [copyType, setCopyType] = useState<CopyType>('buyer')

  return (
    <div className="space-y-5">
      {/* Top bar */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href={`/orders/${order.id}`}
              className="text-[#78716C] hover:text-[#1C1917] transition-colors"
            >
              <ArrowLeft size={16} />
            </Link>
            <h1 className="font-display text-2xl text-[#1C1917]">
              Export · {order.order_number}
            </h1>
          </div>
          <p className="text-sm text-[#78716C]">
            Print preview — A4 · {formatDate(order.created_at)}
          </p>
        </div>
      </div>

      {/* Copy type toggle */}
      <div className="inline-flex border border-[#E7E3DC] rounded-lg p-0.5 bg-[#FAF7F2]">
        {(['buyer', 'manufacturer'] as CopyType[]).map((type) => (
          <button
            key={type}
            onClick={() => setCopyType(type)}
            className={`px-4 py-1.5 rounded-md text-sm transition-colors capitalize ${
              copyType === type
                ? 'bg-white text-[#1C1917] font-medium shadow-sm border border-[#E7E3DC]'
                : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            {type === 'buyer' ? 'Buyer copy' : 'Manufacturer copy'}
          </button>
        ))}
      </div>

      {/* PDF panel — loaded client-side only */}
      <OrderPdfPanel order={order} copyType={copyType} />
    </div>
  )
}
