import { getOrders } from './actions'
import { OrdersClient } from '@/components/orders/orders-client'

export default async function OrdersPage() {
  const { orders, totalCount, totalCommission } = await getOrders()

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-[#1C1917]">Orders</h1>
          <p className="text-sm text-[#78716C] mt-0.5">
            {totalCount} {totalCount === 1 ? 'order' : 'orders'} · ₹
            {new Intl.NumberFormat('en-IN').format(Math.round(totalCommission))} commission
          </p>
        </div>
      </div>

      <OrdersClient orders={orders} />
    </div>
  )
}
