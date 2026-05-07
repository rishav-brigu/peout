'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useForm, useFieldArray, useWatch, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Trash2, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { formatINR } from '@/lib/format'
import {
  createOrder,
  getProductsForManufacturer,
  type ProductForOrder,
} from '@/app/(app)/orders/actions'

const itemSchema = z.object({
  product_id: z.string().min(1, 'Select a product'),
  quantity: z.coerce.number().min(0.01, 'Must be > 0'),
  mfr_price_snapshot: z.coerce.number(),
  sell_price_snapshot: z.coerce.number(),
  commission_snapshot: z.coerce.number(),
})

const schema = z.object({
  manufacturer_id: z.string().min(1, 'Select a manufacturer'),
  buyer_id: z.string().min(1, 'Select a buyer'),
  items: z.array(itemSchema).min(1, 'Add at least one item'),
  payment_terms: z.enum(['single', 'installments']),
  installments: z.coerce.number().nullable(),
  notes: z.string(),
})

type FormData = z.infer<typeof schema>

interface CreateOrderFormProps {
  manufacturers: { id: string; name: string; city: string | null }[]
  buyers: { id: string; name: string; city: string | null; gstin: string | null }[]
  defaultManufacturerId?: string
}

export function CreateOrderForm({
  manufacturers,
  buyers,
  defaultManufacturerId,
}: CreateOrderFormProps) {
  const router = useRouter()
  const [products, setProducts] = useState<ProductForOrder[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const submitAsDraftRef = useRef(false)

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: {
      manufacturer_id: defaultManufacturerId ?? '',
      buyer_id: '',
      items: [],
      payment_terms: 'single',
      installments: null,
      notes: '',
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  const watchedItems = useWatch({ control, name: 'items' }) ?? []
  const watchedPaymentTerms = useWatch({ control, name: 'payment_terms' })
  const watchedManufacturerId = watch('manufacturer_id')

  const summary = useMemo(() => {
    const totalMfr = watchedItems.reduce(
      (s, i) => s + (Number(i?.mfr_price_snapshot) || 0) * (Number(i?.quantity) || 0),
      0
    )
    const totalSell = watchedItems.reduce(
      (s, i) => s + (Number(i?.sell_price_snapshot) || 0) * (Number(i?.quantity) || 0),
      0
    )
    const totalCommission = watchedItems.reduce(
      (s, i) => s + (Number(i?.commission_snapshot) || 0) * (Number(i?.quantity) || 0),
      0
    )
    return { totalMfr, totalSell, totalCommission }
  }, [watchedItems])

  async function handleManufacturerChange(manufacturerId: string) {
    setValue('manufacturer_id', manufacturerId)
    setValue('items', [])
    setProducts([])

    if (!manufacturerId) return

    setLoadingProducts(true)
    try {
      const prods = await getProductsForManufacturer(manufacturerId)
      setProducts(prods)
    } catch {
      toast.error('Failed to load products')
    } finally {
      setLoadingProducts(false)
    }
  }

  useEffect(() => {
    if (defaultManufacturerId) {
      setLoadingProducts(true)
      getProductsForManufacturer(defaultManufacturerId)
        .then(setProducts)
        .catch(() => toast.error('Failed to load products'))
        .finally(() => setLoadingProducts(false))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleProductSelect(index: number, productId: string) {
    const product = products.find((p) => p.id === productId)
    if (!product) return
    setValue(`items.${index}.product_id`, productId)
    setValue(`items.${index}.mfr_price_snapshot`, product.mfr_price)
    setValue(`items.${index}.sell_price_snapshot`, product.sell_price)
    setValue(`items.${index}.commission_snapshot`, product.commission)
  }

  function addItem() {
    append({
      product_id: '',
      quantity: 1,
      mfr_price_snapshot: 0,
      sell_price_snapshot: 0,
      commission_snapshot: 0,
    })
  }

  async function onSubmit(data: FormData) {
    const isDraft = submitAsDraftRef.current
    submitAsDraftRef.current = false
    try {
      const result = await createOrder({ ...data, isDraft })
      toast.success(isDraft ? 'Draft saved' : `Order ${result.order_number} created`)
      router.push(`/orders/${result.id}`)
    } catch (e: unknown) {
      toast.error('Failed', { description: e instanceof Error ? e.message : 'Unknown error' })
    }
  }

  const selectedManufacturer = manufacturers.find((m) => m.id === watchedManufacturerId)
  const selectedBuyerId = watch('buyer_id')
  const selectedBuyer = buyers.find((b) => b.id === selectedBuyerId)

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="lg:grid lg:grid-cols-[1fr_300px] gap-6 items-start">
        {/* Main form */}
        <div className="space-y-6">
          {/* Section 1 — Manufacturer + Buyer */}
          <div className="bg-white border border-[#E7E3DC] rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-[#1C1917]">Parties</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-[#1C1917]">
                  Manufacturer <span className="text-red-500">*</span>
                </Label>
                <select
                  value={watchedManufacturerId}
                  onChange={(e) => handleManufacturerChange(e.target.value)}
                  className="w-full h-9 rounded-lg border border-[#E7E3DC] bg-white px-3 text-sm text-[#1C1917] focus:outline-none focus:ring-1 focus:ring-[#92400E]"
                >
                  <option value="">Select manufacturer…</option>
                  {manufacturers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                {selectedManufacturer?.city && (
                  <p className="text-xs text-[#78716C]">{selectedManufacturer.city}</p>
                )}
                {errors.manufacturer_id && (
                  <p className="text-xs text-red-600">{errors.manufacturer_id.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-[#1C1917]">
                  Buyer <span className="text-red-500">*</span>
                </Label>
                <select
                  {...register('buyer_id')}
                  className="w-full h-9 rounded-lg border border-[#E7E3DC] bg-white px-3 text-sm text-[#1C1917] focus:outline-none focus:ring-1 focus:ring-[#92400E]"
                >
                  <option value="">Select buyer…</option>
                  {buyers.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                {selectedBuyer && (
                  <p className="text-xs text-[#78716C]">
                    {[selectedBuyer.city, selectedBuyer.gstin && `GST: ${selectedBuyer.gstin}`]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                )}
                {errors.buyer_id && (
                  <p className="text-xs text-red-600">{errors.buyer_id.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 2 — Items */}
          <div className="bg-white border border-[#E7E3DC] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#1C1917]">Order items</h2>
              {errors.items?.root && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.items.root.message ?? errors.items.message}
                </p>
              )}
            </div>

            {!watchedManufacturerId ? (
              <p className="text-sm text-[#78716C] py-4 text-center">
                Select a manufacturer first to add items.
              </p>
            ) : loadingProducts ? (
              <p className="text-sm text-[#78716C] py-4 text-center">Loading products…</p>
            ) : products.length === 0 ? (
              <p className="text-sm text-[#78716C] py-4 text-center">
                No active products for this manufacturer.
              </p>
            ) : (
              <>
                {fields.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#E7E3DC]">
                          <th className="text-left py-2 text-[10px] uppercase tracking-wide text-[#78716C] font-medium pr-3">
                            Product
                          </th>
                          <th className="text-left py-2 text-[10px] uppercase tracking-wide text-[#78716C] font-medium pr-3 w-24">
                            Qty
                          </th>
                          <th className="text-left py-2 text-[10px] uppercase tracking-wide text-[#78716C] font-medium pr-3 w-16">
                            Unit
                          </th>
                          <th className="text-right py-2 text-[10px] uppercase tracking-wide text-[#78716C] font-medium pr-3 w-24">
                            Mfr ₹
                          </th>
                          <th className="text-right py-2 text-[10px] uppercase tracking-wide text-[#78716C] font-medium pr-3 w-24">
                            Sell ₹
                          </th>
                          <th className="text-right py-2 text-[10px] uppercase tracking-wide text-[#78716C] font-medium pr-3 w-28 text-[#92400E]">
                            Line comm
                          </th>
                          <th className="w-8" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E7E3DC]">
                        {fields.map((field, index) => {
                          const item = watchedItems[index]
                          const qty = Number(item?.quantity) || 0
                          const comm = Number(item?.commission_snapshot) || 0
                          const lineComm = qty * comm
                          const selectedProduct = products.find(
                            (p) => p.id === item?.product_id
                          )

                          return (
                            <tr key={field.id}>
                              <td className="py-2 pr-3">
                                <select
                                  value={item?.product_id ?? ''}
                                  onChange={(e) => handleProductSelect(index, e.target.value)}
                                  className="w-full h-8 rounded-lg border border-[#E7E3DC] bg-white px-2 text-sm text-[#1C1917] focus:outline-none focus:ring-1 focus:ring-[#92400E]"
                                >
                                  <option value="">Select…</option>
                                  {products.map((p) => (
                                    <option key={p.id} value={p.id}>
                                      {p.name}
                                    </option>
                                  ))}
                                </select>
                                {errors.items?.[index]?.product_id && (
                                  <p className="text-xs text-red-600 mt-0.5">
                                    {errors.items[index].product_id.message}
                                  </p>
                                )}
                              </td>
                              <td className="py-2 pr-3">
                                <Input
                                  {...register(`items.${index}.quantity`)}
                                  type="number"
                                  min="0.01"
                                  step="0.01"
                                  placeholder="1"
                                  className="h-8 border-[#E7E3DC] focus-visible:ring-[#92400E] text-right"
                                />
                              </td>
                              <td className="py-2 pr-3 text-[#78716C]">
                                {selectedProduct?.unit ?? '—'}
                              </td>
                              <td className="py-2 pr-3 text-right text-[#78716C]">
                                {selectedProduct ? formatINR(selectedProduct.mfr_price) : '—'}
                              </td>
                              <td className="py-2 pr-3 text-right text-[#78716C]">
                                {selectedProduct ? formatINR(selectedProduct.sell_price) : '—'}
                              </td>
                              <td className="py-2 pr-3 text-right font-semibold text-[#92400E]">
                                {selectedProduct ? formatINR(lineComm) : '—'}
                              </td>
                              <td className="py-2">
                                <button
                                  type="button"
                                  onClick={() => remove(index)}
                                  className="p-1 rounded text-[#78716C] hover:text-red-600 hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addItem}
                  className="border-[#E7E3DC] text-[#78716C] gap-1.5"
                >
                  <Plus size={13} />
                  Add item
                </Button>
              </>
            )}
          </div>

          {/* Section 3 — Payment terms */}
          <div className="bg-white border border-[#E7E3DC] rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-[#1C1917]">Payment terms</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                  watchedPaymentTerms === 'single'
                    ? 'border-[#92400E] bg-[#FEF9F0]'
                    : 'border-[#E7E3DC] hover:bg-[#FAF7F2]'
                }`}
              >
                <input
                  type="radio"
                  {...register('payment_terms')}
                  value="single"
                  className="mt-0.5 accent-[#92400E]"
                />
                <div>
                  <p className="text-sm font-medium text-[#1C1917]">Single payment</p>
                  <p className="text-xs text-[#78716C] mt-0.5">Full amount on delivery</p>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                  watchedPaymentTerms === 'installments'
                    ? 'border-[#92400E] bg-[#FEF9F0]'
                    : 'border-[#E7E3DC] hover:bg-[#FAF7F2]'
                }`}
              >
                <input
                  type="radio"
                  {...register('payment_terms')}
                  value="installments"
                  className="mt-0.5 accent-[#92400E]"
                />
                <div>
                  <p className="text-sm font-medium text-[#1C1917]">Installments</p>
                  <p className="text-xs text-[#78716C] mt-0.5">Split across multiple payments</p>
                </div>
              </label>
            </div>

            {watchedPaymentTerms === 'installments' && (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-[#1C1917]">
                  Number of installments
                </Label>
                <Input
                  {...register('installments')}
                  type="number"
                  min="2"
                  placeholder="e.g. 3"
                  className="w-32 border-[#E7E3DC] focus-visible:ring-[#92400E]"
                />
              </div>
            )}
          </div>

          {/* Section 4 — Notes */}
          <div className="bg-white border border-[#E7E3DC] rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-[#1C1917]">Notes</h2>
            <Textarea
              {...register('notes')}
              placeholder="Optional notes about this order…"
              className="border-[#E7E3DC] focus-visible:ring-[#92400E] resize-none"
              rows={3}
            />
          </div>
        </div>

        {/* Sticky summary sidebar */}
        <div className="lg:sticky lg:top-6">
          <div className="bg-white border border-[#E7E3DC] rounded-xl p-5 space-y-4 mt-6 lg:mt-0">
            <h2 className="text-sm font-semibold text-[#1C1917]">Order summary</h2>

            <div className="space-y-2.5">
              <div className="flex justify-between text-sm">
                <span className="text-[#78716C]">Mfr value</span>
                <span className="text-[#1C1917]">{formatINR(summary.totalMfr)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#78716C]">Buyer value</span>
                <span className="text-[#1C1917]">{formatINR(summary.totalSell)}</span>
              </div>
              <div className="h-px bg-[#E7E3DC]" />
              <div className="flex justify-between">
                <span className="text-sm font-semibold text-[#1C1917]">Your commission</span>
                <span className="text-lg font-bold text-[#92400E]">
                  {formatINR(summary.totalCommission)}
                </span>
              </div>
              {summary.totalSell > 0 && (
                <p className="text-xs text-[#78716C]">
                  {((summary.totalCommission / summary.totalSell) * 100).toFixed(1)}% of buyer
                  value
                </p>
              )}
            </div>

            <p className="text-[10px] text-[#78716C] leading-relaxed">
              Prices are current as of today. Any change recorded later applies to future orders
              only.
            </p>

            <div className="space-y-2 pt-1">
              <Button
                type="submit"
                disabled={isSubmitting}
                onClick={() => {
                  submitAsDraftRef.current = false
                }}
                className="w-full bg-[#92400E] hover:bg-[#78350F] text-white"
              >
                {isSubmitting && !submitAsDraftRef.current ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Creating…
                  </>
                ) : (
                  'Create order →'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => {
                  submitAsDraftRef.current = true
                  handleSubmit(onSubmit)()
                }}
                className="w-full border-[#E7E3DC] text-[#78716C]"
              >
                {isSubmitting && submitAsDraftRef.current ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Saving…
                  </>
                ) : (
                  'Save draft'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
