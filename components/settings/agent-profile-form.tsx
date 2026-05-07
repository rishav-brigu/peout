'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateAgentProfile } from '@/app/(app)/settings/actions'
import type { AgentConfig } from '@/app/(app)/settings/actions'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string().min(1, 'Address is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email('Enter a valid email'),
})

type FormData = z.infer<typeof schema>

interface AgentProfileFormProps {
  config: AgentConfig
}

export function AgentProfileForm({ config }: AgentProfileFormProps) {
  const [saving, setSaving] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: config,
  })

  async function onSubmit(data: FormData) {
    setSaving(true)
    const result = await updateAgentProfile(data)
    setSaving(false)
    if (result.error) {
      toast.error('Failed to save: ' + result.error)
    } else {
      toast.success('Profile updated')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-sm text-[#1C1917]">Name</Label>
          <Input
            id="name"
            {...register('name')}
            placeholder="Your full name"
            className="border-[#E7E3DC] focus-visible:ring-[#92400E]"
          />
          {errors.name && (
            <p className="text-xs text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm text-[#1C1917]">Email</Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            placeholder="you@example.com"
            className="border-[#E7E3DC] focus-visible:ring-[#92400E]"
          />
          {errors.email && (
            <p className="text-xs text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone" className="text-sm text-[#1C1917]">Phone</Label>
          <Input
            id="phone"
            {...register('phone')}
            placeholder="+91 XXXXX XXXXX"
            className="border-[#E7E3DC] focus-visible:ring-[#92400E]"
          />
          {errors.phone && (
            <p className="text-xs text-red-600">{errors.phone.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="address" className="text-sm text-[#1C1917]">Address / City</Label>
          <Input
            id="address"
            {...register('address')}
            placeholder="Your address, City"
            className="border-[#E7E3DC] focus-visible:ring-[#92400E]"
          />
          {errors.address && (
            <p className="text-xs text-red-600">{errors.address.message}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-1">
        <Button
          type="submit"
          size="sm"
          disabled={saving || !isDirty}
          className="bg-[#92400E] hover:bg-[#78350F] text-white"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </form>
  )
}
