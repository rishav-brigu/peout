-- Migration 002: Add user_id to orders table
-- Run this in Supabase SQL Editor if order creation is failing with a column error.
-- Safe to run multiple times (uses IF NOT EXISTS / DO $$ blocks).

-- 1. Add user_id column to orders (nullable to avoid breaking existing rows)
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Backfill existing orders with the owner's user_id if needed.
--    Replace the UUID below with your OWNER_USER_ID.
--    Only needed if you have existing orders without a user_id.
-- UPDATE orders SET user_id = 'fa1cf2db-1c0d-4889-ab8c-fcc514dc5352' WHERE user_id IS NULL;

-- 3. Drop old permissive policy and replace with per-user scoping
DROP POLICY IF EXISTS "Allow all for authenticated users" ON orders;

CREATE POLICY "Users can manage their own orders" ON orders
  FOR ALL USING (auth.uid() = user_id);

-- 4. Confirm the set_order_number trigger exists and fires on NULL order_number.
--    (This trigger was in the original schema — no change needed, just verifying.)
--    The trigger assigns order_number from a global sequence when it is NULL,
--    which avoids UNIQUE constraint collisions when multiple users each expect PO-0001.
