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
import { createManufacturer, updateManufacturer } from '@/app/(app)/manufacturers/actions'
import type { Manufacturer } from '@/types'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string(),
  city: z.string(),
  address: z.string(),
  notes: z.string(),
})

type FormData = z.infer<typeof schema>

interface ManufacturerFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  manufacturer?: Manufacturer | null
}

export function ManufacturerForm({ open, onOpenChange, manufacturer }: ManufacturerFormProps) {
  const isEditing = !!manufacturer

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (open) {
      reset(
        manufacturer
          ? {
              name: manufacturer.name,
              phone: manufacturer.phone ?? '',
              city: manufacturer.city ?? '',
              address: manufacturer.address ?? '',
              notes: manufacturer.notes ?? '',
            }
          : { name: '', phone: '', city: '', address: '', notes: '' }
      )
    }
  }, [open, manufacturer, reset])

  async function onSubmit(data: FormData) {
    try {
      if (isEditing && manufacturer) {
        await updateManufacturer(manufacturer.id, data)
        toast.success('Manufacturer updated')
      } else {
        await createManufacturer(data)
        toast.success('Manufacturer added')
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
            {isEditing ? 'Edit manufacturer' : 'Add manufacturer'}
          </SheetTitle>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col flex-1 min-h-0"
        >
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-[#1C1917]">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                {...register('name')}
                placeholder="e.g. Sleepwell Industries"
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
                placeholder="e.g. Ghaziabad"
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
              <Label className="text-sm font-medium text-[#1C1917]">Notes</Label>
              <Textarea
                {...register('notes')}
                placeholder="Internal notes about this manufacturer…"
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
                'Add manufacturer'
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
