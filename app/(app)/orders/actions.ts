'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { OrderStatus, PaymentStatus, PaymentMode, PaymentTermsType } from '@/types'

export type OrderListRow = {
  id: string
  order_number: string
  created_at: string
  order_status: OrderStatus
  payment_status: PaymentStatus
  manufacturer_name: string
  manufacturer_city: string | null
  buyer_name: string
  buyer_city: string | null
  items: number
  order_value: number
  commission: number
}

export type OrderDetailItem = {
  id: string
  product_id: string
  product_name: string
  unit: string
  quantity: number
  mfr_price_snapshot: number
  sell_price_snapshot: number
  commission_snapshot: number
}

export type OrderPayment = {
  id: string
  amount: number
  mode: PaymentMode
  notes: string | null
  paid_at: string
}

export type OrderDetailData = {
  id: string
  order_number: string
  created_at: string
  updated_at: string
  order_status: OrderStatus
  payment_status: PaymentStatus
  payment_terms: PaymentTermsType
  installments: number | null
  notes: string | null
  manufacturer_id: string
  buyer_id: string
  manufacturer_name: string
  manufacturer_city: string | null
  manufacturer_phone: string | null
  buyer_name: string
  buyer_city: string | null
  buyer_gstin: string | null
  order_items: OrderDetailItem[]
  payments: OrderPayment[]
  total_mfr_value: number
  total_sell_value: number
  total_commission: number
  total_paid: number
}

export type ProductForOrder = {
  id: string
  name: string
  unit: string
  mfr_price: number
  sell_price: number
  commission: number
}

export async function getOrders(): Promise<{
  orders: OrderListRow[]
  totalCount: number
  totalCommission: number
}> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('orders')
    .select(`
      id, order_number, created_at, order_status, payment_status,
      manufacturers(name, city),
      buyers(name, city),
      order_items(quantity, sell_price_snapshot, commission_snapshot)
    `)
    .order('created_at', { ascending: false })

  if (error || !data) return { orders: [], totalCount: 0, totalCommission: 0 }

  const orders: OrderListRow[] = (data as any[]).map((o) => {
    const mfr = o.manufacturers
    const buyer = o.buyers
    const items: any[] = o.order_items ?? []

    const order_value = items.reduce((s, i) => s + i.sell_price_snapshot * i.quantity, 0)
    const commission = items.reduce((s, i) => s + i.commission_snapshot * i.quantity, 0)

    return {
      id: o.id,
      order_number: o.order_number,
      created_at: o.created_at,
      order_status: o.order_status,
      payment_status: o.payment_status,
      manufacturer_name: mfr?.name ?? '',
      manufacturer_city: mfr?.city ?? null,
      buyer_name: buyer?.name ?? '',
      buyer_city: buyer?.city ?? null,
      items: items.length,
      order_value,
      commission,
    }
  })

  const totalCommission = orders.reduce((s, o) => s + o.commission, 0)
  return { orders, totalCount: orders.length, totalCommission }
}

export async function getOrderDetail(id: string): Promise<OrderDetailData | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      manufacturers(name, city, phone),
      buyers(name, city, gstin),
      order_items(
        id, product_id, quantity,
        mfr_price_snapshot, sell_price_snapshot, commission_snapshot,
        products(name, unit)
      ),
      payments(id, amount, mode, notes, paid_at)
    `)
    .eq('id', id)
    .single()

  if (error || !data) return null

  const d = data as any
  const mfr = d.manufacturers
  const buyer = d.buyers
  const rawItems: any[] = d.order_items ?? []
  const pmts: any[] = d.payments ?? []

  const orderItems: OrderDetailItem[] = rawItems.map((i) => ({
    id: i.id,
    product_id: i.product_id,
    product_name: i.products?.name ?? '',
    unit: i.products?.unit ?? '',
    quantity: i.quantity,
    mfr_price_snapshot: i.mfr_price_snapshot,
    sell_price_snapshot: i.sell_price_snapshot,
    commission_snapshot: i.commission_snapshot,
  }))

  const payments: OrderPayment[] = pmts.map((p) => ({
    id: p.id,
    amount: p.amount,
    mode: p.mode as PaymentMode,
    notes: p.notes ?? null,
    paid_at: p.paid_at,
  }))

  const total_mfr_value = orderItems.reduce((s, i) => s + i.mfr_price_snapshot * i.quantity, 0)
  const total_sell_value = orderItems.reduce((s, i) => s + i.sell_price_snapshot * i.quantity, 0)
  const total_commission = orderItems.reduce((s, i) => s + i.commission_snapshot * i.quantity, 0)
  const total_paid = payments.reduce((s, p) => s + p.amount, 0)

  return {
    id: d.id,
    order_number: d.order_number,
    created_at: d.created_at,
    updated_at: d.updated_at,
    order_status: d.order_status,
    payment_status: d.payment_status,
    payment_terms: d.payment_terms,
    installments: d.installments ?? null,
    notes: d.notes ?? null,
    manufacturer_id: d.manufacturer_id,
    buyer_id: d.buyer_id,
    manufacturer_name: mfr?.name ?? '',
    manufacturer_city: mfr?.city ?? null,
    manufacturer_phone: mfr?.phone ?? null,
    buyer_name: buyer?.name ?? '',
    buyer_city: buyer?.city ?? null,
    buyer_gstin: buyer?.gstin ?? null,
    order_items: orderItems,
    payments,
    total_mfr_value,
    total_sell_value,
    total_commission,
    total_paid,
  }
}

export async function getActiveManufacturers(): Promise<
  { id: string; name: string; city: string | null }[]
> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('manufacturers')
    .select('id, name, city')
    .eq('is_active', true)
    .order('name')
  return (data ?? []) as { id: string; name: string; city: string | null }[]
}

export async function getActiveBuyers(): Promise<
  { id: string; name: string; city: string | null; gstin: string | null }[]
> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('buyers')
    .select('id, name, city, gstin')
    .eq('is_active', true)
    .order('name')
  return (data ?? []) as { id: string; name: string; city: string | null; gstin: string | null }[]
}

export async function getProductsForManufacturer(
  manufacturerId: string
): Promise<ProductForOrder[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('id, name, unit, mfr_price, sell_price, commission')
    .eq('manufacturer_id', manufacturerId)
    .eq('is_active', true)
    .order('name')
  return (data ?? []) as ProductForOrder[]
}

async function getNextOrderNumber(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<string> {
  // RLS scopes this to the current user's orders automatically
  const { data } = await supabase
    .from('orders')
    .select('order_number')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!data?.order_number) return 'PO-0001'
  const match = data.order_number.match(/PO-(\d+)/)
  if (!match) return 'PO-0001'
  return `PO-${String(parseInt(match[1], 10) + 1).padStart(4, '0')}`
}

export async function createOrder(formData: {
  manufacturer_id: string
  buyer_id: string
  items: {
    product_id: string
    quantity: number
    mfr_price_snapshot: number
    sell_price_snapshot: number
    commission_snapshot: number
  }[]
  payment_terms: PaymentTermsType
  installments: number | null
  notes: string
  isDraft?: boolean
}): Promise<{ id: string; order_number: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const order_number = await getNextOrderNumber(supabase)

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: user.id,
      order_number,
      manufacturer_id: formData.manufacturer_id,
      buyer_id: formData.buyer_id,
      payment_terms: formData.payment_terms,
      installments:
        formData.payment_terms === 'installments' ? (formData.installments ?? null) : null,
      notes: formData.notes || null,
      order_status: formData.isDraft ? 'Draft' : 'Confirmed',
      payment_status: 'Unpaid',
    })
    .select('id, order_number')
    .single()

  if (orderError || !order) throw new Error(orderError?.message ?? 'Failed to create order')

  const { error: itemsError } = await supabase.from('order_items').insert(
    formData.items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      mfr_price_snapshot: item.mfr_price_snapshot,
      sell_price_snapshot: item.sell_price_snapshot,
      commission_snapshot: item.commission_snapshot,
    }))
  )

  if (itemsError) {
    await supabase.from('orders').delete().eq('id', order.id)
    throw new Error(itemsError.message)
  }

  revalidatePath('/orders')
  revalidatePath(`/manufacturers/${formData.manufacturer_id}`)
  revalidatePath(`/buyers/${formData.buyer_id}`)

  return { id: order.id, order_number: order.order_number }
}

export async function recordPayment(
  orderId: string,
  data: { amount: number; mode: PaymentMode; notes: string; paid_at: string }
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase.from('payments').insert({
    order_id: orderId,
    amount: data.amount,
    mode: data.mode,
    notes: data.notes || null,
    paid_at: data.paid_at,
  })
  if (error) throw new Error(error.message)

  const [{ data: payments }, { data: items }] = await Promise.all([
    supabase.from('payments').select('amount').eq('order_id', orderId),
    supabase.from('order_items').select('quantity, sell_price_snapshot').eq('order_id', orderId),
  ])

  const totalPaid = (payments ?? []).reduce((s, p) => s + p.amount, 0)
  const totalSell = (items ?? []).reduce(
    (s, i) => s + i.quantity * i.sell_price_snapshot,
    0
  )

  const paymentStatus: PaymentStatus =
    totalPaid === 0 ? 'Unpaid' : totalPaid >= totalSell ? 'Paid' : 'Partial'

  await supabase
    .from('orders')
    .update({ payment_status: paymentStatus, updated_at: new Date().toISOString() })
    .eq('id', orderId)

  revalidatePath(`/orders/${orderId}`)
  revalidatePath('/orders')
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('orders')
    .update({ order_status: status, updated_at: new Date().toISOString() })
    .eq('id', orderId)

  if (error) throw new Error(error.message)

  revalidatePath(`/orders/${orderId}`)
  revalidatePath('/orders')
}
