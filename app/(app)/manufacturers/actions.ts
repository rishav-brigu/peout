'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Manufacturer, ManufacturerFormData, OrderStatus, PaymentStatus, Product } from '@/types'

export type ManufacturerWithStats = Manufacturer & {
  product_count: number
  order_count: number
  total_commission: number
}

export type ManufacturerOrderRow = {
  id: string
  order_number: string
  created_at: string
  order_status: OrderStatus
  payment_status: PaymentStatus
  buyer_name: string
  buyer_city: string | null
  items: number
  order_value: number
  commission: number
}

export async function getManufacturersWithStats(): Promise<{
  manufacturers: ManufacturerWithStats[]
  totalActiveProducts: number
}> {
  const supabase = await createClient()

  const [manufResult, productsResult, ordersResult, itemsResult] = await Promise.all([
    supabase.from('manufacturers').select('*').order('name'),
    supabase.from('products').select('manufacturer_id, is_active'),
    supabase.from('orders').select('manufacturer_id'),
    supabase.from('order_items').select('commission_snapshot, quantity, orders!inner(manufacturer_id)'),
  ])

  const manufacturers = manufResult.data ?? []
  const products = productsResult.data ?? []
  const orders = ordersResult.data ?? []
  const items = itemsResult.data ?? []

  const activeProductsByManuf = new Map<string, number>()
  for (const p of products) {
    if (p.is_active) {
      activeProductsByManuf.set(p.manufacturer_id, (activeProductsByManuf.get(p.manufacturer_id) ?? 0) + 1)
    }
  }

  const ordersByManuf = new Map<string, number>()
  for (const o of orders) {
    ordersByManuf.set(o.manufacturer_id, (ordersByManuf.get(o.manufacturer_id) ?? 0) + 1)
  }

  const commissionByManuf = new Map<string, number>()
  for (const item of items) {
    const mid = (item.orders as unknown as { manufacturer_id: string })?.manufacturer_id
    if (mid) {
      const lineComm = Number(item.commission_snapshot) * Number(item.quantity)
      commissionByManuf.set(mid, (commissionByManuf.get(mid) ?? 0) + lineComm)
    }
  }

  const totalActiveProducts = products.filter((p) => p.is_active).length

  return {
    manufacturers: manufacturers.map((m) => ({
      ...m,
      product_count: activeProductsByManuf.get(m.id) ?? 0,
      order_count: ordersByManuf.get(m.id) ?? 0,
      total_commission: commissionByManuf.get(m.id) ?? 0,
    })),
    totalActiveProducts,
  }
}

export async function getManufacturerDetail(id: string): Promise<{
  manufacturer: Manufacturer
  products: Product[]
  orders: ManufacturerOrderRow[]
  stats: { total_orders: number; active_skus: number; total_commission: number }
} | null> {
  const supabase = await createClient()

  const [manufResult, productsResult, ordersResult] = await Promise.all([
    supabase.from('manufacturers').select('*').eq('id', id).single(),
    supabase.from('products').select('*').eq('manufacturer_id', id).order('name'),
    supabase
      .from('orders')
      .select(
        'id, order_number, created_at, order_status, payment_status, buyers(id, name, city), order_items(quantity, sell_price_snapshot, commission_snapshot)'
      )
      .eq('manufacturer_id', id)
      .order('created_at', { ascending: false }),
  ])

  if (!manufResult.data) return null

  const orders: ManufacturerOrderRow[] = (ordersResult.data ?? []).map((o) => {
    const oi = (o.order_items as { quantity: number; sell_price_snapshot: number; commission_snapshot: number }[]) ?? []
    const buyer = o.buyers as unknown as { name: string; city: string | null } | null
    return {
      id: o.id,
      order_number: o.order_number,
      created_at: o.created_at,
      order_status: o.order_status as OrderStatus,
      payment_status: o.payment_status as PaymentStatus,
      buyer_name: buyer?.name ?? '—',
      buyer_city: buyer?.city ?? null,
      items: oi.length,
      order_value: oi.reduce((s, i) => s + Number(i.sell_price_snapshot) * Number(i.quantity), 0),
      commission: oi.reduce((s, i) => s + Number(i.commission_snapshot) * Number(i.quantity), 0),
    }
  })

  const products = (productsResult.data ?? []) as Product[]
  const activeSkus = products.filter((p) => p.is_active).length
  const totalCommission = orders.reduce((s, o) => s + o.commission, 0)

  return {
    manufacturer: manufResult.data as Manufacturer,
    products,
    orders,
    stats: {
      total_orders: orders.length,
      active_skus: activeSkus,
      total_commission: totalCommission,
    },
  }
}

export async function createManufacturer(data: ManufacturerFormData): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('manufacturers').insert({
    name: data.name.trim(),
    phone: data.phone.trim() || null,
    address: data.address.trim() || null,
    city: data.city.trim() || null,
    notes: data.notes.trim() || null,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/manufacturers')
}

export async function updateManufacturer(id: string, data: ManufacturerFormData): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('manufacturers')
    .update({
      name: data.name.trim(),
      phone: data.phone.trim() || null,
      address: data.address.trim() || null,
      city: data.city.trim() || null,
      notes: data.notes.trim() || null,
    })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/manufacturers')
  revalidatePath(`/manufacturers/${id}`)
}
