import { type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-[#F5F0E8] mb-4">
        <Icon size={24} className="text-[#78716C]" />
      </div>
      <h3 className="text-base font-semibold text-[#1C1917] mb-1">{title}</h3>
      <p className="text-sm text-[#78716C] max-w-sm mb-6">{description}</p>
      {actionLabel && (
        actionHref ? (
          <Link
            href={actionHref}
            className={cn(
              buttonVariants(),
              'bg-[#92400E] hover:bg-[#78350F] text-white'
            )}
          >
            {actionLabel} →
          </Link>
        ) : (
          <button
            onClick={onAction}
            className={cn(
              buttonVariants(),
              'bg-[#92400E] hover:bg-[#78350F] text-white'
            )}
          >
            {actionLabel} →
          </button>
        )
      )}
    </div>
  )
}
