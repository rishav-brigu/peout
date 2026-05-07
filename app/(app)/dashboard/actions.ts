'use server'

import { createClient } from '@/lib/supabase/server'
import type { OrderStatus, PaymentStatus } from '@/types'

export type DashboardMetrics = {
  commissionThisMonth: number
  commissionLastMonth: number
  ordersThisMonth: number
  ordersLastMonth: number
  pendingPaymentsTotal: number
  pendingDeliveryCount: number
}

export type MonthlyCommission = {
  month: string
  commission: number
}

export type PendingPaymentRow = {
  id: string
  order_number: string
  buyer_name: string
  buyer_city: string | null
  outstanding: number
  created_at: string
}

export type RecentOrderRow = {
  id: string
  order_number: string
  manufacturer_name: string
  buyer_name: string
  created_at: string
  order_value: number
  commission: number
  order_status: OrderStatus
  payment_status: PaymentStatus
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export async function getDashboardData(): Promise<{
  metrics: DashboardMetrics
  monthlyCommission: MonthlyCommission[]
  pendingList: PendingPaymentRow[]
  recentOrders: RecentOrderRow[]
}> {
  const supabase = await createClient()
  const now = new Date()

  const [allOrdersResult, recentResult] = await Promise.all([
    supabase
      .from('orders')
      .select(`
        id, order_number, order_status, payment_status, created_at,
        manufacturers(name, city),
        buyers(name, city),
        order_items(quantity, sell_price_snapshot, commission_snapshot),
        payments(amount)
      `)
      .neq('order_status', 'Cancelled')
      .order('created_at', { ascending: false }),
    supabase
      .from('orders')
      .select(`
        id, order_number, order_status, payment_status, created_at,
        manufacturers(name, city),
        buyers(name, city),
        order_items(quantity, sell_price_snapshot, commission_snapshot)
      `)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const all = (allOrdersResult.data ?? []) as any[]
  const recent = (recentResult.data ?? []) as any[]

  function orderTotals(o: any) {
    const items: any[] = o.order_items ?? []
    const pmts: any[] = o.payments ?? []
    const sellValue = items.reduce((s, i) => s + i.sell_price_snapshot * i.quantity, 0)
    const commission = items.reduce((s, i) => s + i.commission_snapshot * i.quantity, 0)
    const paid = pmts.reduce((s, p) => s + p.amount, 0)
    return { sellValue, commission, paid }
  }

  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)

  let commissionThisMonth = 0
  let commissionLastMonth = 0
  let ordersThisMonth = 0
  let ordersLastMonth = 0
  let pendingPaymentsTotal = 0
  let pendingDeliveryCount = 0

  for (const o of all) {
    const createdAt = new Date(o.created_at)
    const { sellValue, commission, paid } = orderTotals(o)

    if (createdAt >= thisMonthStart) {
      commissionThisMonth += commission
      ordersThisMonth += 1
    } else if (createdAt >= lastMonthStart && createdAt <= lastMonthEnd) {
      commissionLastMonth += commission
      ordersLastMonth += 1
    }

    const outstanding = sellValue - paid
    if (outstanding > 0) pendingPaymentsTotal += outstanding

    if (o.order_status === 'Confirmed') pendingDeliveryCount += 1
  }

  // Monthly commission — last 12 months
  const monthlyCommission: MonthlyCommission[] = []
  for (let i = 11; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999)
    const label = `${MONTHS[monthStart.getMonth()]} '${String(monthStart.getFullYear()).slice(2)}`

    const commission = all
      .filter((o) => {
        const d = new Date(o.created_at)
        return d >= monthStart && d <= monthEnd
      })
      .reduce((s, o) => s + orderTotals(o).commission, 0)

    monthlyCommission.push({ month: label, commission })
  }

  // Pending payments list — top 5 oldest with outstanding balance
  const pendingList: PendingPaymentRow[] = all
    .filter((o) => {
      const { sellValue, paid } = orderTotals(o)
      return sellValue - paid > 0
    })
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .slice(0, 5)
    .map((o) => {
      const { sellValue, paid } = orderTotals(o)
      const buyer = o.buyers
      return {
        id: o.id,
        order_number: o.order_number,
        buyer_name: buyer?.name ?? '',
        buyer_city: buyer?.city ?? null,
        outstanding: sellValue - paid,
        created_at: o.created_at,
      }
    })

  // Recent orders
  const recentOrders: RecentOrderRow[] = recent.map((o) => {
    const items: any[] = o.order_items ?? []
    const mfr = o.manufacturers
    const buyer = o.buyers
    const order_value = items.reduce((s, i) => s + i.sell_price_snapshot * i.quantity, 0)
    const commission = items.reduce((s, i) => s + i.commission_snapshot * i.quantity, 0)
    return {
      id: o.id,
      order_number: o.order_number,
      manufacturer_name: mfr?.name ?? '',
      buyer_name: buyer?.name ?? '',
      created_at: o.created_at,
      order_value,
      commission,
      order_status: o.order_status,
      payment_status: o.payment_status,
    }
  })

  return {
    metrics: {
      commissionThisMonth,
      commissionLastMonth,
      ordersThisMonth,
      ordersLastMonth,
      pendingPaymentsTotal,
      pendingDeliveryCount,
    },
    monthlyCommission,
    pendingList,
    recentOrders,
  }
}
