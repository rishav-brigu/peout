'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  ArrowLeft,
  CheckCircle2,
  Truck,
  Lock,
  XCircle,
  Loader2,
  Plus,
  IndianRupee,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { StatusBadge } from '@/components/shared/status-badge'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { formatINR, formatDate } from '@/lib/format'
import { recordPayment, updateOrderStatus } from '@/app/(app)/orders/actions'
import type { OrderDetailData } from '@/app/(app)/orders/actions'
import type { PaymentMode, OrderStatus } from '@/types'

const paymentSchema = z.object({
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  mode: z.enum(['Cash', 'UPI', 'Cheque', 'Bank Transfer']),
  notes: z.string(),
  paid_at: z.string().min(1, 'Date is required'),
})
type PaymentFormData = z.infer<typeof paymentSchema>

const PAYMENT_MODES: PaymentMode[] = ['Cash', 'UPI', 'Cheque', 'Bank Transfer']

interface OrderDetailClientProps {
  order: OrderDetailData
}

export function OrderDetailClient({ order }: OrderDetailClientProps) {
  const router = useRouter()
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState<OrderStatus | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema) as Resolver<PaymentFormData>,
    defaultValues: {
      amount: 0,
      mode: 'Cash',
      notes: '',
      paid_at: new Date().toISOString().slice(0, 10),
    },
  })

  function openPaymentDialog() {
    reset({
      amount: Math.max(0, order.total_sell_value - order.total_paid),
      mode: 'Cash',
      notes: '',
      paid_at: new Date().toISOString().slice(0, 10),
    })
    setPaymentOpen(true)
  }

  async function onPaymentSubmit(data: PaymentFormData) {
    try {
      await recordPayment(order.id, {
        ...data,
        paid_at: new Date(data.paid_at).toISOString(),
      })
      toast.success('Payment recorded')
      setPaymentOpen(false)
      router.refresh()
    } catch (e: unknown) {
      toast.error('Failed', { description: e instanceof Error ? e.message : 'Unknown error' })
    }
  }

  async function handleStatusUpdate(status: OrderStatus) {
    setUpdatingStatus(status)
    try {
      await updateOrderStatus(order.id, status)
      toast.success(`Order marked as ${status}`)
      router.refresh()
    } catch (e: unknown) {
      toast.error('Failed', { description: e instanceof Error ? e.message : 'Unknown error' })
    } finally {
      setUpdatingStatus(null)
    }
  }

  async function handleCancel() {
    await handleStatusUpdate('Cancelled')
  }

  const outstanding = order.total_sell_value - order.total_paid
  const paymentPct =
    order.total_sell_value > 0
      ? Math.min(100, (order.total_paid / order.total_sell_value) * 100)
      : 0

  const canConfirm = order.order_status === 'Draft'
  const canDeliver = order.order_status === 'Confirmed'
  const canClose = order.order_status === 'Delivered'
  const canCancel = !['Closed', 'Cancelled'].includes(order.order_status)

  return (
    <>
      <div className="space-y-5">
        {/* Top bar */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                href="/orders"
                className="text-[#78716C] hover:text-[#1C1917] transition-colors"
              >
                <ArrowLeft size={16} />
              </Link>
              <h1 className="font-display text-2xl text-[#1C1917]">
                Order {order.order_number}
              </h1>
            </div>
            <p className="text-sm text-[#78716C]">
              Created {formatDate(order.created_at)}
              {order.updated_at !== order.created_at &&
                ` · Updated ${formatDate(order.updated_at)}`}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
            <Link
              href={`/orders/${order.id}/export`}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-[#E7E3DC] text-sm text-[#78716C] hover:bg-[#FAF7F2] transition-colors"
            >
              <FileText size={13} />
              Export PDF
            </Link>
            {canConfirm && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusUpdate('Confirmed')}
                disabled={updatingStatus === 'Confirmed'}
                className="border-[#E7E3DC] gap-1.5"
              >
                {updatingStatus === 'Confirmed' ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={13} />
                )}
                Confirm order
              </Button>
            )}
            {canDeliver && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusUpdate('Delivered')}
                disabled={updatingStatus === 'Delivered'}
                className="border-[#E7E3DC] gap-1.5"
              >
                {updatingStatus === 'Delivered' ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Truck size={13} />
                )}
                Mark delivered
              </Button>
            )}
            {canClose && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusUpdate('Closed')}
                disabled={updatingStatus === 'Closed'}
                className="border-[#E7E3DC] gap-1.5"
              >
                {updatingStatus === 'Closed' ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Lock size={13} />
                )}
                Close order
              </Button>
            )}
            {canCancel && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCancelOpen(true)}
                className="border-red-200 text-red-600 hover:bg-red-50 gap-1.5"
              >
                <XCircle size={13} />
                Cancel
              </Button>
            )}
          </div>
        </div>

        {/* Header card */}
        <div className="bg-white border border-[#E7E3DC] rounded-xl p-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[#78716C] mb-1">
                Manufacturer
              </p>
              <p className="text-sm font-medium text-[#1C1917]">{order.manufacturer_name}</p>
              {order.manufacturer_city && (
                <p className="text-xs text-[#78716C]">{order.manufacturer_city}</p>
              )}
              {order.manufacturer_phone && (
                <p className="text-xs text-[#78716C]">{order.manufacturer_phone}</p>
              )}
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[#78716C] mb-1">Buyer</p>
              <p className="text-sm font-medium text-[#1C1917]">{order.buyer_name}</p>
              {order.buyer_city && (
                <p className="text-xs text-[#78716C]">{order.buyer_city}</p>
              )}
              {order.buyer_gstin && (
                <p className="text-xs text-[#78716C]">GST: {order.buyer_gstin}</p>
              )}
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[#78716C] mb-1">Status</p>
              <div className="flex flex-col gap-1.5 mt-1">
                <StatusBadge status={order.order_status} />
                <StatusBadge status={order.payment_status} />
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[#78716C] mb-1">
                Your commission
              </p>
              <p className="text-2xl font-bold text-[#92400E]">
                {formatINR(order.total_commission)}
              </p>
            </div>
          </div>
        </div>

        {/* Items + Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
          {/* Items table */}
          <div className="bg-white border border-[#E7E3DC] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E7E3DC] bg-[#FAF7F2]">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#78716C]">
                Order items
              </p>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E7E3DC]">
                  <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wide text-[#78716C] font-medium">
                    Product
                  </th>
                  <th className="text-right px-4 py-2.5 text-[10px] uppercase tracking-wide text-[#78716C] font-medium w-16">
                    Qty
                  </th>
                  <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wide text-[#78716C] font-medium w-14">
                    Unit
                  </th>
                  <th className="text-right px-4 py-2.5 text-[10px] uppercase tracking-wide text-[#78716C] font-medium">
                    Mfr ₹
                  </th>
                  <th className="text-right px-4 py-2.5 text-[10px] uppercase tracking-wide text-[#78716C] font-medium">
                    Sell ₹
                  </th>
                  <th className="text-right px-4 py-2.5 text-[10px] uppercase tracking-wide text-[#78716C] font-medium text-[#92400E]">
                    Line comm
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E3DC]">
                {order.order_items.map((item) => (
                  <tr key={item.id} className="hover:bg-[#FAF7F2]">
                    <td className="px-4 py-3 font-medium text-[#1C1917]">{item.product_name}</td>
                    <td className="px-4 py-3 text-right text-[#78716C]">{item.quantity}</td>
                    <td className="px-4 py-3 text-[#78716C]">{item.unit}</td>
                    <td className="px-4 py-3 text-right text-[#78716C]">
                      {formatINR(item.mfr_price_snapshot)}
                    </td>
                    <td className="px-4 py-3 text-right text-[#1C1917]">
                      {formatINR(item.sell_price_snapshot)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-[#92400E]">
                      {formatINR(item.commission_snapshot * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-[#E7E3DC] bg-[#FAF7F2]">
                  <td className="px-4 py-2.5 text-xs font-semibold text-[#78716C]" colSpan={3}>
                    Total
                  </td>
                  <td className="px-4 py-2.5 text-right text-sm font-semibold text-[#78716C]">
                    {formatINR(order.total_mfr_value)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-sm font-semibold text-[#1C1917]">
                    {formatINR(order.total_sell_value)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-sm font-bold text-[#92400E]">
                    {formatINR(order.total_commission)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Summary card */}
          <div className="bg-white border border-[#E7E3DC] rounded-xl p-5 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#78716C]">
              Summary
            </p>

            <div className="space-y-2.5">
              <div className="flex justify-between text-sm">
                <span className="text-[#78716C]">Mfr value</span>
                <span className="text-[#1C1917]">{formatINR(order.total_mfr_value)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#78716C]">Buyer value</span>
                <span className="text-[#1C1917]">{formatINR(order.total_sell_value)}</span>
              </div>
              <div className="h-px bg-[#E7E3DC]" />
              <div className="flex justify-between">
                <span className="text-sm font-semibold text-[#1C1917]">Commission</span>
                <span className="text-base font-bold text-[#92400E]">
                  {formatINR(order.total_commission)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-[#78716C]">
                Payment terms
              </p>
              <p className="text-sm text-[#1C1917] capitalize">
                {order.payment_terms === 'installments'
                  ? `${order.installments ?? ''} installments`
                  : 'Single payment'}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs text-[#78716C]">
                <span>Received</span>
                <span>
                  {formatINR(order.total_paid)} / {formatINR(order.total_sell_value)}
                </span>
              </div>
              <div className="h-2 bg-[#E7E3DC] rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${paymentPct}%` }}
                />
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-green-600 font-medium">
                  +{formatINR(order.total_paid)} received
                </span>
                {outstanding > 0 && (
                  <span className="text-red-600 font-medium">
                    -{formatINR(outstanding)} due
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Payment history */}
        <div className="bg-white border border-[#E7E3DC] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E7E3DC] flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#78716C]">
              Payment history
            </p>
            {canCancel && (
              <Button
                size="sm"
                onClick={openPaymentDialog}
                className="bg-[#92400E] hover:bg-[#78350F] text-white gap-1.5"
              >
                <Plus size={13} />
                Record payment
              </Button>
            )}
          </div>

          {order.payments.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-[#78716C]">No payments recorded yet.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E7E3DC] bg-[#FAF7F2]">
                  <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wide text-[#78716C] font-medium">
                    Date
                  </th>
                  <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wide text-[#78716C] font-medium">
                    Mode
                  </th>
                  <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wide text-[#78716C] font-medium">
                    Notes
                  </th>
                  <th className="text-right px-4 py-2.5 text-[10px] uppercase tracking-wide text-[#78716C] font-medium">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E3DC]">
                {order.payments.map((p) => (
                  <tr key={p.id} className="hover:bg-[#FAF7F2]">
                    <td className="px-4 py-3 text-[#78716C]">{formatDate(p.paid_at)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.mode} />
                    </td>
                    <td className="px-4 py-3 text-[#78716C] italic text-xs">
                      {p.notes ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-green-600">
                      +{formatINR(p.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              {outstanding > 0 && (
                <tfoot>
                  <tr className="border-t border-[#E7E3DC]">
                    <td colSpan={3} className="px-4 py-3 text-xs text-[#78716C]">
                      Outstanding balance
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-red-600">
                      -{formatINR(outstanding)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          )}
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="bg-[#FEF9F0] border border-[#FDE68A] rounded-xl px-4 py-3">
            <p className="text-[10px] uppercase tracking-widest text-[#78716C] mb-1">Notes</p>
            <p className="text-sm text-[#78350F] italic leading-relaxed">{order.notes}</p>
          </div>
        )}
      </div>

      {/* Record payment dialog */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-lg text-[#1C1917]">
              Record payment
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onPaymentSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-[#1C1917]">
                Amount (₹) <span className="text-red-500">*</span>
              </Label>
              <Input
                {...register('amount')}
                type="number"
                min="0.01"
                step="0.01"
                className="border-[#E7E3DC] focus-visible:ring-[#92400E]"
              />
              {errors.amount && (
                <p className="text-xs text-red-600">{errors.amount.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-[#1C1917]">
                Mode <span className="text-red-500">*</span>
              </Label>
              <select
                {...register('mode')}
                className="w-full h-9 rounded-lg border border-[#E7E3DC] bg-white px-3 text-sm text-[#1C1917] focus:outline-none focus:ring-1 focus:ring-[#92400E]"
              >
                {PAYMENT_MODES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-[#1C1917]">
                Date <span className="text-red-500">*</span>
              </Label>
              <Input
                {...register('paid_at')}
                type="date"
                className="border-[#E7E3DC] focus-visible:ring-[#92400E]"
              />
              {errors.paid_at && (
                <p className="text-xs text-red-600">{errors.paid_at.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-[#1C1917]">Notes</Label>
              <Input
                {...register('notes')}
                placeholder="Optional reference or note"
                className="border-[#E7E3DC] focus-visible:ring-[#92400E]"
              />
            </div>

            <DialogFooter className="gap-2 flex-row">
              <Button
                type="button"
                variant="outline"
                className="flex-1 border-[#E7E3DC]"
                onClick={() => setPaymentOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-[#92400E] hover:bg-[#78350F] text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Saving…
                  </>
                ) : (
                  'Record payment'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel this order?"
        description="This will mark the order as Cancelled. This action cannot be undone."
        confirmLabel="Cancel order"
        destructive
        onConfirm={handleCancel}
      />
    </>
  )
}
