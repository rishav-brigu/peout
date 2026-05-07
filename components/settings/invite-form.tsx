'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { inviteUser } from '@/app/(app)/settings/actions'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
})

type FormData = z.infer<typeof schema>

export function InviteForm() {
  const [sending, setSending] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setSending(true)
    const result = await inviteUser(data.email)
    setSending(false)
    if (result.error) {
      toast.error('Failed to send invite: ' + result.error)
    } else {
      toast.success(`Invite sent to ${data.email}`)
      reset()
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex gap-3 items-start">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="invite-email" className="text-sm text-[#1C1917]">
            Email address
          </Label>
          <Input
            id="invite-email"
            type="email"
            {...register('email')}
            placeholder="colleague@example.com"
            className="border-[#E7E3DC] focus-visible:ring-[#92400E]"
          />
          {errors.email && (
            <p className="text-xs text-red-600">{errors.email.message}</p>
          )}
        </div>
        <div className="pt-6">
          <Button
            type="submit"
            size="sm"
            disabled={sending}
            className="bg-[#92400E] hover:bg-[#78350F] text-white"
          >
            {sending ? 'Sending…' : 'Send invite'}
          </Button>
        </div>
      </div>
      <p className="text-xs text-[#78716C]">
        The recipient will receive an email with a link to set their password and access the app.
        They will start with a clean slate — no shared data.
      </p>
    </form>
  )
}
