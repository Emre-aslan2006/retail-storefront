-- ============================================================
-- RPC FUNCTIONS
-- Run this in the Supabase SQL editor AFTER schema.sql
-- ============================================================

-- ============================================================
-- place_order(items, customer info)
-- Atomically checks stock, decrements, inserts order + items.
-- Returns the new order id (uuid).
-- This is the "two people bought the last one" race-condition guard.
-- ============================================================
create or replace function place_order(
  p_items  jsonb,        -- [{ product_id, product_name, unit_price_pence, quantity }]
  p_name   text,
  p_email  text,
  p_phone  text default null,
  p_note   text default null
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_order_id   uuid;
  v_total      integer := 0;
  v_item       jsonb;
  v_product_id uuid;
  v_quantity   integer;
  v_price      integer;
  v_stock      integer;
  v_name       text;
begin
  -- Validate each item and check stock INSIDE the transaction
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity   := (v_item->>'quantity')::integer;
    v_price      := (v_item->>'unit_price_pence')::integer;
    v_name       := v_item->>'product_name';

    -- Lock the product row to prevent concurrent sales
    select stock into v_stock
    from products
    where id = v_product_id
    for update;

    if not found then
      raise exception 'Product not found: %', v_product_id;
    end if;

    if v_stock < v_quantity then
      raise exception 'Insufficient stock for "%". Available: %, requested: %',
        v_name, v_stock, v_quantity;
    end if;

    -- Decrement stock
    update products
    set stock = stock - v_quantity
    where id = v_product_id;

    v_total := v_total + (v_price * v_quantity);
  end loop;

  -- Insert order
  insert into orders (customer_name, customer_email, customer_phone, status, total_pence, note)
  values (p_name, p_email, p_phone, 'pending', v_total, p_note)
  returning id into v_order_id;

  -- Insert order items
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    insert into order_items (order_id, product_id, product_name, unit_price_pence, quantity)
    values (
      v_order_id,
      (v_item->>'product_id')::uuid,
      v_item->>'product_name',
      (v_item->>'unit_price_pence')::integer,
      (v_item->>'quantity')::integer
    );
  end loop;

  return v_order_id;
end;
$$;


-- ============================================================
-- cancel_order(order_id)
-- Cancels an order and restores stock. Transactional.
-- ============================================================
create or replace function cancel_order(p_order_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_item record;
begin
  -- Check it's not already cancelled/collected
  if not exists (
    select 1 from orders
    where id = p_order_id and status not in ('collected', 'cancelled')
  ) then
    raise exception 'Order cannot be cancelled (already % or does not exist)',
      (select status from orders where id = p_order_id);
  end if;

  -- Restore stock for each item
  for v_item in
    select product_id, quantity from order_items where order_id = p_order_id
  loop
    if v_item.product_id is not null then
      update products
      set stock = stock + v_item.quantity
      where id = v_item.product_id;
    end if;
  end loop;

  -- Update order status
  update orders set status = 'cancelled' where id = p_order_id;
end;
$$;


-- ============================================================
-- get_order_for_customer(order_id)
-- Returns order + items by UUID. Used on the confirmation page.
-- Bypasses RLS (security definer) but only exposes what's needed.
-- The unguessable UUID is the security layer.
-- ============================================================
create or replace function get_order_for_customer(p_order_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_order  jsonb;
  v_items  jsonb;
begin
  select to_jsonb(o) into v_order
  from orders o
  where o.id = p_order_id;

  if v_order is null then
    return null;
  end if;

  select jsonb_agg(to_jsonb(i)) into v_items
  from order_items i
  where i.order_id = p_order_id;

  return jsonb_build_object(
    'order', v_order,
    'items', coalesce(v_items, '[]'::jsonb)
  );
end;
$$;

-- Grant execute to anon so the confirmation page can call it
grant execute on function get_order_for_customer(uuid) to anon;
grant execute on function place_order(jsonb, text, text, text, text) to anon;
