-- ============================================================
-- RETAIL STOREFRONT DATABASE SCHEMA
-- Run this in the Supabase SQL editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ============================================================
-- PRODUCTS
-- ============================================================
create table if not exists products (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  description  text,
  price_pence  integer not null check (price_pence >= 0),
  stock        integer not null default 0 check (stock >= 0),
  category     text,
  image_url    text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

-- ============================================================
-- ORDERS
-- ============================================================
create table if not exists orders (
  id              uuid primary key default gen_random_uuid(),
  customer_name   text not null,
  customer_email  text not null,
  customer_phone  text,
  status          text not null default 'pending'
                  check (status in ('pending','ready','collected','cancelled')),
  total_pence     integer not null default 0,
  note            text,
  created_at      timestamptz not null default now()
);

-- ============================================================
-- ORDER ITEMS
-- ============================================================
create table if not exists order_items (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid not null references orders(id) on delete cascade,
  product_id        uuid references products(id) on delete set null,
  product_name      text not null,   -- snapshot
  unit_price_pence  integer not null, -- snapshot
  quantity          integer not null check (quantity > 0)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Products: public can read active ones; only auth can write
alter table products enable row level security;

create policy "Public can view active products"
  on products for select
  using (is_active = true);

create policy "Auth users can manage products"
  on products for all
  to authenticated
  using (true)
  with check (true);

-- Orders: anyone can INSERT; only auth can SELECT/UPDATE
alter table orders enable row level security;

create policy "Anyone can place an order"
  on orders for insert
  with check (true);

create policy "Auth users can view and update orders"
  on orders for select
  to authenticated
  using (true);

create policy "Auth users can update orders"
  on orders for update
  to authenticated
  using (true)
  with check (true);

-- Order items: anyone can insert (part of placing order); auth can view
alter table order_items enable row level security;

create policy "Anyone can insert order items"
  on order_items for insert
  with check (true);

create policy "Auth users can view order items"
  on order_items for select
  to authenticated
  using (true);

-- ============================================================
-- STORAGE BUCKET
-- ============================================================
-- Run in Supabase Dashboard → Storage → New bucket named "product-images"
-- Set to public with the following policy:

-- Allow public reads:
-- (storage.bucket_id = 'product-images')

-- Allow authenticated uploads:
-- (auth.role() = 'authenticated' AND storage.bucket_id = 'product-images')
