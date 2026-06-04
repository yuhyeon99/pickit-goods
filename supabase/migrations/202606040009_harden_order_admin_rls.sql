-- Restrict admin order access to read-only for the current MVP.
-- Checkout/order creation remains handled by checkout_cart().

drop policy if exists "orders admin manage" on public.orders;
drop policy if exists "order_items admin manage" on public.order_items;

create policy "orders admin read"
on public.orders
for select
to authenticated
using (public.is_admin());

create policy "order_items admin read"
on public.order_items
for select
to authenticated
using (public.is_admin());
