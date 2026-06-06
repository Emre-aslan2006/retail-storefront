# retail-storefront

> Full-stack retail storefront + owner dashboard — React, Supabase, Tailwind, Vercel

## 🔗 Live Demo

**[retail-storefront.vercel.app](https://retail-storefront.vercel.app)**

Browse 15 seeded products, add to cart, and place a click-and-collect order.

**Admin dashboard:** [retail-storefront.vercel.app/admin/login](https://retail-storefront.vercel.app/admin/login)
- Email: `demo@shop.com`
- Password: `demo1234`

> **Note:** The demo database is shared and open. Orders you place are visible to anyone using the admin demo login. Product stock is real (it decrements when orders are placed). Have fun testing the race-condition guard — try placing two orders for the last item at the same time.

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| Database | Supabase (Postgres) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Hosting | Vercel |
| Emails | Resend (optional) |

## Features

### Customer Storefront
- Product grid with search (debounced) + category filter pills
- URL reflects filter state (shareable/refreshable links)
- All four async states: skeleton loading, empty, error, results
- Product detail with quantity stepper
- Cart with localStorage persistence + stock re-check on mount
- Checkout form with validation
- Order confirmation page with live status polling

### Owner Dashboard (`/admin`)
- Stat cards: orders today, revenue today, pending count
- Pending orders list with one-click "Mark ready" (optimistic update)
- Low-stock panel
- Supabase Realtime subscription — new orders appear live
- Order management: status transitions, cancel with stock restore
- Product CRUD with image upload → Supabase Storage
- Inline stock editing

### Technical highlights
- **Money as integers** — prices stored as pence, formatted only at render
- **Atomic stock check** — `place_order` Postgres function uses `SELECT ... FOR UPDATE` to prevent race conditions
- **Soft-delete** for products — `is_active = false` hides from store, preserves order history
- **RLS everywhere** — products publicly readable, orders publicly insertable but only auth-readable

## Quick start

```bash
git clone https://github.com/Emre-aslan2006/retail-storefront.git
cd retail-storefront
npm install
cp .env.example .env.local
# Fill in your Supabase keys in .env.local
npm run dev
```

## Environment variables

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Database setup

1. Create a project at [supabase.com](https://supabase.com)
2. SQL Editor → run `supabase/schema.sql`
3. SQL Editor → run `supabase/rpc.sql`
4. Storage → create a **public** bucket named `product-images`

## Deploy to Vercel

1. Push to GitHub
2. Import the repo at [vercel.com/new](https://vercel.com/new)
3. Add env vars: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
4. Deploy — `vercel.json` handles SPA routing automatically

## Project structure

```
src/
  components/     Header, ProductCard, SkeletonCard, Toast, ErrorBoundary, ProtectedRoute
  contexts/       CartContext (localStorage + stock refresh), ToastContext
  lib/            supabase.js, helpers.js (formatPrice, debounce, compressImage…)
  pages/
    customer/     Home, ProductDetail, Cart, OrderConfirmation
    admin/        Login, AdminShell, Dashboard, Orders, Products, ProductForm
  App.jsx         Routes + providers
supabase/
  schema.sql      Tables + RLS policies
  rpc.sql         place_order, cancel_order, get_order_for_customer
```
