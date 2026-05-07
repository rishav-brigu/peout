import { notFound } from 'next/navigation'
import { getOrderDetail } from '../../actions'
import { getAgentConfig } from '@/app/(app)/settings/actions'
import { OrderExportClient } from '@/components/orders/order-export-client'

export default async function OrderExportPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [order, agent] = await Promise.all([getOrderDetail(id), getAgentConfig()])

  if (!order) notFound()

  return <OrderExportClient order={order} agent={agent} />
}
