import Link from 'next/link'
import { Phone, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { formatINR, getInitials } from '@/lib/format'
import type { ManufacturerWithStats } from '@/app/(app)/manufacturers/actions'

interface ManufacturerCardProps {
  manufacturer: ManufacturerWithStats
}

export function ManufacturerCard({ manufacturer: m }: ManufacturerCardProps) {
  return (
    <div className="bg-white border border-[#E7E3DC] rounded-xl p-5 flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#92400E] text-white flex items-center justify-center shrink-0">
          <span className="text-sm font-semibold">{getInitials(m.name)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[#1C1917] text-sm leading-tight truncate">
              {m.name}
            </span>
            <span
              className={cn(
                'inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium border shrink-0',
                m.is_active
                  ? 'bg-green-100 text-green-700 border-green-200'
                  : 'bg-gray-100 text-gray-500 border-gray-200'
              )}
            >
              {m.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="mt-1.5 space-y-0.5">
            {m.phone && (
              <p className="text-xs text-[#78716C] flex items-center gap-1">
                <Phone size={11} />
                {m.phone}
              </p>
            )}
            {m.city && (
              <p className="text-xs text-[#78716C] flex items-center gap-1">
                <MapPin size={11} />
                {m.city}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-[#E7E3DC]" />

      <div className="flex items-end justify-between gap-2">
        <div className="flex gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-[#78716C]">Products</p>
            <p className="text-base font-semibold text-[#1C1917]">{m.product_count}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-[#78716C]">Orders</p>
            <p className="text-base font-semibold text-[#1C1917]">{m.order_count}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-[#78716C]">Commission</p>
            <p className="text-base font-semibold text-[#92400E]">
              {formatINR(m.total_commission)}
            </p>
          </div>
        </div>
        <Link
          href={`/manufacturers/${m.id}`}
          className={cn(
            buttonVariants({ variant: 'outline', size: 'sm' }),
            'border-[#E7E3DC] text-[#78716C] hover:text-[#1C1917] shrink-0'
          )}
        >
          View →
        </Link>
      </div>
    </div>
  )
}
