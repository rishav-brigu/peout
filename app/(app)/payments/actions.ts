'use server'

import { createClient } from '@/lib/supabase/server'
import type { PaymentMode } from '@/types'

export type PaymentRow = {
  id: string
  order_id: string
  order_number: string
  manufacturer_name: string
  buyer_id: string
  buyer_name: string
  buyer_city: string | null
  amount: number
  mode: PaymentMode
  notes: string | null
  paid_at: string
}

export async function getPayments(): Promise<{
  payments: PaymentRow[]
  totalCount: number
  totalAmount: number
  thisMonthAmount: number
}> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('payments')
    .select(`
      id, amount, mode, notes, paid_at, order_id,
      orders(
        order_number,
        manufacturers(name),
        buyers(id, name, city)
      )
    `)
    .order('paid_at', { ascending: false })

  if (error || !data) {
    return { payments: [], totalCount: 0, totalAmount: 0, thisMonthAmount: 0 }
  }

  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const payments: PaymentRow[] = (data as any[]).map((p) => {
    const order = p.orders
    const mfr = order?.manufacturers
    const buyer = order?.buyers
    return {
      id: p.id,
      order_id: p.order_id,
      order_number: order?.order_number ?? '',
      manufacturer_name: mfr?.name ?? '',
      buyer_id: buyer?.id ?? '',
      buyer_name: buyer?.name ?? '',
      buyer_city: buyer?.city ?? null,
      amount: p.amount,
      mode: p.mode as PaymentMode,
      notes: p.notes ?? null,
      paid_at: p.paid_at,
    }
  })

  const totalAmount = payments.reduce((s, p) => s + p.amount, 0)
  const thisMonthAmount = payments
    .filter((p) => new Date(p.paid_at) >= thisMonthStart)
    .reduce((s, p) => s + p.amount, 0)

  return {
    payments,
    totalCount: payments.length,
    totalAmount,
    thisMonthAmount,
  }
}
