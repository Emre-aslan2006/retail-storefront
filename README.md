# retail-storefront

> Full-stack retail storefront + owner dashboard

One codebase, two experiences: a public storefront for customers and a password-protected /admin dashboard for the shop owner. Both read and write to the same Supabase database.

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
VITE_RESEND_API_KEY=re_your_key   # optional
```

## Database setup

1. Open the Supabase SQL Editor
2. Run `supabase/schema.sql` — creates tables + RLS policies
3. Run `supabase/rpc.sql` — creates `place_order`, `cancel_order`, `get_order_for_customer` functions
4. In Supabase Dashboard → Storage, create a public bucket named `product-images`

## Routes

| URL | Who | What |
|-----|-----|------|
| `/` | Customers | Home / product grid |
| `/product/:id` | Customers | Product detail |
| `/cart` | Customers | Cart + checkout form |
| `/order/:id` | Customers | Order confirmation + status |
| `/admin/login` | Owner | Login screen |
| `/admin` | Owner | Dashboard |
| `/admin/orders` | Owner | All orders |
| `/admin/products` | Owner | Product list |
| `/admin/products/new` | Owner | Add product |
| `/admin/products/:id` | Owner | Edit product |
| `*` | Everyone | 404 page |

## Project structure

```
src/
  components/          Shared UI: Header, ProductCard, SkeletonCard, Toast, ErrorBoundary, ProtectedRoute
  contexts/            CartContext (localStorage), ToastContext
  lib/                 supabase.js, helpers.js (formatPrice, debounce, compressImage...)
  pages/
    customer/          Home, ProductDetail, Cart, OrderConfirmation
    admin/             Login, AdminShell, Dashboard, Orders, Products, ProductForm
  App.jsx              Routes + providers
  main.jsx             Entry point
supabase/
  schema.sql           Tables + RLS
  rpc.sql              place_order, cancel_order, get_order_for_customer
```

## Key technical decisions

**Money as integers** — all prices stored as whole pence (e.g. 1250 = £12.50). The `formatPrice(pence)` helper is the only place that formats for display. Never floats in the database.

**Atomic stock check** — the `place_order` Postgres function uses `SELECT ... FOR UPDATE` to lock product rows inside a transaction, preventing the race condition where two customers buy the last item simultaneously.

**Soft-delete for products** — setting `is_active = false` hides a product from the store but preserves it so old orders still show what was bought (via the `product_name` snapshot in `order_items`).

**Cart persistence** — cart lives in React Context backed by `localStorage`, so it survives page refreshes. On visiting the cart page, current stock is re-fetched for all items and quantities are clamped.

**RLS security model** — products are publicly readable (active only), orders are publicly insertable (anyone can place an order) but only readable by authenticated users. The order confirmation page uses an RPC function (`get_order_for_customer`) that bypasses RLS but only returns the single order matching the unguessable UUID.

## Deploy to Vercel

1. Push to GitHub
2. Import the repo in Vercel
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables
4. Deploy — `vercel.json` handles SPA routing rewrites automatically
