'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type AgentConfig = {
  name: string
  address: string
  phone: string
  email: string
}

export async function getAgentConfig(): Promise<AgentConfig> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('config')
    .select('name, address, phone, email')
    .eq('id', 'agent')
    .maybeSingle()

  if (data) return data as AgentConfig

  // Fallback to env vars if DB row hasn't been created yet
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
  const { error } = await supabase
    .from('config')
    .upsert({ id: 'agent', ...data })

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
