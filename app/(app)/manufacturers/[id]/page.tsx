import { notFound } from 'next/navigation'
import { getManufacturerDetail } from '../actions'
import { ManufacturerDetailClient } from '@/components/manufacturers/manufacturer-detail-client'

export default async function ManufacturerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await getManufacturerDetail(id)

  if (!data) notFound()

  return (
    <ManufacturerDetailClient
      manufacturer={data.manufacturer}
      products={data.products}
      orders={data.orders}
      stats={data.stats}
    />
  )
}
