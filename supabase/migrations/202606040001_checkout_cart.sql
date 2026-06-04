-- Test checkout RPC for MVP cart purchases.
-- This function intentionally handles the whole checkout flow in one transaction.

create or replace function public.checkout_cart()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_order_id uuid;
  v_order_item_id uuid;
  v_total_amount integer := 0;
  v_total_quantity integer := 0;
  v_issued_credit_count integer := 0;
  v_cart_count integer := 0;
  v_available_inventory_count integer := 0;
  v_remaining_purchase_quantity integer := 0;
  v_issue_quantity integer := 0;
  v_item record;
begin
  if v_user_id is null then
    raise exception '로그인이 필요합니다.';
  end if;

  if not exists (select 1 from public.profiles where id = v_user_id) then
    raise exception '프로필을 찾을 수 없습니다.';
  end if;

  select count(*)
  into v_cart_count
  from public.cart_items
  where user_id = v_user_id;

  if v_cart_count = 0 then
    raise exception '장바구니가 비어 있습니다.';
  end if;

  insert into public.orders (user_id, status, total_amount, paid_at)
  values (v_user_id, 'paid', 0, now())
  returning id into v_order_id;

  for v_item in
    select
      ci.id as cart_item_id,
      ci.quantity,
      dp.id as draw_product_id,
      dp.type,
      dp.status,
      dp.price,
      dp.credit_amount,
      dp.sales_limit,
      dp.sold_count
    from public.cart_items ci
    join public.draw_products dp on dp.id = ci.draw_product_id
    where ci.user_id = v_user_id
    order by dp.id
    for update of ci, dp
  loop
    if v_item.type <> 'gacha' then
      raise exception 'MVP에서는 가챠 상품만 테스트 결제할 수 있습니다.';
    end if;

    if v_item.status <> 'active' then
      raise exception '일부 상품은 현재 신규 구매가 불가능합니다. 장바구니를 다시 확인해주세요.';
    end if;

    select count(*)
    into v_available_inventory_count
    from public.inventory_units
    where draw_product_id = v_item.draw_product_id
      and status = 'available';

    v_remaining_purchase_quantity := greatest(
      0,
      least(v_item.sales_limit - v_item.sold_count, v_available_inventory_count)
    );
    v_issue_quantity := v_item.quantity * v_item.credit_amount;

    if v_issue_quantity > v_remaining_purchase_quantity then
      raise exception '일부 상품의 남은 수량이 변경되어 결제를 진행할 수 없습니다. 장바구니 수량을 다시 확인해주세요.';
    end if;

    insert into public.order_items (
      order_id,
      draw_product_id,
      quantity,
      unit_price,
      credit_amount
    )
    values (
      v_order_id,
      v_item.draw_product_id,
      v_item.quantity,
      v_item.price,
      v_item.credit_amount
    )
    returning id into v_order_item_id;

    insert into public.user_draw_credits (
      user_id,
      order_id,
      draw_product_id,
      type,
      status
    )
    select
      v_user_id,
      v_order_id,
      v_item.draw_product_id,
      v_item.type,
      'unused'
    from generate_series(1, v_issue_quantity);

    insert into public.credit_issuances (
      order_id,
      order_item_id,
      user_id,
      draw_product_id,
      issued_quantity
    )
    values (
      v_order_id,
      v_order_item_id,
      v_user_id,
      v_item.draw_product_id,
      v_issue_quantity
    );

    update public.draw_products
    set sold_count = sold_count + v_issue_quantity
    where id = v_item.draw_product_id;

    v_total_amount := v_total_amount + (v_item.quantity * v_item.price);
    v_total_quantity := v_total_quantity + v_item.quantity;
    v_issued_credit_count := v_issued_credit_count + v_issue_quantity;
  end loop;

  update public.orders
  set total_amount = v_total_amount
  where id = v_order_id;

  delete from public.cart_items
  where user_id = v_user_id;

  return jsonb_build_object(
    'order_id', v_order_id,
    'total_amount', v_total_amount,
    'total_quantity', v_total_quantity,
    'issued_credit_count', v_issued_credit_count
  );
end;
$$;

revoke all on function public.checkout_cart() from public;
grant execute on function public.checkout_cart() to authenticated;
