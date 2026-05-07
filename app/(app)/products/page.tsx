import { getProducts, getActiveManufacturers } from './actions'
import { ProductsClient } from '@/components/products/products-client'

export default async function ProductsPage() {
  const [{ products, activeCount, manufacturerCount }, manufacturers] = await Promise.all([
    getProducts(),
    getActiveManufacturers(),
  ])

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-[#1C1917]">Products</h1>
          <p className="text-sm text-[#78716C] mt-0.5">
            {activeCount} active {activeCount === 1 ? 'product' : 'products'} across{' '}
            {manufacturerCount} {manufacturerCount === 1 ? 'manufacturer' : 'manufacturers'}
          </p>
        </div>
      </div>

      <ProductsClient
        products={products}
        manufacturers={manufacturers}
        activeCount={activeCount}
        manufacturerCount={manufacturerCount}
      />
    </div>
  )
}
