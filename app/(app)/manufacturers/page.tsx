import { getManufacturersWithStats } from './actions'
import { ManufacturersClient } from '@/components/manufacturers/manufacturers-client'

export default async function ManufacturersPage() {
  const { manufacturers, totalActiveProducts } = await getManufacturersWithStats()

  const cities = Array.from(
    new Set(manufacturers.map((m) => m.city).filter(Boolean) as string[])
  ).sort()

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-[#1C1917]">Manufacturers</h1>
          <p className="text-sm text-[#78716C] mt-0.5">
            {manufacturers.length} {manufacturers.length === 1 ? 'manufacturer' : 'manufacturers'}
            {totalActiveProducts > 0 && ` · ${totalActiveProducts} active products`}
          </p>
        </div>
      </div>

      <ManufacturersClient manufacturers={manufacturers} cities={cities} />
    </div>
  )
}
