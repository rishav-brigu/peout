'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Buyer, BuyerFormData, OrderStatus, PaymentStatus, PaymentMode } from '@/types'

export type BuyerWithStats = Buyer & {
  order_count: number
  total_purchased: number
  outstanding: number
}

export type BuyerOrderRow = {
  id: string
  order_number: string
  created_at: string
  order_status: OrderStatus
  payment_status: PaymentStatus
  manufacturer_name: string
  manufacturer_city: string | null
  items: number
  order_value: number
  commission: number
}

export type BuyerPaymentRow = {
  id: string
  order_id: string
  order_number: string
  amount: number
  mode: PaymentMode
  notes: string | null
  paid_at: string
}

export async function getBuyersWithStats(): Promise<{
  buyers: BuyerWithStats[]
  totalOutstanding: number
}> {
  const supabase = await createClient()

  const [buyersResult, ordersResult, itemsResult, paymentsResult] = await Promise.all([
    supabase.from('buyers').select('*').order('name'),
    supabase.from('orders').select('buyer_id'),
    supabase.from('order_items').select('sell_price_snapshot, quantity, orders!inner(buyer_id)'),
    supabase.from('payments').select('amount, orders!inner(buyer_id)'),
  ])

  const buyers = buyersResult.data ?? []
  const orders = ordersResult.data ?? []
  const items = itemsResult.data ?? []
  const payments = paymentsResult.data ?? []

  const ordersByBuyer = new Map<string, number>()
  for (const o of orders) {
    ordersByBuyer.set(o.buyer_id, (ordersByBuyer.get(o.buyer_id) ?? 0) + 1)
  }

  const purchasedByBuyer = new Map<string, number>()
  for (const item of items) {
    const bid = (item.orders as unknown as { buyer_id: string })?.buyer_id
    if (bid) {
      const lineValue = Number(item.sell_price_snapshot) * Number(item.quantity)
      purchasedByBuyer.set(bid, (purchasedByBuyer.get(bid) ?? 0) + lineValue)
    }
  }

  const paidByBuyer = new Map<string, number>()
  for (const p of payments) {
    const bid = (p.orders as unknown as { buyer_id: string })?.buyer_id
    if (bid) {
      paidByBuyer.set(bid, (paidByBuyer.get(bid) ?? 0) + Number(p.amount))
    }
  }

  const result: BuyerWithStats[] = buyers.map((b) => {
    const purchased = purchasedByBuyer.get(b.id) ?? 0
    const paid = paidByBuyer.get(b.id) ?? 0
    return {
      ...b,
      order_count: ordersByBuyer.get(b.id) ?? 0,
      total_purchased: purchased,
      outstanding: purchased - paid,
    }
  })

  const totalOutstanding = result.reduce((s, b) => s + b.outstanding, 0)

  return { buyers: result, totalOutstanding }
}

export async function getBuyerDetail(id: string): Promise<{
  buyer: Buyer
  orders: BuyerOrderRow[]
  payments: BuyerPaymentRow[]
  stats: { total_orders: number; total_purchased: number; outstanding: number }
} | null> {
  const supabase = await createClient()

  const [buyerResult, ordersResult] = await Promise.all([
    supabase.from('buyers').select('*').eq('id', id).single(),
    supabase
      .from('orders')
      .select(
        'id, order_number, created_at, order_status, payment_status, manufacturers(id, name, city), order_items(quantity, sell_price_snapshot, commission_snapshot)'
      )
      .eq('buyer_id', id)
      .order('created_at', { ascending: false }),
  ])

  if (!buyerResult.data) return null

  const orders: BuyerOrderRow[] = (ordersResult.data ?? []).map((o) => {
    const oi = (o.order_items as { quantity: number; sell_price_snapshot: number; commission_snapshot: number }[]) ?? []
    const mfr = o.manufacturers as unknown as { name: string; city: string | null } | null
    return {
      id: o.id,
      order_number: o.order_number,
      created_at: o.created_at,
      order_status: o.order_status as OrderStatus,
      payment_status: o.payment_status as PaymentStatus,
      manufacturer_name: mfr?.name ?? '—',
      manufacturer_city: mfr?.city ?? null,
      items: oi.length,
      order_value: oi.reduce((s, i) => s + Number(i.sell_price_snapshot) * Number(i.quantity), 0),
      commission: oi.reduce((s, i) => s + Number(i.commission_snapshot) * Number(i.quantity), 0),
    }
  })

  const orderIds = orders.map((o) => o.id)

  let payments: BuyerPaymentRow[] = []
  if (orderIds.length > 0) {
    const { data: paymentsData } = await supabase
      .from('payments')
      .select('id, order_id, amount, mode, notes, paid_at, orders!inner(order_number)')
      .in('order_id', orderIds)
      .order('paid_at', { ascending: false })

    payments = (paymentsData ?? []).map((p) => ({
      id: p.id,
      order_id: p.order_id,
      order_number: (p.orders as unknown as { order_number: string })?.order_number ?? '—',
      amount: Number(p.amount),
      mode: p.mode as PaymentMode,
      notes: p.notes,
      paid_at: p.paid_at,
    }))
  }

  const totalPurchased = orders.reduce((s, o) => s + o.order_value, 0)
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0)

  return {
    buyer: buyerResult.data as Buyer,
    orders,
    payments,
    stats: {
      total_orders: orders.length,
      total_purchased: totalPurchased,
      outstanding: totalPurchased - totalPaid,
    },
  }
}

export async function createBuyer(data: BuyerFormData): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('buyers').insert({
    name: data.name.trim(),
    phone: data.phone.trim() || null,
    address: data.address.trim() || null,
    city: data.city.trim() || null,
    gstin: data.gstin.trim() || null,
    notes: data.notes.trim() || null,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/buyers')
}

export async function updateBuyer(id: string, data: BuyerFormData): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('buyers')
    .update({
      name: data.name.trim(),
      phone: data.phone.trim() || null,
      address: data.address.trim() || null,
      city: data.city.trim() || null,
      gstin: data.gstin.trim() || null,
      notes: data.notes.trim() || null,
    })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/buyers')
  revalidatePath(`/buyers/${id}`)
}
