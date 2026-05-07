import { notFound } from 'next/navigation'
import { getOrderDetail } from '../actions'
import { OrderDetailClient } from '@/components/orders/order-detail-client'

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const order = await getOrderDetail(id)

  if (!order) notFound()

  return <OrderDetailClient order={order} />
}
