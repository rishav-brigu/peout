import { getActiveManufacturers, getActiveBuyers } from '../actions'
import { CreateOrderForm } from '@/components/orders/create-order-form'

export default async function NewOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ manufacturer_id?: string }>
}) {
  const { manufacturer_id } = await searchParams

  const [manufacturers, buyers] = await Promise.all([
    getActiveManufacturers(),
    getActiveBuyers(),
  ])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl text-[#1C1917]">New order</h1>
        <p className="text-sm text-[#78716C] mt-0.5">Fill in the details below to create an order.</p>
      </div>

      <CreateOrderForm
        manufacturers={manufacturers}
        buyers={buyers}
        defaultManufacturerId={manufacturer_id}
      />
    </div>
  )
}
