'use client'

import { useEffect, useMemo } from 'react'
import { useForm, useWatch, Controller, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { createProduct, updateProduct } from '@/app/(app)/products/actions'
import { formatINR } from '@/lib/format'
import type { Product } from '@/types'

const schema = z.object({
  manufacturer_id: z.string().min(1, 'Manufacturer is required'),
  name: z.string().min(1, 'Name is required'),
  unit: z.string().min(1, 'Unit is required'),
  mfr_price: z.coerce.number().min(0, 'Must be 0 or more'),
  sell_price: z.coerce.number().min(0, 'Must be 0 or more'),
  reason: z.string(),
  is_active: z.boolean(),
})

type FormData = z.infer<typeof schema>

interface ProductFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: Product | null
  manufacturers: { id: string; name: string }[]
  defaultManufacturerId?: string
}

export function ProductForm({
  open,
  onOpenChange,
  product,
  manufacturers,
  defaultManufacturerId,
}: ProductFormProps) {
  const isEditing = !!product

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) as Resolver<FormData> })

  const mfrPrice = useWatch({ control, name: 'mfr_price' })
  const sellPrice = useWatch({ control, name: 'sell_price' })

  const commission = useMemo(() => {
    const m = Number(mfrPrice) || 0
    const s = Number(sellPrice) || 0
    return s - m
  }, [mfrPrice, sellPrice])

  const priceChanged = useMemo(() => {
    if (!product) return false
    return (
      Number(mfrPrice) !== Number(product.mfr_price) ||
      Number(sellPrice) !== Number(product.sell_price)
    )
  }, [mfrPrice, sellPrice, product])

  useEffect(() => {
    if (open) {
      reset(
        product
          ? {
              manufacturer_id: product.manufacturer_id,
              name: product.name,
              unit: product.unit,
              mfr_price: product.mfr_price,
              sell_price: product.sell_price,
              reason: '',
              is_active: product.is_active,
            }
          : {
              manufacturer_id: defaultManufacturerId ?? '',
              name: '',
              unit: '',
              mfr_price: 0,
              sell_price: 0,
              reason: '',
              is_active: true,
            }
      )
    }
  }, [open, product, defaultManufacturerId, reset])

  async function onSubmit(data: FormData) {
    try {
      if (isEditing && product) {
        await updateProduct(product.id, data)
        toast.success('Product updated')
      } else {
        await createProduct(data)
        toast.success('Product added')
      }
      onOpenChange(false)
    } catch (e: unknown) {
      toast.error('Failed', { description: e instanceof Error ? e.message : 'Unknown error' })
    }
  }

  const manufacturerLocked = !!defaultManufacturerId

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" showCloseButton={false}>
        <SheetHeader className="border-b border-[#E7E3DC] pb-4">
          <SheetTitle className="font-display text-lg text-[#1C1917]">
            {isEditing ? 'Edit product' : 'Add product'}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {/* Manufacturer */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-[#1C1917]">
                Manufacturer <span className="text-red-500">*</span>
              </Label>
              {manufacturerLocked ? (
                <Input
                  value={manufacturers.find((m) => m.id === defaultManufacturerId)?.name ?? ''}
                  disabled
                  className="border-[#E7E3DC] bg-[#FAF7F2] text-[#78716C]"
                />
              ) : (
                <select
                  {...register('manufacturer_id')}
                  className="w-full h-9 rounded-lg border border-[#E7E3DC] bg-white px-3 text-sm text-[#1C1917] focus:outline-none focus:ring-1 focus:ring-[#92400E]"
                >
                  <option value="">Select manufacturer…</option>
                  {manufacturers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              )}
              {errors.manufacturer_id && (
                <p className="text-xs text-red-600">{errors.manufacturer_id.message}</p>
              )}
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-[#1C1917]">
                Product name <span className="text-red-500">*</span>
              </Label>
              <Input
                {...register('name')}
                placeholder="e.g. Cotton Mattress 6×4"
                className="border-[#E7E3DC] focus-visible:ring-[#92400E]"
              />
              {errors.name && (
                <p className="text-xs text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Unit */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-[#1C1917]">
                Unit <span className="text-red-500">*</span>
              </Label>
              <Input
                {...register('unit')}
                placeholder="e.g. pc, kg, set, meter"
                className="border-[#E7E3DC] focus-visible:ring-[#92400E]"
                list="unit-suggestions"
              />
              <datalist id="unit-suggestions">
                {['pc', 'kg', 'set', 'meter', 'pair', 'dozen', 'roll', 'box'].map((u) => (
                  <option key={u} value={u} />
                ))}
              </datalist>
              {errors.unit && (
                <p className="text-xs text-red-600">{errors.unit.message}</p>
              )}
            </div>

            {/* Prices */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-[#1C1917]">
                  Mfr price (₹) <span className="text-red-500">*</span>
                </Label>
                <Input
                  {...register('mfr_price')}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  className="border-[#E7E3DC] focus-visible:ring-[#92400E]"
                />
                {errors.mfr_price && (
                  <p className="text-xs text-red-600">{errors.mfr_price.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-[#1C1917]">
                  Sell price (₹) <span className="text-red-500">*</span>
                </Label>
                <Input
                  {...register('sell_price')}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  className="border-[#E7E3DC] focus-visible:ring-[#92400E]"
                />
                {errors.sell_price && (
                  <p className="text-xs text-red-600">{errors.sell_price.message}</p>
                )}
              </div>
            </div>

            {/* Commission (read-only) */}
            <div className="rounded-lg bg-[#FEF9F0] border border-[#FDE68A] px-4 py-3 flex items-center justify-between">
              <span className="text-xs text-[#78716C]">Your commission / unit</span>
              <span
                className={`text-sm font-semibold ${commission >= 0 ? 'text-[#92400E]' : 'text-red-600'}`}
              >
                {formatINR(commission)}
              </span>
            </div>

            {/* Reason — show in edit mode when prices have changed */}
            {isEditing && (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-[#1C1917]">
                  Reason for change
                  {priceChanged && <span className="text-red-500 ml-1">*</span>}
                </Label>
                <Input
                  {...register('reason')}
                  placeholder="e.g. Manufacturer increased cotton costs"
                  className="border-[#E7E3DC] focus-visible:ring-[#92400E]"
                />
                {!priceChanged && (
                  <p className="text-[10px] text-[#78716C]">
                    Logged automatically if prices change
                  </p>
                )}
              </div>
            )}

            {/* Active toggle — edit mode only */}
            {isEditing && (
              <div className="flex items-center gap-2 pt-1">
                <Controller
                  control={control}
                  name="is_active"
                  render={({ field }) => (
                    <Checkbox
                      id="is_active"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <Label htmlFor="is_active" className="text-sm text-[#1C1917] cursor-pointer">
                  Active product
                </Label>
              </div>
            )}
          </div>

          <SheetFooter className="border-t border-[#E7E3DC] flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 border-[#E7E3DC]"
              onClick={() => onOpenChange(false)}
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
              ) : isEditing ? (
                'Save changes'
              ) : (
                'Add product'
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
