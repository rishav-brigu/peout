import Link from 'next/link'
import { TrendingUp, TrendingDown, Minus, Clock, ShoppingCart, Plus } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/status-badge'
import { CommissionChart } from '@/components/dashboard/commission-chart'
import { getDashboardData } from './actions'
import { formatINR, formatDate, daysOverdue } from '@/lib/format'
import { cn } from '@/lib/utils'

function percentChange(current: number, prev: number): { pct: string; up: boolean } | null {
  if (prev === 0) return null
  const raw = ((current - prev) / prev) * 100
  return { pct: `${Math.abs(raw).toFixed(0)}%`, up: raw >= 0 }
}

export default async function DashboardPage() {
  const { metrics, monthlyCommission, pendingList, recentOrders } = await getDashboardData()

  const now = new Date()
  const monthName = now.toLocaleDateString('en-IN', { month: 'long' })

  const commissionDelta = percentChange(metrics.commissionThisMonth, metrics.commissionLastMonth)
  const ordersDelta = percentChange(metrics.ordersThisMonth, metrics.ordersLastMonth)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-[#1C1917]">Dashboard</h1>
          <p className="text-sm text-[#78716C] mt-0.5">
            {now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <Link
          href="/orders/new"
          className={cn(
            buttonVariants({ size: 'sm' }),
            'bg-[#92400E] hover:bg-[#78350F] text-white gap-1.5 shrink-0'
          )}
        >
          <Plus size={14} />
          New order
        </Link>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Commission this month */}
        <div className="bg-white border border-[#E7E3DC] rounded-xl p-4">
          <p className="text-[10px] uppercase tracking-widest text-[#78716C] mb-2">
            Commission · {monthName}
          </p>
          <p className="text-2xl font-bold text-[#92400E]">
            {formatINR(metrics.commissionThisMonth)}
          </p>
          {commissionDelta ? (
            <div
              className={`flex items-center gap-1 mt-1 text-xs ${
                commissionDelta.up ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {commissionDelta.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              <span>
                {commissionDelta.up ? '+' : '-'}
                {commissionDelta.pct} vs last month
              </span>
            </div>
          ) : (
            <p className="text-xs text-[#78716C] mt-1 flex items-center gap-1">
              <Minus size={11} />
              No data last month
            </p>
          )}
        </div>

        {/* Orders this month */}
        <div className="bg-white border border-[#E7E3DC] rounded-xl p-4">
          <p className="text-[10px] uppercase tracking-widest text-[#78716C] mb-2">
            Orders · {monthName}
          </p>
          <p className="text-2xl font-bold text-[#1C1917]">{metrics.ordersThisMonth}</p>
          {ordersDelta ? (
            <div
              className={`flex items-center gap-1 mt-1 text-xs ${
                ordersDelta.up ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {ordersDelta.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              <span>
                {ordersDelta.up ? '+' : '-'}
                {ordersDelta.pct} vs last month
              </span>
            </div>
          ) : (
            <p className="text-xs text-[#78716C] mt-1 flex items-center gap-1">
              <Minus size={11} />
              No data last month
            </p>
          )}
        </div>

        {/* Pending payments */}
        <div className="bg-white border border-[#E7E3DC] rounded-xl p-4">
          <p className="text-[10px] uppercase tracking-widest text-[#78716C] mb-2">
            Pending payments
          </p>
          <p
            className={`text-2xl font-bold ${
              metrics.pendingPaymentsTotal > 0 ? 'text-red-600' : 'text-[#1C1917]'
            }`}
          >
            {formatINR(metrics.pendingPaymentsTotal)}
          </p>
          <p className="text-xs text-[#78716C] mt-1">across all orders</p>
        </div>

        {/* Pending delivery */}
        <div className="bg-white border border-[#E7E3DC] rounded-xl p-4">
          <p className="text-[10px] uppercase tracking-widest text-[#78716C] mb-2">
            Pending delivery
          </p>
          <p className="text-2xl font-bold text-[#1C1917]">{metrics.pendingDeliveryCount}</p>
          <p className="text-xs text-[#78716C] mt-1">
            {metrics.pendingDeliveryCount === 1 ? 'order' : 'orders'} confirmed, not delivered
          </p>
        </div>
      </div>

      {/* Chart + Pending payments list */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">
        {/* Bar chart */}
        <div className="bg-white border border-[#E7E3DC] rounded-xl p-5">
          <p className="text-sm font-semibold text-[#1C1917] mb-4">
            Commission — last 12 months
          </p>
          <CommissionChart data={monthlyCommission} />
        </div>

        {/* Pending payments list */}
        <div className="bg-white border border-[#E7E3DC] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E7E3DC]">
            <p className="text-sm font-semibold text-[#1C1917]">Pending payments</p>
            <p className="text-xs text-[#78716C]">Oldest first</p>
          </div>

          {pendingList.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-green-600 font-medium">All payments received</p>
              <p className="text-xs text-[#78716C] mt-1">No outstanding balances.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#E7E3DC]">
              {pendingList.map((row) => {
                const days = daysOverdue(row.created_at)
                const isUrgent = days >= 30
                return (
                  <div key={row.id} className="px-4 py-3 flex items-center gap-3">
                    <span
                      className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isUrgent
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {days}d
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1C1917] truncate">
                        {row.buyer_name}
                      </p>
                      <p className="text-xs text-[#78716C]">
                        {row.order_number}
                        {row.buyer_city && ` · ${row.buyer_city}`}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold text-red-600">
                        {formatINR(row.outstanding)}
                      </p>
                      <Link
                        href={`/orders/${row.id}`}
                        className="text-xs text-[#92400E] hover:underline"
                      >
                        Record →
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent orders */}
      <div className="bg-white border border-[#E7E3DC] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#E7E3DC] flex items-center justify-between">
          <p className="text-sm font-semibold text-[#1C1917]">Recent orders</p>
          <Link href="/orders" className="text-xs text-[#92400E] hover:underline">
            View all →
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <ShoppingCart size={28} className="mx-auto text-[#E7E3DC] mb-3" />
            <p className="text-sm text-[#78716C]">No orders yet.</p>
            <Link
              href="/orders/new"
              className={cn(
                buttonVariants({ size: 'sm' }),
                'bg-[#92400E] hover:bg-[#78350F] text-white mt-3'
              )}
            >
              Create first order
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E7E3DC] bg-[#FAF7F2]">
                <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wide text-[#78716C] font-medium">
                  Order ID
                </th>
                <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wide text-[#78716C] font-medium">
                  Manufacturer
                </th>
                <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wide text-[#78716C] font-medium">
                  Buyer
                </th>
                <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wide text-[#78716C] font-medium">
                  Date
                </th>
                <th className="text-right px-4 py-2.5 text-[10px] uppercase tracking-wide text-[#78716C] font-medium">
                  Value
                </th>
                <th className="text-right px-4 py-2.5 text-[10px] uppercase tracking-wide text-[#78716C] font-medium text-[#92400E]">
                  Commission
                </th>
                <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wide text-[#78716C] font-medium">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E3DC]">
              {recentOrders.map((o) => (
                <tr key={o.id} className="hover:bg-[#FAF7F2] transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/orders/${o.id}`}
                      className="font-medium text-[#92400E] hover:underline"
                    >
                      {o.order_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[#1C1917]">{o.manufacturer_name}</td>
                  <td className="px-4 py-3 text-[#1C1917]">{o.buyer_name}</td>
                  <td className="px-4 py-3 text-[#78716C]">{formatDate(o.created_at)}</td>
                  <td className="px-4 py-3 text-right text-[#1C1917]">
                    {formatINR(o.order_value)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-[#92400E]">
                    {formatINR(o.commission)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={o.order_status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
