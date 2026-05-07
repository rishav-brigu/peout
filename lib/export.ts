import * as XLSX from 'xlsx'
import { formatDate } from '@/lib/format'
import type { ManufacturerWithStats } from '@/app/(app)/manufacturers/actions'
import type { BuyerWithStats } from '@/app/(app)/buyers/actions'
import type { ProductWithManufacturer } from '@/app/(app)/products/actions'
import type { PaymentRow } from '@/app/(app)/payments/actions'

function download(wb: XLSX.WorkBook, filename: string) {
  XLSX.writeFile(wb, filename)
}

export function exportManufacturers(data: ManufacturerWithStats[]) {
  const rows = data.map((m) => ({
    Name: m.name,
    City: m.city ?? '',
    Phone: m.phone ?? '',
    Address: m.address ?? '',
    Notes: m.notes ?? '',
    Status: m.is_active ? 'Active' : 'Inactive',
    'Products': m.product_count,
    'Orders': m.order_count,
    'Commission Earned (₹)': m.total_commission,
    'Added On': formatDate(m.created_at),
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Manufacturers')
  download(wb, `manufacturers-${new Date().toISOString().slice(0, 10)}.xlsx`)
}

export function exportBuyers(data: BuyerWithStats[]) {
  const rows = data.map((b) => ({
    Name: b.name,
    City: b.city ?? '',
    Phone: b.phone ?? '',
    Address: b.address ?? '',
    GSTIN: b.gstin ?? '',
    Notes: b.notes ?? '',
    Status: b.is_active ? 'Active' : 'Inactive',
    'Orders': b.order_count,
    'Total Purchased (₹)': b.total_purchased,
    'Outstanding (₹)': b.outstanding,
    'Added On': formatDate(b.created_at),
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Buyers')
  download(wb, `buyers-${new Date().toISOString().slice(0, 10)}.xlsx`)
}

export function exportPayments(data: PaymentRow[]) {
  const rows = data.map((p) => ({
    Date: formatDate(p.paid_at),
    'Order ID': p.order_number,
    Buyer: p.buyer_name,
    'Buyer City': p.buyer_city ?? '',
    Manufacturer: p.manufacturer_name,
    Mode: p.mode,
    'Amount (₹)': p.amount,
    Notes: p.notes ?? '',
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Payments')
  download(wb, `payments-${new Date().toISOString().slice(0, 10)}.xlsx`)
}

export function exportProducts(data: ProductWithManufacturer[]) {
  const rows = data.map((p) => ({
    'Product Name': p.name,
    Manufacturer: p.manufacturer_name,
    City: p.manufacturer_city ?? '',
    Unit: p.unit,
    'Mfr Price (₹)': p.mfr_price,
    'Sell Price (₹)': p.sell_price,
    'Commission (₹)': p.commission,
    Status: p.is_active ? 'Active' : 'Inactive',
    'Last Updated': formatDate(p.updated_at),
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Products')
  download(wb, `products-${new Date().toISOString().slice(0, 10)}.xlsx`)
}
