// Enums matching the database ENUM types
export type OrderStatus = 'Draft' | 'Confirmed' | 'Delivered' | 'Closed' | 'Cancelled'
export type PaymentStatus = 'Unpaid' | 'Partial' | 'Paid'
export type PaymentTermsType = 'single' | 'installments'
export type PaymentMode = 'Cash' | 'UPI' | 'Cheque' | 'Bank Transfer'
export type ProductStatus = 'Active' | 'Inactive'

// Core entities
export interface Manufacturer {
  id: string
  name: string
  phone: string | null
  address: string | null
  city: string | null
  notes: string | null
  is_active: boolean
  created_at: string
}

export interface Buyer {
  id: string
  name: string
  phone: string | null
  address: string | null
  city: string | null
  gstin: string | null
  notes: string | null
  is_active: boolean
  created_at: string
}

export interface Product {
  id: string
  manufacturer_id: string
  name: string
  unit: string
  mfr_price: number
  sell_price: number
  commission: number
  is_active: boolean
  created_at: string
  updated_at: string
  manufacturer?: Manufacturer
}

export interface ProductPriceHistory {
  id: string
  product_id: string
  old_mfr_price: number | null
  new_mfr_price: number | null
  old_sell_price: number | null
  new_sell_price: number | null
  reason: string | null
  changed_at: string
}

export interface Order {
  id: string
  order_number: string
  manufacturer_id: string
  buyer_id: string
  order_status: OrderStatus
  payment_status: PaymentStatus
  payment_terms: PaymentTermsType
  installments: number | null
  notes: string | null
  created_at: string
  updated_at: string
  manufacturer?: Manufacturer
  buyer?: Buyer
  order_items?: OrderItem[]
  payments?: Payment[]
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  mfr_price_snapshot: number
  sell_price_snapshot: number
  commission_snapshot: number
  product?: Product
}

export interface Payment {
  id: string
  order_id: string
  amount: number
  mode: PaymentMode
  notes: string | null
  paid_at: string
  created_at: string
}

// Derived / computed types
export interface OrderSummary {
  total_mfr_value: number
  total_sell_value: number
  total_commission: number
  total_paid: number
  outstanding: number
}

// Form input types
export interface ManufacturerFormData {
  name: string
  phone: string
  address: string
  city: string
  notes: string
}

export interface BuyerFormData {
  name: string
  phone: string
  address: string
  city: string
  gstin: string
  notes: string
}

export interface ProductFormData {
  manufacturer_id: string
  name: string
  unit: string
  mfr_price: number
  sell_price: number
}

export interface OrderItemFormData {
  product_id: string
  quantity: number
  mfr_price_snapshot: number
  sell_price_snapshot: number
  commission_snapshot: number
}

export interface CreateOrderFormData {
  manufacturer_id: string
  buyer_id: string
  items: OrderItemFormData[]
  payment_terms: PaymentTermsType
  installments: number | null
  notes: string
}

export interface RecordPaymentFormData {
  amount: number
  mode: PaymentMode
  notes: string
  paid_at: string
}

export interface PriceChangeFormData {
  mfr_price: number
  sell_price: number
  reason: string
}
