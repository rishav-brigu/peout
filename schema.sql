-- PeOut Database Schema
-- Run this in the Supabase SQL Editor (ap-south-1 project)
-- Single user account is managed by Supabase Auth — no custom users table needed.

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE order_status AS ENUM ('Draft', 'Confirmed', 'Delivered', 'Closed', 'Cancelled');
CREATE TYPE payment_status AS ENUM ('Unpaid', 'Partial', 'Paid');
CREATE TYPE payment_terms_type AS ENUM ('single', 'installments');
CREATE TYPE payment_mode AS ENUM ('Cash', 'UPI', 'Cheque', 'Bank Transfer');

-- ============================================================
-- CORE TABLES
-- ============================================================

CREATE TABLE manufacturers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  phone       TEXT,
  address     TEXT,
  city        TEXT,
  notes       TEXT,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE buyers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  phone       TEXT,
  address     TEXT,
  city        TEXT,
  gstin       TEXT,
  notes       TEXT,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE products (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manufacturer_id  UUID REFERENCES manufacturers(id) ON DELETE RESTRICT,
  name             TEXT NOT NULL,
  unit             TEXT NOT NULL,
  mfr_price        NUMERIC(12,2) NOT NULL,
  sell_price       NUMERIC(12,2) NOT NULL,
  -- commission is always sell_price - mfr_price, stored for query performance
  commission       NUMERIC(12,2) GENERATED ALWAYS AS (sell_price - mfr_price) STORED,
  is_active        BOOLEAN DEFAULT true,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE product_price_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID REFERENCES products(id) ON DELETE CASCADE,
  old_mfr_price   NUMERIC(12,2),
  new_mfr_price   NUMERIC(12,2),
  old_sell_price  NUMERIC(12,2),
  new_sell_price  NUMERIC(12,2),
  reason          TEXT,
  changed_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number    TEXT UNIQUE NOT NULL,   -- 'PO-0001' format, auto-generated
  manufacturer_id UUID REFERENCES manufacturers(id) ON DELETE RESTRICT,
  buyer_id        UUID REFERENCES buyers(id) ON DELETE RESTRICT,
  order_status    order_status DEFAULT 'Draft',
  payment_status  payment_status DEFAULT 'Unpaid',
  payment_terms   payment_terms_type DEFAULT 'single',
  installments    INT,                    -- null if single payment
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE order_items (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id             UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id           UUID REFERENCES products(id) ON DELETE RESTRICT,
  quantity             NUMERIC(10,2) NOT NULL,
  -- PRICE SNAPSHOTS — immutable after order creation
  mfr_price_snapshot   NUMERIC(12,2) NOT NULL,
  sell_price_snapshot  NUMERIC(12,2) NOT NULL,
  commission_snapshot  NUMERIC(12,2) NOT NULL
);

CREATE TABLE payments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   UUID REFERENCES orders(id) ON DELETE CASCADE,
  amount     NUMERIC(12,2) NOT NULL,
  mode       payment_mode NOT NULL,
  notes      TEXT,
  paid_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- ORDER NUMBER SEQUENCE
-- ============================================================

CREATE SEQUENCE order_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number := 'PO-' || LPAD(nextval('order_number_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL OR NEW.order_number = '')
  EXECUTE FUNCTION generate_order_number();

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_products_manufacturer ON products(manufacturer_id);
CREATE INDEX idx_orders_manufacturer ON orders(manufacturer_id);
CREATE INDEX idx_orders_buyer ON orders(buyer_id);
CREATE INDEX idx_orders_status ON orders(order_status);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_product_price_history_product ON product_price_history(product_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
-- This is a single-user private app. Enable RLS and allow all
-- operations only for authenticated users.

ALTER TABLE manufacturers ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated users" ON manufacturers
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON buyers
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON products
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON product_price_history
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON orders
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON order_items
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON payments
  FOR ALL USING (auth.role() = 'authenticated');
