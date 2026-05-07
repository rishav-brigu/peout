'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Product } from '@/types'

export type ProductWithManufacturer = Product & {
  manufacturer_name: string
  manufacturer_city: string | null
}

export type PriceHistoryRow = {
  id: string
  old_mfr_price: number | null
  new_mfr_price: number | null
  old_sell_price: number | null
  new_sell_price: number | null
  reason: string | null
  changed_at: string
}

export async function getProducts(): Promise<{
  products: ProductWithManufacturer[]
  activeCount: number
  manufacturerCount: number
}> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*, manufacturers(id, name, city)')
    .order('name')

  if (error) throw new Error(error.message)

  const products = (data ?? []).map((p) => {
    const mfr = p.manufacturers as unknown as { id: string; name: string; city: string | null } | null
    return {
      ...p,
      manufacturers: undefined,
      manufacturer_name: mfr?.name ?? '—',
      manufacturer_city: mfr?.city ?? null,
    } as ProductWithManufacturer
  })

  const activeCount = products.filter((p) => p.is_active).length
  const manufacturerCount = new Set(products.map((p) => p.manufacturer_id)).size

  return { products, activeCount, manufacturerCount }
}

export async function getActiveManufacturers(): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('manufacturers')
    .select('id, name')
    .eq('is_active', true)
    .order('name')

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getProductPriceHistory(productId: string): Promise<PriceHistoryRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('product_price_history')
    .select('*')
    .eq('product_id', productId)
    .order('changed_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as PriceHistoryRow[]
}

export async function createProduct(data: {
  manufacturer_id: string
  name: string
  unit: string
  mfr_price: number
  sell_price: number
}): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('products').insert({
    manufacturer_id: data.manufacturer_id,
    name: data.name.trim(),
    unit: data.unit.trim(),
    mfr_price: data.mfr_price,
    sell_price: data.sell_price,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/products')
  revalidatePath(`/manufacturers/${data.manufacturer_id}`)
}

export async function updateProduct(
  id: string,
  data: {
    manufacturer_id: string
    name: string
    unit: string
    mfr_price: number
    sell_price: number
    is_active: boolean
    reason?: string
  }
): Promise<void> {
  const supabase = await createClient()

  const { data: current, error: fetchError } = await supabase
    .from('products')
    .select('mfr_price, sell_price, manufacturer_id')
    .eq('id', id)
    .single()

  if (fetchError || !current) throw new Error(fetchError?.message ?? 'Product not found')

  const priceChanged =
    Number(current.mfr_price) !== data.mfr_price ||
    Number(current.sell_price) !== data.sell_price

  if (priceChanged) {
    const { error: historyError } = await supabase.from('product_price_history').insert({
      product_id: id,
      old_mfr_price: current.mfr_price,
      new_mfr_price: data.mfr_price,
      old_sell_price: current.sell_price,
      new_sell_price: data.sell_price,
      reason: data.reason?.trim() || null,
    })
    if (historyError) throw new Error(historyError.message)
  }

  const { error: updateError } = await supabase
    .from('products')
    .update({
      manufacturer_id: data.manufacturer_id,
      name: data.name.trim(),
      unit: data.unit.trim(),
      mfr_price: data.mfr_price,
      sell_price: data.sell_price,
      is_active: data.is_active,
    })
    .eq('id', id)

  if (updateError) throw new Error(updateError.message)

  revalidatePath('/products')
  revalidatePath(`/manufacturers/${data.manufacturer_id}`)
  if (current.manufacturer_id !== data.manufacturer_id) {
    revalidatePath(`/manufacturers/${current.manufacturer_id}`)
  }
}
