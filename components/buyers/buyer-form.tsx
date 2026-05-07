'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
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
import { Textarea } from '@/components/ui/textarea'
import { createBuyer, updateBuyer } from '@/app/(app)/buyers/actions'
import type { Buyer } from '@/types'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string(),
  city: z.string(),
  address: z.string(),
  gstin: z.string(),
  notes: z.string(),
})

type FormData = z.infer<typeof schema>

interface BuyerFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  buyer?: Buyer | null
}

export function BuyerForm({ open, onOpenChange, buyer }: BuyerFormProps) {
  const isEditing = !!buyer

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (open) {
      reset(
        buyer
          ? {
              name: buyer.name,
              phone: buyer.phone ?? '',
              city: buyer.city ?? '',
              address: buyer.address ?? '',
              gstin: buyer.gstin ?? '',
              notes: buyer.notes ?? '',
            }
          : { name: '', phone: '', city: '', address: '', gstin: '', notes: '' }
      )
    }
  }, [open, buyer, reset])

  async function onSubmit(data: FormData) {
    try {
      if (isEditing && buyer) {
        await updateBuyer(buyer.id, data)
        toast.success('Buyer updated')
      } else {
        await createBuyer(data)
        toast.success('Buyer added')
      }
      onOpenChange(false)
    } catch (e: unknown) {
      toast.error('Failed', { description: e instanceof Error ? e.message : 'Unknown error' })
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" showCloseButton={false}>
        <SheetHeader className="border-b border-[#E7E3DC] pb-4">
          <SheetTitle className="font-display text-lg text-[#1C1917]">
            {isEditing ? 'Edit buyer' : 'Add buyer'}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-[#1C1917]">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                {...register('name')}
                placeholder="e.g. Rajesh Traders"
                className="border-[#E7E3DC] focus-visible:ring-[#92400E]"
              />
              {errors.name && (
                <p className="text-xs text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-[#1C1917]">Phone</Label>
              <Input
                {...register('phone')}
                placeholder="+91 98765 43210"
                className="border-[#E7E3DC] focus-visible:ring-[#92400E]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-[#1C1917]">City</Label>
              <Input
                {...register('city')}
                placeholder="e.g. Kolkata"
                className="border-[#E7E3DC] focus-visible:ring-[#92400E]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-[#1C1917]">Address</Label>
              <Textarea
                {...register('address')}
                placeholder="Full address"
                className="border-[#E7E3DC] focus-visible:ring-[#92400E] resize-none"
                rows={3}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-[#1C1917]">GSTIN</Label>
              <Input
                {...register('gstin')}
                placeholder="e.g. 29ABCDE1234F1Z5"
                className="border-[#E7E3DC] focus-visible:ring-[#92400E] font-mono text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-[#1C1917]">Notes</Label>
              <Textarea
                {...register('notes')}
                placeholder="Internal notes about this buyer…"
                className="border-[#E7E3DC] focus-visible:ring-[#92400E] resize-none"
                rows={3}
              />
            </div>
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
                'Add buyer'
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
