'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { changePassword } from '@/app/(app)/settings/actions'

const schema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  })

type FormData = z.infer<typeof schema>

export function ChangePasswordForm() {
  const [saving, setSaving] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirm: '' },
  })

  async function onSubmit(data: FormData) {
    setSaving(true)
    const result = await changePassword(data.password)
    setSaving(false)
    if (result.error) {
      toast.error('Failed to update password: ' + result.error)
    } else {
      toast.success('Password updated')
      reset()
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-sm text-[#1C1917]">New password</Label>
          <Input
            id="password"
            type="password"
            {...register('password')}
            placeholder="Min. 8 characters"
            autoComplete="new-password"
            className="border-[#E7E3DC] focus-visible:ring-[#92400E]"
          />
          {errors.password && (
            <p className="text-xs text-red-600">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm" className="text-sm text-[#1C1917]">Confirm password</Label>
          <Input
            id="confirm"
            type="password"
            {...register('confirm')}
            placeholder="Repeat new password"
            autoComplete="new-password"
            className="border-[#E7E3DC] focus-visible:ring-[#92400E]"
          />
          {errors.confirm && (
            <p className="text-xs text-red-600">{errors.confirm.message}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-1">
        <Button
          type="submit"
          size="sm"
          disabled={saving}
          className="bg-[#92400E] hover:bg-[#78350F] text-white"
        >
          {saving ? 'Updating…' : 'Update password'}
        </Button>
      </div>
    </form>
  )
}
