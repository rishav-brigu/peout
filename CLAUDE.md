# CLAUDE.md — PeOut

This file is the single source of truth for Claude Code when working on this project.
Read it fully before writing any code, generating components, or making architectural decisions.

---

## What this app is

**PeOut** is a private, single-user business management web app for a commission agent (middleman) in the sleeping accessories trade — mattresses, bed sheets, raw materials, and related products.

The user brokers deals between **manufacturers** (who supply goods) and **buyers** (distributors/businesses who purchase them), earning a commission on every order. This app replaces a manual Excel workflow.

**There is exactly one user.** No multi-tenancy. No registration flow. No roles. One email/password login, one account, forever.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router) |
| UI components | shadcn/ui |
| Styling | Tailwind CSS |
| Database + Auth | Supabase (PostgreSQL + Supabase Auth) |
| Charts | Recharts |
| PDF export | `@react-pdf/renderer` |
| Hosting | Vercel |

**Do not deviate from this stack.** No additional state management libraries (use React state + server actions). No component libraries other than shadcn/ui.

---

## Design system

### Personality
Refined and utilitarian. The aesthetic of a well-made Indian trade ledger — digitized thoughtfully. Warm, structured, data-dense. Not a generic SaaS product.

### Fonts
- **Headings / display:** DM Serif Display or Playfair Display
- **Body / data / UI:** DM Sans or Plus Jakarta Sans

### Color palette

```
Background:       #FAF7F2  (warm off-white / light cream — never pure white)
Primary accent:   #92400E  (deep amber/ochre — use for CTAs, active nav, links)
Accent hover:     #78350F
Text primary:     #1C1917  (warm charcoal)
Text secondary:   #78716C  (warm slate)
Border:           #E7E3DC  (warm light gray)
Card background:  #FFFFFF  (white cards on cream background)

Status — Paid / Delivered / Closed:   green   (#15803D bg, #DCFCE7 pill)
Status — Partial / Confirmed:         amber   (#B45309 bg, #FEF3C7 pill)
Status — Unpaid / Overdue:            red     (#DC2626 bg, #FEE2E2 pill)
Status — Draft:                       gray    (#6B7280 bg, #F3F4F6 pill)
Status — Active (product):            green pill
Status — Inactive (product):          gray pill
```

**Never use:** bright blue, corporate purple, neon colors, heavy box shadows.

### Layout
- Persistent left sidebar (240px wide) + main content area
- Sidebar collapses to hamburger / bottom nav on mobile
- Minimal card depth — use `border` + subtle `bg` difference, not heavy `shadow-lg`
- No dark mode

### Currency formatting
Always use Indian number formatting with the ₹ symbol:
- ✅ `₹1,25,000`
- ❌ `₹125,000`

Use this utility everywhere:
```ts
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}
```

### Status badge component
A single reusable `<StatusBadge status="..." />` component. Pill shape, consistent across the whole app.

```
OrderStatus:   "Draft" | "Confirmed" | "Delivered" | "Closed" | "Cancelled"
PaymentStatus: "Unpaid" | "Partial" | "Paid"
ProductStatus: "Active" | "Inactive"
```

### Standard UI patterns (apply everywhere)

- **Empty states:** Every list/table must have an empty state — icon + message + CTA button. e.g. "No orders yet. Create your first order →"
- **Confirmation dialogs:** All destructive actions (cancel order, delete product, remove buyer) must show a shadcn `AlertDialog` before executing.
- **Toasts:** Every create/update/delete action triggers a `sonner` toast — success or error.
- **Loading states:** Use skeleton loaders for tables and cards, not spinners.
- **Search:** Global search bar in the top header (⌘K shortcut) covers orders, buyers, manufacturers, products.

---

## Application structure

```
/app
  /(auth)
    /login              # Login screen — unauthenticated entry point
  /(app)
    /dashboard          # Dashboard — landing after login
    /orders
      /page.tsx         # Orders list
      /new/page.tsx     # Create new order
      /[id]/page.tsx    # Order detail
      /[id]/export      # PDF export preview
    /manufacturers
      /page.tsx         # Manufacturers list (card grid)
      /[id]/page.tsx    # Manufacturer detail (tabs: Products, Orders)
    /buyers
      /page.tsx         # Buyers list (table)
      /[id]/page.tsx    # Buyer detail (tabs: Orders, Payments)
    /products
      /page.tsx         # Products list (table + price history drawer)
    /payments
      /page.tsx         # Payments list (table, read-only)
    /settings
      /page.tsx         # Account/password only
/components
  /ui                   # shadcn/ui primitives
  /layout
    sidebar.tsx
    topbar.tsx
    mobile-nav.tsx
  /shared
    status-badge.tsx
    currency.tsx
    empty-state.tsx
    confirm-dialog.tsx
  /dashboard/...
  /orders/...
  /manufacturers/...
  /buyers/...
  /products/...
  /payments/...
  /pdf/...
/lib
  supabase.ts           # Supabase client (server + browser)
  format.ts             # formatINR, formatDate utilities
  auth.ts               # Auth helpers
/types
  index.ts              # All shared TypeScript types
```

---

## Database schema

### Core tables

```sql
-- Single user account (managed by Supabase Auth)
-- No custom users table needed.

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
  unit             TEXT NOT NULL,         -- 'pc', 'kg', 'set', 'meter', etc.
  mfr_price        NUMERIC(12,2) NOT NULL,
  sell_price       NUMERIC(12,2) NOT NULL,
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

CREATE TYPE order_status AS ENUM ('Draft', 'Confirmed', 'Delivered', 'Closed', 'Cancelled');
CREATE TYPE payment_status AS ENUM ('Unpaid', 'Partial', 'Paid');
CREATE TYPE payment_terms_type AS ENUM ('single', 'installments');

CREATE TABLE orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number    TEXT UNIQUE NOT NULL,   -- 'PO-2403' format
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
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id          UUID REFERENCES products(id) ON DELETE RESTRICT,
  quantity            NUMERIC(10,2) NOT NULL,
  -- PRICE SNAPSHOTS: store prices at time of order creation.
  -- Never use live product prices for historical orders.
  mfr_price_snapshot  NUMERIC(12,2) NOT NULL,
  sell_price_snapshot NUMERIC(12,2) NOT NULL,
  commission_snapshot NUMERIC(12,2) NOT NULL
);

CREATE TYPE payment_mode AS ENUM ('Cash', 'UPI', 'Cheque', 'Bank Transfer');

CREATE TABLE payments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   UUID REFERENCES orders(id) ON DELETE CASCADE,
  amount     NUMERIC(12,2) NOT NULL,
  mode       payment_mode NOT NULL,
  notes      TEXT,
  paid_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Critical architectural note — price snapshots
`order_items` stores `mfr_price_snapshot`, `sell_price_snapshot`, and `commission_snapshot` at the moment the order is created. **Never recalculate these from the live `products` table.** This ensures historical orders always show correct prices even if the product's price changes later. This is the most important data integrity rule in the app.

---

## Screens — detailed specification

### 1. Login (`/login`)
- Centered card on cream background with subtle grid pattern
- PeOut logo (amber square with white "P" + wordmark) above form
- Tagline: *"Your commission business, organised."*
- Fields: Email, Password (with "Forgot?" link in amber)
- CTA: "Sign in" — full-width amber button
- Footer: `PRIVATE WORKSPACE · v1.x.x`
- No registration link. No social login.

---

### 2. Dashboard (`/dashboard`)
**Header row:** "Dashboard" title + date + global search + "+ New order" button

**Metric cards (4, top row):**
- Commission This Month (₹) — with % change vs last month
- Orders This Month (count) — with delta vs last month
- Pending Payments (₹) — across all orders
- Pending Delivery (count) — orders confirmed but not delivered

**Middle section (2 columns):**
- Left (60%): Bar chart — "Commission, last 12 months" — Recharts BarChart, amber bars, month labels on X axis, ₹ on Y axis
- Right (40%): "Pending payments" list — top 5 most overdue, each row shows: days-overdue pill (red/amber), buyer name, order ID, amount, "Record →" button

**Bottom:** "Recent orders" table — last 10 orders
Columns: ORDER ID (amber link), MANUFACTURER, BUYER, DATE, VALUE, COMMISSION (amber), STATUS badge

---

### 3. Orders list (`/orders`)
**Top bar:** "Orders" title + subtitle (total count + value in flight) + global search + Export button + "+ New order" button

**Filter bar:** Search by order ID/buyer/manufacturer + Status dropdown (All/Draft/Confirmed/Delivered/Closed/Cancelled) + Payment dropdown (All/Unpaid/Partial/Paid) + Date range dropdown

**Table columns:**
`ORDER ID` (amber, clickable) | `DATE` | `MANUFACTURER` | `BUYER` | `ITEMS` | `ORDER VALUE` | `COMMISSION` (amber) | `PAYMENT` (badge) | `STATUS` (badge) | actions (👁 view, ⬇ PDF)

Pagination: "Showing 1–10 of N"

---

### 4. Create order (`/orders/new`)
Single long-form page with a sticky progress indicator at the top showing steps: Manufacturer ✓ → Buyer ✓ → Items 3 → Payment terms 4 → Notes

**Form sections (all on one page, sequential):**

**Section 1 — Manufacturer + Buyer (side by side dropdowns)**
- Searchable selects
- Under each: sub-label with city + product count (manufacturer) or city + GST (buyer)

**Section 2 — Order items table**
Columns: PRODUCT (searchable select from that manufacturer's active products) | QTY (editable number input) | UNIT (auto-filled) | MFR ₹ (auto-filled) | SELL ₹ (auto-filled) | COMM/UNIT (auto-filled) | LINE COMM (amber, calculated) | delete icon
"+ Add item" button below table

**Section 3 — Payment terms**
Two radio cards: "Single payment — Full amount on delivery" | "Installments — Split across multiple payments" (if selected, show: number of installments input)

**Section 4 — Notes**
Optional textarea

**Live summary sidebar (sticky right panel):**
- Total mfr value
- Total buyer value
- **Your commission** (amber, large)
- Commission % of buyer value
- Note: "Prices are current as of [date]. Any change recorded after will be applied to future orders only."
- "Create order →" button (amber)

**Top right actions:** "Save draft" (outline) | "Create order →" (amber)

---

### 5. Order detail (`/orders/[id]`)
**Top bar:** "Order PO-XXXX" + subtitle (created date + last edited) + "Mfr PDF" | "Buyer PDF" | "Edit" buttons

**Header card (full width):**
ORDER ID (large) | MANUFACTURER name + location + phone | BUYER name + location + GST | ORDER STATUS badge | PAYMENT STATUS badge | YOUR COMMISSION (amber, large)

**Two-column section:**

Left (65%) — "Order items" table:
PRODUCT | QTY | UNIT | MFR ₹ | SELL ₹ | COMM/U | LINE COMM (amber)
Totals row at bottom.

Right (35%) — "Summary" card:
- Total mfr value
- Total buyer value
- **Your commission** (amber, large)
- Payment terms
- Progress bar: Received / Outstanding
- Received amount (green) | Outstanding amount (red)

**Payment history section:**
"Payment history" heading + "+ Record payment" button (amber, right-aligned)
Each payment row: ✓ icon | date | mode pill | "From [Buyer]. [reference]" | +₹amount (green)
Last row (if outstanding): ₹ icon | "Outstanding balance · expected by [date]" | -₹amount (red)

**Bottom:** "× Cancel order" (red text link, destructive — shows confirmation dialog)

---

### 6. Manufacturers list (`/manufacturers`)
**Top bar:** "Manufacturers" + subtitle (N manufacturers · N active products) + global search + Export + "+ Add manufacturer"

**Filter bar:** Search manufacturers + City dropdown + Sort dropdown

**Card grid (3 columns desktop, 2 tablet, 1 mobile):**
Each card:
- Initials avatar (amber bg) + Name (bold) + Active badge
- Phone + City
- Divider
- PRODUCTS count | ORDERS count | COMMISSION ₹ (amber)
- "View →" button (outline)

---

### 7. Manufacturer detail (`/manufacturers/[id]`)
**Top bar:** Manufacturer name + "Manufacturer · since [month year]" + "Edit details" | "+ New order" buttons

**Info card (full width):**
Initials avatar | PHONE | ADDRESS | LIFETIME: Orders count | Active SKUs | Commission earned (amber) | NOTES (italic text in a warm-tinted box)

**Tabs:** `Products · N` (underline active) | `Orders · N`

**Products tab:**
"+ Add product" button (right)
Table: PRODUCT | UNIT | MFR ₹ | SELL ₹ | COMMISSION (amber) | LAST UPDATED | STATUS badge | 🕐 (price history) | ✏️ (edit) actions

**Orders tab:**
Same columns as orders list, filtered to this manufacturer.

---

### 8. Buyers list (`/buyers`)
**Top bar:** "Buyers" + subtitle (N buyers · ₹X outstanding) + global search + Export + "+ Add buyer"

**Filter bar:** Search buyers + Outstanding filter dropdown + Sort dropdown

**Table** (not cards — buyers are more data-dense):
BUYER (initials avatar + name) | CITY | PHONE | ORDERS | TOTAL PURCHASED | OUTSTANDING (red if >0, — if zero) | "View →" button

---

### 9. Buyer detail (`/buyers/[id]`)
**Top bar:** Buyer name + "Buyer · since [month year]" + "Edit details" | "+ New order" buttons

**Info card:**
Initials avatar | PHONE | ADDRESS | GSTIN | LIFETIME: Orders count | Total purchased (₹) | Outstanding (red pill if any) | NOTES

**Tabs:** `Orders · N` | `Payments · N`

**Orders tab:**
Table: ORDER ID (amber) | DATE | MANUFACTURER | ITEMS | VALUE | COMMISSION (amber) | PAYMENT badge | ORDER badge

**Payments tab:**
Table: DATE | ORDER ID (amber) | MODE pill | AMOUNT (green +₹) | NOTES

---

### 10. Products list (`/products`)
**Top bar:** "Products" + subtitle (N products across N manufacturers) + global search + Export + "+ Add product"

**Filter bar:** Search products + Manufacturer dropdown + Unit dropdown + "Show inactive" toggle (right-aligned)

**Table:**
PRODUCT | MANUFACTURER | UNIT | MFR PRICE | SELL PRICE | COMMISSION (amber) | LAST UPDATED | STATUS badge | 🕐 (price history drawer) | ✏️ (edit) actions

---

### 11. Price history drawer (Products)
Slide-in drawer from the right, triggered by 🕐 icon on any product row.

**Drawer header:**
"PRICE HISTORY" label | Product name (large, bold) | Manufacturer · unit | × close

**Current price section:**
Mfr / Sell / Commission in large type (commission in amber)

**Timeline (most recent first):**
Each entry:
- Date (+ "Latest" badge on first)
- Two cards side by side: `Mfr ₹: old → new (+Δ)` | `Sell ₹: old → new (+Δ)`
- Reason/note in italic if present
- Timeline dot + line connecting entries

**Footer:** "+ Record price change" button (full-width amber)

---

### 12. Payments list (`/payments`)
**Top bar:** "Payments" + subtitle (N payments recorded · ₹X this month) + global search + "Export CSV"

**Summary cards (4, top row):**
BANK TRANSFER ₹ · N payments | UPI ₹ · N payments | CHEQUE ₹ · N payments | CASH ₹ · N payments
All scoped to the current filter period.

**Filter bar:** Search by order/buyer + Date range + Mode dropdown + Buyer dropdown + Manufacturer dropdown

**Table:**
DATE | ORDER (amber link) | BUYER | MODE (pill badge) | AMOUNT (green +₹) | RECORDED BY (always "You") | NOTES

**Table footer row:** "Total this view" | summed amount

---

### 13. PDF export preview (`/orders/[id]/export`)
**Top bar:** "Export · Order PO-XXXX" + "Print preview — A4" + "🖨 Print" | "⬇ Download PDF" buttons

**Toggle:** `[Manufacturer copy]` `[Buyer copy]` — tabs above the preview

**Preview document (white card, A4 proportions):**
- PeOut logo + "Commission Trading · Sleeping Accessories" left-aligned
- Agent name + address + phone + email right-aligned
- Horizontal rule
- "Order Note" (large serif) + copy label (italic)
- Right-aligned meta: Order ID | Date | Status (amber)
- Two boxes side by side: FROM — MANUFACTURER (name, address, phone) | TO — BUYER (name, address, GST, phone)
- Items table: # | Product | Qty | Unit | Rate | Amount — dark header row, clean rows, total row with amber ₹
- PAYMENT TERMS section
- NOTES section (italic)
- Signature line (right-aligned, italic name) + "Authorised signatory · PeOut"

Manufacturer copy shows mfr rates. Buyer copy shows sell rates.

---

## Business logic rules

1. **Commission = sell_price − mfr_price.** Always calculated, never manually entered.
2. **Price snapshots are immutable.** Once an order is created, its item prices never change, even if the product's price is updated later.
3. **Payment status is derived automatically:**
   - Unpaid: sum of payments = 0
   - Partial: 0 < sum < order total buyer value
   - Paid: sum ≥ order total buyer value
4. **Order number format:** `PO-XXXX` where XXXX is a zero-padded sequential integer. Auto-generated on order creation.
5. **Deleting is rare.** Products are deactivated (not deleted). Manufacturers and buyers are deactivated (not deleted). Orders are cancelled (not deleted).
6. **Payments are only recorded from the Order detail view.** The Payments list is read-only.
7. **Price history is logged automatically** whenever a product's mfr_price or sell_price is updated.

---

## What NOT to build

- No dark mode
- No registration or invite flow
- No multi-user / roles / permissions
- No onboarding overlays or feature tours
- No subscription tiers or upgrade prompts
- No social login (Google, GitHub, etc.)
- No notifications system (no emails, no push)
- No blue as the primary accent color
- No heavy card shadows (`shadow-lg`, `shadow-xl`)
- No external analytics (no Mixpanel, no PostHog)

---

## Build phases

### Phase 1 — MVP (get the Excel out of his hands)
- [ ] Project setup: Next.js + Supabase + shadcn/ui + Tailwind
- [ ] Auth (login screen, session, middleware protection)
- [ ] Supabase schema + seed data
- [ ] Sidebar layout + mobile nav
- [ ] Manufacturers CRUD
- [ ] Buyers CRUD
- [ ] Products CRUD + price history logging
- [ ] Orders: list, create, detail
- [ ] Payments: record payment from order detail

### Phase 2 — PDF + installments
- [ ] PDF export (manufacturer copy + buyer copy) via `@react-pdf/renderer`
- [ ] PDF preview screen
- [ ] Installment payment terms UI
- [ ] Price history drawer

### Phase 3 — Dashboard + analytics
- [ ] Dashboard metric cards (server-computed)
- [ ] Commission bar chart (Recharts)
- [ ] Pending payments widget
- [ ] Payments list view (with mode breakdown cards)

---

## Naming conventions

- Files: `kebab-case.tsx`
- Components: `PascalCase`
- Database columns: `snake_case`
- TypeScript types: `PascalCase` (e.g. `Order`, `OrderItem`, `Manufacturer`)
- Supabase client: use server client in Server Components and API routes; browser client only in Client Components that need real-time or auth

---

## Entity relationship diagram

```
MANUFACTURERS ||--o{ PRODUCTS : "supplies"
MANUFACTURERS ||--o{ ORDERS : "fulfills"
BUYERS ||--o{ ORDERS : "places"
ORDERS ||--o{ ORDER_ITEMS : "contains"
PRODUCTS ||--o{ ORDER_ITEMS : "included in"
ORDERS ||--o{ PAYMENTS : "receives"
PRODUCTS ||--o{ PRODUCT_PRICE_HISTORY : "tracks changes in"

MANUFACTURERS {
  uuid id PK
  string name
  string phone
  string address
  string notes
  timestamp created_at
}

BUYERS {
  uuid id PK
  string name
  string phone
  string address
  string gst_number
  string notes
  timestamp created_at
}

PRODUCTS {
  uuid id PK
  uuid manufacturer_id FK
  string name
  string unit
  decimal mfr_price
  decimal sell_price
  boolean is_active
  timestamp updated_at
}

PRODUCT_PRICE_HISTORY {
  uuid id PK
  uuid product_id FK
  decimal old_mfr_price
  decimal new_mfr_price
  decimal old_sell_price
  decimal new_sell_price
  string reason
  timestamp changed_at
}

ORDERS {
  uuid id PK
  uuid manufacturer_id FK
  uuid buyer_id FK
  date order_date
  string status
  string payment_type
  int installment_count
  string notes
  timestamp created_at
}

ORDER_ITEMS {
  uuid id PK
  uuid order_id FK
  uuid product_id FK
  decimal quantity
  decimal mfr_price_snapshot
  decimal sell_price_snapshot
  decimal commission_snapshot
}

PAYMENTS {
  uuid id PK
  uuid order_id FK
  decimal amount
  date payment_date
  string payment_mode
  string paid_by
  string notes
}
```

### Price history trigger behaviour

When the user edits a product's mfr_price or sell_price, the app must **before overwriting**:
1. Write a row to `product_price_history` capturing `old_mfr_price`, `new_mfr_price`, `old_sell_price`, `new_sell_price`, `changed_at`, and an optional `reason`.
2. Then update the `products` row with the new prices.

The `products` table always holds the **current active rate**. `product_price_history` holds the full audit trail. The `reason` field is optional but should be surfaced in the UI — it lets the user note things like "Manufacturer increased cotton costs — March 2025", giving a readable log over months and years, not just raw numbers.

This logic must live in a server action or API route, **never** client-side. Use a Supabase transaction or RPC function to ensure both writes are atomic.

---

## Services and accounts required

Exactly three external accounts are needed. Nothing else.

### 1. GitHub — github.com
Code repository. Create one **private** repository (suggested name: `peout`). Vercel connects directly to this repo — every push to `main` auto-deploys the live app.

### 2. Supabase — supabase.com
Sign up using GitHub OAuth (smoother Vercel integration later).
- Create one project, name it `peout`
- Region: **ap-south-1** (AWS Mumbai — closest to Kolkata, lowest latency)
- Save the database password securely
- Free tier: 1 active project, 500MB storage, 50,000 monthly auth sessions — more than sufficient for a single-user app
- Supabase Auth handles password-reset emails on the free tier — no separate email service needed

### 3. Vercel — vercel.com
Sign up using GitHub OAuth.
- Import the GitHub repo from the Vercel dashboard when ready to deploy
- Free Hobby plan is permanent and sufficient for a private single-user app
- Provides HTTPS, custom domain support, automatic preview deployments

**That is the complete list.** No email service, no CDN, no payment processor, no analytics platform, no third-party anything beyond these three.

---

## Reference screenshots

The `/designs` folder (if present) contains 14 reference screenshots showing the intended visual output for every screen. Treat these as the design source of truth for layout, spacing, typography weight, and color application. The code must match these closely.

Screens available:
- `01___Login.png`
- `02___Dashboard.png`
- `03___Orders_list.png`
- `04___Create_order.png`
- `05___Order_detail.png`
- `06___Manufacturers.png`
- `07___Manufacturer_detail.png`
- `08___Buyers.png`
- `09___Buyer_detail.png`
- `10___Products.png`
- `11___Price_history__drawer_.png`
- `12___Payments.png`
- `13___PDF_export_preview.png`
- `14___Mobile__bonus_.png`
