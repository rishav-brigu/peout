import { notFound } from 'next/navigation'
import { getOrderDetail } from '../../actions'
import { OrderExportClient } from '@/components/orders/order-export-client'

export default async function OrderExportPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const order = await getOrderDetail(id)

  if (!order) notFound()

  return <OrderExportClient order={order} />
}
