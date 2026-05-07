import { getPayments } from './actions'
import { PaymentsClient } from '@/components/payments/payments-client'

export default async function PaymentsPage() {
  const { payments, totalCount, thisMonthAmount } = await getPayments()

  const now = new Date()
  const monthName = now.toLocaleDateString('en-IN', { month: 'long' })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl text-[#1C1917]">Payments</h1>
        <p className="text-sm text-[#78716C] mt-0.5">
          {totalCount} {totalCount === 1 ? 'payment' : 'payments'} recorded · ₹
          {new Intl.NumberFormat('en-IN').format(Math.round(thisMonthAmount))} this {monthName}
        </p>
      </div>

      <PaymentsClient payments={payments} />
    </div>
  )
}
