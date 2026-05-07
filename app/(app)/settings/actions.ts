'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export type AgentConfig = {
  name: string
  address: string
  phone: string
  email: string
}

export async function getAgentConfig(): Promise<AgentConfig> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data } = await supabase
      .from('config')
      .select('name, address, phone, email')
      .eq('user_id', user.id)
      .maybeSingle()
    if (data) return data as AgentConfig
  }

  return {
    name: process.env.NEXT_PUBLIC_AGENT_NAME ?? '',
    address: process.env.NEXT_PUBLIC_AGENT_ADDRESS ?? '',
    phone: process.env.NEXT_PUBLIC_AGENT_PHONE ?? '',
    email: process.env.NEXT_PUBLIC_AGENT_EMAIL ?? '',
  }
}

export async function updateAgentProfile(
  data: AgentConfig
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('config')
    .upsert(
      { id: user.id, user_id: user.id, ...data },
      { onConflict: 'user_id' }
    )

  if (error) return { error: error.message }
  revalidatePath('/settings')
  return {}
}

export async function changePassword(
  password: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: error.message }
  return {}
}

export async function inviteUser(
  email: string
): Promise<{ error?: string }> {
  const admin = createAdminClient()
  const { error } = await admin.auth.admin.inviteUserByEmail(email)
  if (error) return { error: error.message }
  return {}
}
