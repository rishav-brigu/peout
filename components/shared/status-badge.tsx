import { cn } from '@/lib/utils'
import type { OrderStatus, PaymentStatus, ProductStatus, PaymentMode } from '@/types'

type BadgeVariant =
  | OrderStatus
  | PaymentStatus
  | ProductStatus
  | PaymentMode

const variantStyles: Record<string, string> = {
  // Order status
  Draft:     'bg-gray-100 text-gray-600 border-gray-200',
  Confirmed: 'bg-amber-100 text-amber-700 border-amber-200',
  Delivered: 'bg-green-100 text-green-700 border-green-200',
  Closed:    'bg-green-100 text-green-700 border-green-200',
  Cancelled: 'bg-red-100 text-red-700 border-red-200',
  // Payment status
  Unpaid:    'bg-red-100 text-red-700 border-red-200',
  Partial:   'bg-amber-100 text-amber-700 border-amber-200',
  Paid:      'bg-green-100 text-green-700 border-green-200',
  // Product status
  Active:    'bg-green-100 text-green-700 border-green-200',
  Inactive:  'bg-gray-100 text-gray-600 border-gray-200',
  // Payment mode
  Cash:      'bg-emerald-100 text-emerald-700 border-emerald-200',
  UPI:       'bg-violet-100 text-violet-700 border-violet-200',
  Cheque:    'bg-blue-100 text-blue-700 border-blue-200',
  'Bank Transfer': 'bg-sky-100 text-sky-700 border-sky-200',
}

interface StatusBadgeProps {
  status: BadgeVariant
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const styles = variantStyles[status] ?? 'bg-gray-100 text-gray-600 border-gray-200'
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
        styles,
        className
      )}
    >
      {status}
    </span>
  )
}
