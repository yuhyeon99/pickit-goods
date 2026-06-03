-- Row Level Security policies for Pickit Goods.
-- Schema, constraints, indexes, and immutable-data triggers are defined in
-- 202606030001_initial_schema.sql.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.prevent_profile_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role is distinct from new.role and not public.is_admin() then
    raise exception 'only admins can update profile role';
  end if;

  return new;
end;
$$;

create trigger prevent_profile_role_escalation
before update on public.profiles
for each row execute function public.prevent_profile_role_escalation();

alter table public.profiles enable row level security;
alter table public.themes enable row level security;
alter table public.reward_items enable row level security;
alter table public.draw_products enable row level security;
alter table public.draw_product_items enable row level security;
alter table public.inventory_units enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.credit_issuances enable row level security;
alter table public.user_draw_credits enable row level security;
alter table public.draw_results enable row level security;
alter table public.draw_logs enable row level security;
alter table public.claim_requests enable row level security;
alter table public.claim_request_items enable row level security;
alter table public.refund_requests enable row level security;
alter table public.faq_items enable row level security;
alter table public.policies enable row level security;

create policy "profiles select own or admin"
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.is_admin());

create policy "profiles insert own"
on public.profiles
for insert
to authenticated
with check (id = auth.uid() and role = 'user');

create policy "profiles update own"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "profiles admin update all"
on public.profiles
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "themes public read active"
on public.themes
for select
to anon, authenticated
using (status = 'active');

create policy "themes admin manage"
on public.themes
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "reward_items public read active"
on public.reward_items
for select
to anon, authenticated
using (status = 'active');

create policy "reward_items admin manage"
on public.reward_items
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "draw_products public read visible"
on public.draw_products
for select
to anon, authenticated
using (status in ('active', 'sold_out'));

create policy "draw_products admin manage"
on public.draw_products
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "draw_product_items public read visible products"
on public.draw_product_items
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.draw_products dp
    where dp.id = draw_product_id
      and dp.status in ('active', 'sold_out')
  )
);

create policy "draw_product_items admin manage"
on public.draw_product_items
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "inventory_units admin read"
on public.inventory_units
for select
to authenticated
using (public.is_admin());

create policy "inventory_units public read available visible products"
on public.inventory_units
for select
to anon, authenticated
using (
  status = 'available'
  and exists (
    select 1
    from public.draw_products dp
    where dp.id = draw_product_id
      and dp.status in ('active', 'sold_out')
  )
);

create policy "inventory_units admin insert"
on public.inventory_units
for insert
to authenticated
with check (public.is_admin());

create policy "inventory_units admin update not drawn"
on public.inventory_units
for update
to authenticated
using (public.is_admin() and status not in ('drawn', 'claimed'))
with check (public.is_admin());

create policy "inventory_units admin delete not drawn"
on public.inventory_units
for delete
to authenticated
using (public.is_admin() and status not in ('drawn', 'claimed'));

create policy "cart_items manage own"
on public.cart_items
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "cart_items admin read"
on public.cart_items
for select
to authenticated
using (public.is_admin());

create policy "orders read own"
on public.orders
for select
to authenticated
using (user_id = auth.uid());

create policy "orders insert own pending"
on public.orders
for insert
to authenticated
with check (user_id = auth.uid() and status = 'pending');

create policy "orders admin manage"
on public.orders
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "order_items read own order"
on public.order_items
for select
to authenticated
using (
  exists (
    select 1
    from public.orders o
    where o.id = order_id
      and o.user_id = auth.uid()
  )
);

create policy "order_items admin manage"
on public.order_items
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "credit_issuances read own"
on public.credit_issuances
for select
to authenticated
using (user_id = auth.uid());

create policy "credit_issuances admin read"
on public.credit_issuances
for select
to authenticated
using (public.is_admin());

create policy "user_draw_credits read own"
on public.user_draw_credits
for select
to authenticated
using (user_id = auth.uid());

create policy "user_draw_credits admin read"
on public.user_draw_credits
for select
to authenticated
using (public.is_admin());

create policy "draw_results read own"
on public.draw_results
for select
to authenticated
using (user_id = auth.uid());

create policy "draw_results admin read"
on public.draw_results
for select
to authenticated
using (public.is_admin());

create policy "draw_logs admin read"
on public.draw_logs
for select
to authenticated
using (public.is_admin());

create policy "claim_requests read own"
on public.claim_requests
for select
to authenticated
using (user_id = auth.uid());

create policy "claim_requests insert own"
on public.claim_requests
for insert
to authenticated
with check (user_id = auth.uid() and status = 'requested');

create policy "claim_requests cancel own requested"
on public.claim_requests
for update
to authenticated
using (user_id = auth.uid() and status = 'requested')
with check (user_id = auth.uid() and status = 'canceled');

create policy "claim_requests admin manage"
on public.claim_requests
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "claim_request_items read own claim"
on public.claim_request_items
for select
to authenticated
using (
  exists (
    select 1
    from public.claim_requests cr
    where cr.id = claim_request_id
      and cr.user_id = auth.uid()
  )
);

create policy "claim_request_items admin read"
on public.claim_request_items
for select
to authenticated
using (public.is_admin());

create policy "refund_requests read own"
on public.refund_requests
for select
to authenticated
using (user_id = auth.uid());

create policy "refund_requests insert own"
on public.refund_requests
for insert
to authenticated
with check (user_id = auth.uid() and status = 'requested');

create policy "refund_requests cancel own requested"
on public.refund_requests
for update
to authenticated
using (user_id = auth.uid() and status = 'requested')
with check (user_id = auth.uid() and status = 'canceled');

create policy "refund_requests admin manage"
on public.refund_requests
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "faq_items public read published"
on public.faq_items
for select
to anon, authenticated
using (status = 'published');

create policy "faq_items admin manage"
on public.faq_items
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "policies public read published"
on public.policies
for select
to anon, authenticated
using (status = 'published' and is_published = true);

create policy "policies admin manage"
on public.policies
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
