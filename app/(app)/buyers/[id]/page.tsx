import { notFound } from 'next/navigation'
import { getBuyerDetail } from '../actions'
import { BuyerDetailClient } from '@/components/buyers/buyer-detail-client'

export default async function BuyerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await getBuyerDetail(id)

  if (!data) notFound()

  return (
    <BuyerDetailClient
      buyer={data.buyer}
      orders={data.orders}
      payments={data.payments}
      stats={data.stats}
    />
  )
}
