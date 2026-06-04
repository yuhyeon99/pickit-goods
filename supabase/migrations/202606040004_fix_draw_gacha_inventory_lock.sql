-- Make gacha draw inventory selection less prone to false SKIP LOCKED failures.
-- Product-level advisory locking serializes draws per product while keeping row locks for integrity.

create or replace function public.draw_gacha(p_draw_product_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_credit public.user_draw_credits%rowtype;
  v_inventory public.inventory_units%rowtype;
  v_product public.draw_products%rowtype;
  v_reward public.reward_items%rowtype;
  v_theme_name text;
  v_available_inventory_count integer := 0;
  v_request_id text := gen_random_uuid()::text;
  v_nonce text := gen_random_uuid()::text;
  v_random_seed_hash text;
  v_inventory_snapshot_hash text;
  v_public_verify_code text;
  v_draw_result_id uuid;
begin
  if v_user_id is null then
    raise exception '로그인이 필요합니다.';
  end if;

  perform pg_advisory_xact_lock(hashtext(p_draw_product_id::text));

  select *
  into v_product
  from public.draw_products
  where id = p_draw_product_id
    and type = 'gacha'
    and status in ('active', 'sold_out')
  for update;

  if not found then
    raise exception '가챠 상품을 찾을 수 없거나 현재 뽑기를 진행할 수 없습니다.';
  end if;

  select *
  into v_credit
  from public.user_draw_credits
  where user_id = v_user_id
    and draw_product_id = p_draw_product_id
    and type = 'gacha'
    and status = 'unused'
  order by created_at asc, id asc
  limit 1
  for update;

  if not found then
    raise exception '사용 가능한 가챠권이 없습니다.';
  end if;

  select count(*)
  into v_available_inventory_count
  from public.inventory_units
  where draw_product_id = p_draw_product_id
    and status = 'available';

  if v_available_inventory_count <= 0 then
    raise exception '남은 재고가 없어 뽑기를 진행할 수 없습니다.';
  end if;

  v_random_seed_hash := encode(digest(v_nonce || ':' || v_request_id || ':' || v_user_id::text, 'sha256'), 'hex');
  v_inventory_snapshot_hash := encode(
    digest(p_draw_product_id::text || ':' || v_available_inventory_count::text, 'sha256'),
    'hex'
  );

  insert into public.draw_logs (
    user_id,
    draw_credit_id,
    draw_product_id,
    request_id,
    event_type,
    random_method,
    random_seed_hash,
    available_inventory_count,
    inventory_snapshot_hash,
    payload
  )
  values (
    v_user_id,
    v_credit.id,
    p_draw_product_id,
    v_request_id,
    'started',
    'product advisory lock + order by gen_random_uuid()',
    v_random_seed_hash,
    v_available_inventory_count,
    v_inventory_snapshot_hash,
    jsonb_build_object('draw_product_id', p_draw_product_id)
  );

  select *
  into v_inventory
  from public.inventory_units
  where draw_product_id = p_draw_product_id
    and status = 'available'
  order by gen_random_uuid()
  limit 1
  for update;

  if not found then
    raise exception '남은 재고를 확보하지 못했습니다. 다시 시도해주세요.';
  end if;

  select *
  into v_reward
  from public.reward_items
  where id = v_inventory.reward_item_id;

  if not found then
    raise exception '당첨 상품 정보를 찾을 수 없습니다.';
  end if;

  select t.name
  into v_theme_name
  from public.themes t
  where t.id = v_reward.theme_id;

  v_public_verify_code := upper(substr(encode(digest(v_request_id || ':' || v_inventory.id::text, 'sha256'), 'hex'), 1, 16));

  update public.user_draw_credits
  set status = 'used',
      used_at = now()
  where id = v_credit.id;

  insert into public.draw_results (
    user_id,
    draw_credit_id,
    draw_product_id,
    inventory_unit_id,
    reward_item_id,
    type,
    grade,
    status,
    public_verify_code
  )
  values (
    v_user_id,
    v_credit.id,
    p_draw_product_id,
    v_inventory.id,
    v_inventory.reward_item_id,
    'gacha',
    v_inventory.grade,
    'completed',
    v_public_verify_code
  )
  returning id into v_draw_result_id;

  update public.inventory_units
  set status = 'drawn',
      drawn_by = v_user_id,
      drawn_at = now(),
      draw_result_id = v_draw_result_id
  where id = v_inventory.id;

  insert into public.draw_logs (
    draw_result_id,
    user_id,
    draw_credit_id,
    draw_product_id,
    request_id,
    event_type,
    random_method,
    random_seed_hash,
    available_inventory_count,
    inventory_snapshot_hash,
    selected_inventory_unit_id,
    payload
  )
  values (
    v_draw_result_id,
    v_user_id,
    v_credit.id,
    p_draw_product_id,
    v_request_id,
    'completed',
    'product advisory lock + order by gen_random_uuid()',
    v_random_seed_hash,
    v_available_inventory_count,
    v_inventory_snapshot_hash,
    v_inventory.id,
    jsonb_build_object(
      'reward_item_id', v_reward.id,
      'grade', v_inventory.grade,
      'public_verify_code', v_public_verify_code
    )
  );

  return jsonb_build_object(
    'draw_result_id', v_draw_result_id,
    'draw_credit_id', v_credit.id,
    'draw_product_id', p_draw_product_id,
    'inventory_unit_id', v_inventory.id,
    'reward_item_id', v_reward.id,
    'reward_name', v_reward.name,
    'reward_description', v_reward.description,
    'reward_grade', v_inventory.grade,
    'reward_category', v_reward.category,
    'theme_name', v_theme_name,
    'public_verify_code', v_public_verify_code,
    'request_id', v_request_id,
    'created_at', now()
  );
end;
$$;

revoke all on function public.draw_gacha(uuid) from public;
grant execute on function public.draw_gacha(uuid) to authenticated;
