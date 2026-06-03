-- Initial schema for Pickit Goods.
-- RLS policies are defined in 202606030002_rls_policies.sql.

create extension if not exists pgcrypto;

create type public.user_role as enum ('user', 'admin');
create type public.visibility_status as enum ('active', 'hidden', 'archived');
create type public.draw_product_type as enum ('gacha', 'ticket');
create type public.draw_product_scope as enum ('random', 'theme');
create type public.draw_product_status as enum ('draft', 'active', 'sold_out', 'hidden', 'archived');
create type public.reward_grade as enum ('S', 'A', 'B', 'C');
create type public.inventory_status as enum ('available', 'reserved', 'drawn', 'claimed', 'void');
create type public.order_status as enum ('pending', 'paid', 'canceled', 'refund_requested', 'refunded');
create type public.credit_status as enum ('unused', 'used', 'expired', 'refunded', 'failed');
create type public.draw_result_status as enum ('completed', 'recoverable', 'failed', 'claimed');
create type public.draw_log_event_type as enum ('started', 'reserved', 'completed', 'failed', 'recovered');
create type public.claim_method as enum ('delivery', 'pickup');
create type public.claim_status as enum ('requested', 'preparing', 'ready_for_pickup', 'shipping', 'completed', 'canceled');
create type public.refund_status as enum ('requested', 'approved', 'rejected', 'canceled', 'processed');
create type public.content_status as enum ('draft', 'published', 'hidden', 'archived');
create type public.faq_status as enum ('draft', 'published', 'hidden');
create type public.policy_type as enum ('refund', 'exchange', 'shipping', 'fairness', 'usage');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  role public.user_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.themes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  thumbnail_url text,
  status public.visibility_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reward_items (
  id uuid primary key default gen_random_uuid(),
  theme_id uuid references public.themes(id) on delete set null,
  name text not null,
  description text,
  image_url text,
  grade public.reward_grade not null,
  category text not null,
  status public.visibility_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.draw_products (
  id uuid primary key default gen_random_uuid(),
  type public.draw_product_type not null,
  scope public.draw_product_scope not null,
  theme_id uuid references public.themes(id) on delete set null,
  title text not null,
  description text,
  price integer not null check (price >= 0),
  credit_amount integer not null check (credit_amount > 0),
  sales_limit integer not null default 100 check (sales_limit > 0),
  sold_count integer not null default 0 check (sold_count >= 0),
  status public.draw_product_status not null default 'draft',
  thumbnail_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint draw_products_theme_scope_check check (
    (scope = 'random' and theme_id is null)
    or
    (scope = 'theme' and theme_id is not null)
  ),
  constraint draw_products_sold_count_limit_check check (sold_count <= sales_limit)
);

create table public.draw_product_items (
  id uuid primary key default gen_random_uuid(),
  draw_product_id uuid not null references public.draw_products(id) on delete cascade,
  reward_item_id uuid not null references public.reward_items(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now(),
  unique (draw_product_id, reward_item_id)
);

create table public.inventory_units (
  id uuid primary key default gen_random_uuid(),
  draw_product_id uuid not null references public.draw_products(id) on delete restrict,
  reward_item_id uuid not null references public.reward_items(id) on delete restrict,
  grade public.reward_grade not null,
  status public.inventory_status not null default 'available',
  reserved_by uuid references public.profiles(id) on delete set null,
  drawn_by uuid references public.profiles(id) on delete set null,
  draw_result_id uuid,
  created_at timestamptz not null default now(),
  reserved_at timestamptz,
  drawn_at timestamptz,
  claimed_at timestamptz,
  constraint inventory_reserved_state_check check (
    (status = 'reserved' and reserved_by is not null and reserved_at is not null)
    or status <> 'reserved'
  ),
  constraint inventory_drawn_state_check check (
    (status in ('drawn', 'claimed') and drawn_by is not null and drawn_at is not null)
    or status not in ('drawn', 'claimed')
  ),
  constraint inventory_claimed_state_check check (
    (status = 'claimed' and claimed_at is not null)
    or status <> 'claimed'
  )
);

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  draw_product_id uuid not null references public.draw_products(id) on delete cascade,
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, draw_product_id)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete restrict,
  status public.order_status not null default 'pending',
  total_amount integer not null default 0 check (total_amount >= 0),
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  canceled_at timestamptz
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  draw_product_id uuid not null references public.draw_products(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_price integer not null check (unit_price >= 0),
  credit_amount integer not null check (credit_amount > 0),
  created_at timestamptz not null default now()
);

create table public.credit_issuances (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  order_item_id uuid not null references public.order_items(id) on delete restrict,
  user_id uuid not null references public.profiles(id) on delete restrict,
  draw_product_id uuid not null references public.draw_products(id) on delete restrict,
  issued_quantity integer not null check (issued_quantity > 0),
  created_at timestamptz not null default now(),
  unique (order_item_id)
);

create table public.user_draw_credits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete restrict,
  order_id uuid references public.orders(id) on delete set null,
  draw_product_id uuid not null references public.draw_products(id) on delete restrict,
  type public.draw_product_type not null,
  status public.credit_status not null default 'unused',
  used_at timestamptz,
  refunded_at timestamptz,
  created_at timestamptz not null default now(),
  constraint user_draw_credits_used_at_check check (
    (status = 'used' and used_at is not null)
    or status <> 'used'
  ),
  constraint user_draw_credits_refunded_at_check check (
    (status = 'refunded' and refunded_at is not null)
    or status <> 'refunded'
  )
);

create table public.draw_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete restrict,
  draw_credit_id uuid not null references public.user_draw_credits(id) on delete restrict,
  draw_product_id uuid not null references public.draw_products(id) on delete restrict,
  inventory_unit_id uuid not null references public.inventory_units(id) on delete restrict,
  reward_item_id uuid not null references public.reward_items(id) on delete restrict,
  type public.draw_product_type not null,
  ticket_slot_no integer check (ticket_slot_no is null or ticket_slot_no > 0),
  grade public.reward_grade not null,
  status public.draw_result_status not null default 'completed',
  public_verify_code text not null,
  created_at timestamptz not null default now(),
  unique (draw_credit_id),
  unique (inventory_unit_id),
  unique (public_verify_code)
);

alter table public.inventory_units
  add constraint inventory_units_draw_result_id_fkey
  foreign key (draw_result_id)
  references public.draw_results(id)
  on delete restrict;

alter table public.inventory_units
  add constraint inventory_draw_result_unique unique (draw_result_id);

create table public.draw_logs (
  id uuid primary key default gen_random_uuid(),
  draw_result_id uuid references public.draw_results(id) on delete restrict,
  user_id uuid not null references public.profiles(id) on delete restrict,
  draw_credit_id uuid references public.user_draw_credits(id) on delete restrict,
  draw_product_id uuid references public.draw_products(id) on delete restrict,
  request_id text not null,
  event_type public.draw_log_event_type not null,
  random_method text,
  random_seed_hash text,
  available_inventory_count integer check (available_inventory_count is null or available_inventory_count >= 0),
  inventory_snapshot_hash text,
  selected_inventory_unit_id uuid references public.inventory_units(id) on delete restrict,
  payload jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  unique (request_id, event_type)
);

create table public.claim_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete restrict,
  claim_method public.claim_method not null,
  status public.claim_status not null default 'requested',
  recipient_name text,
  recipient_phone text,
  postal_code text,
  address1 text,
  address2 text,
  pickup_qr_code text,
  tracking_number text,
  courier_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint claim_delivery_fields_check check (
    claim_method <> 'delivery'
    or (recipient_name is not null and recipient_phone is not null and postal_code is not null and address1 is not null)
  ),
  constraint claim_pickup_no_shipping_fields_check check (
    claim_method <> 'pickup'
    or (tracking_number is null and courier_name is null)
  )
);

create table public.claim_request_items (
  id uuid primary key default gen_random_uuid(),
  claim_request_id uuid not null references public.claim_requests(id) on delete cascade,
  draw_result_id uuid not null references public.draw_results(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (draw_result_id)
);

create table public.refund_requests (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  user_id uuid not null references public.profiles(id) on delete restrict,
  reason text not null,
  status public.refund_status not null default 'requested',
  admin_note text,
  requested_at timestamptz not null default now(),
  processed_at timestamptz
);

create table public.faq_items (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  question text not null,
  answer text not null,
  status public.faq_status not null default 'draft',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.policies (
  id uuid primary key default gen_random_uuid(),
  type public.policy_type not null,
  slug text not null,
  title text not null,
  content text not null,
  status public.content_status not null default 'draft',
  sort_order integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (slug)
);

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger set_themes_updated_at
before update on public.themes
for each row execute function public.set_updated_at();

create trigger set_reward_items_updated_at
before update on public.reward_items
for each row execute function public.set_updated_at();

create trigger set_draw_products_updated_at
before update on public.draw_products
for each row execute function public.set_updated_at();

create trigger set_cart_items_updated_at
before update on public.cart_items
for each row execute function public.set_updated_at();

create trigger set_claim_requests_updated_at
before update on public.claim_requests
for each row execute function public.set_updated_at();

create trigger set_faq_items_updated_at
before update on public.faq_items
for each row execute function public.set_updated_at();

create trigger set_policies_updated_at
before update on public.policies
for each row execute function public.set_updated_at();

create or replace function public.prevent_draw_results_arbitrary_mutation()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'draw_results cannot be deleted';
  end if;

  if tg_op = 'UPDATE' then
    if old.status = 'completed'
       and new.status = 'claimed'
       and new.id = old.id
       and new.user_id = old.user_id
       and new.draw_credit_id = old.draw_credit_id
       and new.draw_product_id = old.draw_product_id
       and new.inventory_unit_id = old.inventory_unit_id
       and new.reward_item_id = old.reward_item_id
       and new.type = old.type
       and new.ticket_slot_no is not distinct from old.ticket_slot_no
       and new.grade = old.grade
       and new.public_verify_code = old.public_verify_code
       and new.created_at = old.created_at then
      return new;
    end if;

    raise exception 'draw_results cannot be updated except completed to claimed status transition';
  end if;

  return new;
end;
$$;

create trigger prevent_draw_results_arbitrary_mutation
before update or delete on public.draw_results
for each row execute function public.prevent_draw_results_arbitrary_mutation();

create or replace function public.prevent_draw_logs_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'draw_logs are append-only';
end;
$$;

create trigger prevent_draw_logs_mutation
before update or delete on public.draw_logs
for each row execute function public.prevent_draw_logs_mutation();

create or replace function public.prevent_drawn_inventory_result_mutation()
returns trigger
language plpgsql
as $$
begin
  if old.status in ('drawn', 'claimed') then
    if old.status = 'drawn'
       and new.status = 'claimed'
       and new.claimed_at is not null
       and new.id = old.id
       and new.draw_product_id = old.draw_product_id
       and new.reward_item_id = old.reward_item_id
       and new.grade = old.grade
       and new.reserved_by is not distinct from old.reserved_by
       and new.drawn_by is not distinct from old.drawn_by
       and new.draw_result_id is not distinct from old.draw_result_id
       and new.created_at = old.created_at
       and new.reserved_at is not distinct from old.reserved_at
       and new.drawn_at is not distinct from old.drawn_at then
      return new;
    end if;

    if new.status is distinct from old.status
       or new.drawn_by is distinct from old.drawn_by
       or new.draw_result_id is distinct from old.draw_result_id
       or new.reward_item_id is distinct from old.reward_item_id
       or new.draw_product_id is distinct from old.draw_product_id
       or new.grade is distinct from old.grade
       or new.drawn_at is distinct from old.drawn_at then
      raise exception 'drawn inventory result fields cannot be modified';
    end if;
  end if;

  return new;
end;
$$;

create trigger prevent_drawn_inventory_result_mutation
before update on public.inventory_units
for each row execute function public.prevent_drawn_inventory_result_mutation();

create index themes_status_idx on public.themes(status);
create index reward_items_theme_id_idx on public.reward_items(theme_id);
create index reward_items_status_grade_idx on public.reward_items(status, grade);
create index draw_products_type_status_idx on public.draw_products(type, status);
create index draw_products_theme_id_idx on public.draw_products(theme_id);
create index draw_product_items_product_id_idx on public.draw_product_items(draw_product_id);
create index draw_product_items_reward_item_id_idx on public.draw_product_items(reward_item_id);
create index inventory_units_product_status_idx on public.inventory_units(draw_product_id, status);
create index inventory_units_product_grade_status_idx on public.inventory_units(draw_product_id, grade, status);
create index inventory_units_reward_item_id_idx on public.inventory_units(reward_item_id);
create index inventory_units_drawn_by_idx on public.inventory_units(drawn_by);
create index cart_items_user_id_idx on public.cart_items(user_id);
create index orders_user_status_idx on public.orders(user_id, status);
create index order_items_order_id_idx on public.order_items(order_id);
create index credit_issuances_user_id_idx on public.credit_issuances(user_id);
create index user_draw_credits_user_status_idx on public.user_draw_credits(user_id, status);
create index user_draw_credits_product_status_idx on public.user_draw_credits(draw_product_id, status);
create index draw_results_user_created_idx on public.draw_results(user_id, created_at desc);
create index draw_results_product_created_idx on public.draw_results(draw_product_id, created_at desc);
create index draw_logs_result_id_idx on public.draw_logs(draw_result_id);
create index draw_logs_user_created_idx on public.draw_logs(user_id, created_at desc);
create index draw_logs_product_created_idx on public.draw_logs(draw_product_id, created_at desc);
create index draw_logs_selected_inventory_unit_id_idx on public.draw_logs(selected_inventory_unit_id);
create index claim_requests_user_status_idx on public.claim_requests(user_id, status);
create index claim_request_items_claim_request_id_idx on public.claim_request_items(claim_request_id);
create index refund_requests_user_status_idx on public.refund_requests(user_id, status);
create index refund_requests_order_id_idx on public.refund_requests(order_id);
create index faq_items_status_sort_idx on public.faq_items(status, sort_order);
create index policies_status_sort_idx on public.policies(status, sort_order);
create index policies_type_status_idx on public.policies(type, status);
