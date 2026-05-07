'use client'

import { useState, useMemo } from 'react'
import { Plus, Search, Download, Package, Clock, Pencil } from 'lucide-react'
import { exportProducts } from '@/lib/export'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StatusBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { ProductForm } from './product-form'
import { PriceHistoryDrawer } from './price-history-drawer'
import { formatINR, formatDate } from '@/lib/format'
import type { Product } from '@/types'
import type { ProductWithManufacturer } from '@/app/(app)/products/actions'

interface ProductsClientProps {
  products: ProductWithManufacturer[]
  manufacturers: { id: string; name: string }[]
  activeCount: number
  manufacturerCount: number
}

export function ProductsClient({
  products,
  manufacturers,
  activeCount,
  manufacturerCount,
}: ProductsClientProps) {
  const [search, setSearch] = useState('')
  const [manufacturerFilter, setManufacturerFilter] = useState('all')
  const [unitFilter, setUnitFilter] = useState('all')
  const [showInactive, setShowInactive] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [historyProduct, setHistoryProduct] = useState<ProductWithManufacturer | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)

  const units = useMemo(
    () => Array.from(new Set(products.map((p) => p.unit))).sort(),
    [products]
  )

  const filtered = useMemo(() => {
    let list = showInactive ? products : products.filter((p) => p.is_active)

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.manufacturer_name.toLowerCase().includes(q) ||
          p.unit.toLowerCase().includes(q)
      )
    }

    if (manufacturerFilter !== 'all') {
      list = list.filter((p) => p.manufacturer_id === manufacturerFilter)
    }

    if (unitFilter !== 'all') {
      list = list.filter((p) => p.unit === unitFilter)
    }

    return list
  }, [products, search, manufacturerFilter, unitFilter, showInactive])

  function openAdd() {
    setEditingProduct(null)
    setFormOpen(true)
  }

  function openEdit(product: ProductWithManufacturer) {
    setEditingProduct(product)
    setFormOpen(true)
  }

  function openHistory(product: ProductWithManufacturer) {
    setHistoryProduct(product)
    setHistoryOpen(true)
  }

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#78716C]" />
          <Input
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 border-[#E7E3DC] focus-visible:ring-[#92400E] h-8 text-sm"
          />
        </div>

        {manufacturers.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[#78716C]">Manufacturer:</span>
            <select
              value={manufacturerFilter}
              onChange={(e) => setManufacturerFilter(e.target.value)}
              className="h-8 rounded-lg border border-[#E7E3DC] bg-white px-2 text-sm text-[#1C1917] focus:outline-none focus:ring-1 focus:ring-[#92400E]"
            >
              <option value="all">All</option>
              {manufacturers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {units.length > 1 && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[#78716C]">Unit:</span>
            <select
              value={unitFilter}
              onChange={(e) => setUnitFilter(e.target.value)}
              className="h-8 rounded-lg border border-[#E7E3DC] bg-white px-2 text-sm text-[#1C1917] focus:outline-none focus:ring-1 focus:ring-[#92400E]"
            >
              <option value="all">All</option>
              {units.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        )}

        <label className="flex items-center gap-1.5 cursor-pointer ml-1">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="accent-[#92400E] w-3.5 h-3.5"
          />
          <span className="text-xs text-[#78716C]">Show inactive</span>
        </label>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportProducts(filtered)}
            className="border-[#E7E3DC] text-[#78716C] gap-1.5"
          >
            <Download size={14} />
            Export
          </Button>
          <Button
            size="sm"
            onClick={openAdd}
            className="bg-[#92400E] hover:bg-[#78350F] text-white gap-1.5"
          >
            <Plus size={14} />
            Add product
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title={
            search || manufacturerFilter !== 'all' || unitFilter !== 'all'
              ? 'No products match your filters'
              : showInactive
              ? 'No products yet'
              : 'No active products'
          }
          description={
            search || manufacturerFilter !== 'all' || unitFilter !== 'all'
              ? 'Try adjusting your search or filters.'
              : 'Add your first product to get started.'
          }
          actionLabel="Add product"
          onAction={openAdd}
        />
      ) : (
        <div className="bg-white border border-[#E7E3DC] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E7E3DC] bg-[#FAF7F2]">
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wide text-[#78716C] font-medium">
                  Product
                </th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wide text-[#78716C] font-medium">
                  Manufacturer
                </th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wide text-[#78716C] font-medium">
                  Unit
                </th>
                <th className="text-right px-4 py-3 text-[10px] uppercase tracking-wide text-[#78716C] font-medium">
                  Mfr ₹
                </th>
                <th className="text-right px-4 py-3 text-[10px] uppercase tracking-wide text-[#78716C] font-medium">
                  Sell ₹
                </th>
                <th className="text-right px-4 py-3 text-[10px] uppercase tracking-wide text-[#78716C] font-medium text-[#92400E]">
                  Commission
                </th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wide text-[#78716C] font-medium">
                  Last updated
                </th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wide text-[#78716C] font-medium">
                  Status
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E3DC]">
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  className={`hover:bg-[#FAF7F2] transition-colors ${!p.is_active ? 'opacity-60' : ''}`}
                >
                  <td className="px-4 py-3 font-medium text-[#1C1917]">{p.name}</td>
                  <td className="px-4 py-3 text-[#78716C]">
                    {p.manufacturer_name}
                    {p.manufacturer_city && (
                      <span className="text-[#A8A29E]"> · {p.manufacturer_city}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[#78716C]">{p.unit}</td>
                  <td className="px-4 py-3 text-right text-[#1C1917]">{formatINR(p.mfr_price)}</td>
                  <td className="px-4 py-3 text-right text-[#1C1917]">{formatINR(p.sell_price)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-[#92400E]">
                    {formatINR(p.commission)}
                  </td>
                  <td className="px-4 py-3 text-[#78716C]">{formatDate(p.updated_at)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.is_active ? 'Active' : 'Inactive'} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openHistory(p)}
                        className="p-1 rounded text-[#78716C] hover:text-[#1C1917] hover:bg-[#FAF7F2] transition-colors"
                        title="Price history"
                      >
                        <Clock size={14} />
                      </button>
                      <button
                        onClick={() => openEdit(p)}
                        className="p-1 rounded text-[#78716C] hover:text-[#1C1917] hover:bg-[#FAF7F2] transition-colors"
                        title="Edit product"
                      >
                        <Pencil size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ProductForm
        open={formOpen}
        onOpenChange={setFormOpen}
        product={editingProduct}
        manufacturers={manufacturers}
      />

      <PriceHistoryDrawer
        product={historyProduct}
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        onRecordChange={() => {
          if (historyProduct) openEdit(historyProduct)
        }}
      />
    </>
  )
}
