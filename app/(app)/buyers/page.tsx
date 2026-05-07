import { getBuyersWithStats } from './actions'
import { BuyersClient } from '@/components/buyers/buyers-client'

export default async function BuyersPage() {
  const { buyers, totalOutstanding } = await getBuyersWithStats()

  const cities = Array.from(
    new Set(buyers.map((b) => b.city).filter(Boolean) as string[])
  ).sort()

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-[#1C1917]">Buyers</h1>
          <p className="text-sm text-[#78716C] mt-0.5">
            {buyers.length} {buyers.length === 1 ? 'buyer' : 'buyers'}
            {totalOutstanding > 0 && (
              <span className="text-red-600 font-medium">
                {' '}· ₹{totalOutstanding.toLocaleString('en-IN')} outstanding
              </span>
            )}
          </p>
        </div>
      </div>

      <BuyersClient buyers={buyers} cities={cities} />
    </div>
  )
}
