-- Refund request RPCs for unused, unexpired draw credits.
-- Actual PG refund is intentionally not implemented in the MVP.

alter table public.refund_requests
  alter column order_id drop not null;

alter table public.refund_requests
  add column if not exists user_draw_credit_id uuid references public.user_draw_credits(id) on delete restrict,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

drop trigger if exists set_refund_requests_updated_at on public.refund_requests;

create trigger set_refund_requests_updated_at
before update on public.refund_requests
for each row execute function public.set_updated_at();

create index if not exists refund_requests_user_credit_status_idx
on public.refund_requests(user_id, user_draw_credit_id, status);

create unique index if not exists refund_requests_active_credit_unique
on public.refund_requests(user_draw_credit_id)
where status in ('requested', 'approved', 'processed')
  and user_draw_credit_id is not null;

drop policy if exists "refund_requests insert own" on public.refund_requests;
drop policy if exists "refund_requests cancel own requested" on public.refund_requests;
drop policy if exists "refund_requests admin manage" on public.refund_requests;

create policy "refund_requests admin read"
on public.refund_requests
for select
to authenticated
using (public.is_admin());

create or replace function public.create_refund_request(
  p_user_draw_credit_id uuid,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_credit public.user_draw_credits%rowtype;
  v_refund_request_id uuid;
  v_reason text := nullif(trim(coalesce(p_reason, '')), '');
  v_duplicate_count integer := 0;
begin
  if v_user_id is null then
    raise exception '로그인이 필요합니다.';
  end if;

  if v_reason is null then
    raise exception '환불 요청 사유를 입력해주세요.';
  end if;

  select *
  into v_credit
  from public.user_draw_credits
  where id = p_user_draw_credit_id
  for update;

  if not found then
    raise exception '가챠권을 찾을 수 없습니다.';
  end if;

  if v_credit.user_id <> v_user_id then
    raise exception '본인의 가챠권만 환불 요청할 수 있습니다.';
  end if;

  if v_credit.status <> 'unused' then
    raise exception '미사용 가챠권만 환불 요청할 수 있습니다.';
  end if;

  if v_credit.expires_at <= now() then
    raise exception '만료된 가챠권은 환불 요청할 수 없습니다.';
  end if;

  select count(*)
  into v_duplicate_count
  from public.refund_requests
  where user_draw_credit_id = p_user_draw_credit_id
    and status in ('requested', 'approved', 'processed');

  if v_duplicate_count > 0 then
    raise exception '이미 환불 요청 중이거나 환불 처리된 가챠권입니다.';
  end if;

  insert into public.refund_requests (
    order_id,
    user_id,
    user_draw_credit_id,
    reason,
    status,
    requested_at
  )
  values (
    v_credit.order_id,
    v_user_id,
    v_credit.id,
    v_reason,
    'requested',
    now()
  )
  returning id into v_refund_request_id;

  return jsonb_build_object(
    'refund_request_id', v_refund_request_id,
    'user_draw_credit_id', v_credit.id,
    'status', 'requested',
    'requested_at', now()
  );
end;
$$;

revoke all on function public.create_refund_request(uuid, text) from public;
grant execute on function public.create_refund_request(uuid, text) to authenticated;

create or replace function public.cancel_refund_request(
  p_refund_request_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_request public.refund_requests%rowtype;
begin
  if v_user_id is null then
    raise exception '로그인이 필요합니다.';
  end if;

  select *
  into v_request
  from public.refund_requests
  where id = p_refund_request_id
  for update;

  if not found then
    raise exception '환불 요청을 찾을 수 없습니다.';
  end if;

  if v_request.user_id <> v_user_id then
    raise exception '본인의 환불 요청만 취소할 수 있습니다.';
  end if;

  if v_request.status <> 'requested' then
    raise exception '요청됨 상태의 환불 요청만 취소할 수 있습니다.';
  end if;

  update public.refund_requests
  set status = 'canceled'
  where id = p_refund_request_id;

  return jsonb_build_object(
    'refund_request_id', p_refund_request_id,
    'status', 'canceled',
    'updated_at', now()
  );
end;
$$;

revoke all on function public.cancel_refund_request(uuid) from public;
grant execute on function public.cancel_refund_request(uuid) to authenticated;

create or replace function public.update_refund_request_status(
  p_refund_request_id uuid,
  p_next_status public.refund_status,
  p_admin_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_request public.refund_requests%rowtype;
  v_admin_note text := nullif(trim(coalesce(p_admin_note, '')), '');
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다.';
  end if;

  if not public.is_admin() then
    raise exception '관리자 권한이 필요합니다.';
  end if;

  select *
  into v_request
  from public.refund_requests
  where id = p_refund_request_id
  for update;

  if not found then
    raise exception '환불 요청을 찾을 수 없습니다.';
  end if;

  if v_request.status in ('rejected', 'canceled', 'processed') then
    raise exception '이미 종료된 환불 요청은 변경할 수 없습니다.';
  end if;

  if not (
    (v_request.status = 'requested' and p_next_status in ('approved', 'rejected'))
    or (v_request.status = 'approved' and p_next_status in ('processed', 'rejected'))
  ) then
    raise exception '환불 요청 상태 전환이 올바르지 않습니다.';
  end if;

  if p_next_status = 'processed' then
    update public.user_draw_credits
    set status = 'refunded',
        refunded_at = now()
    where id = v_request.user_draw_credit_id
      and user_id = v_request.user_id
      and status = 'unused';

    if not found then
      raise exception '환불 처리할 수 있는 미사용 가챠권을 찾을 수 없습니다.';
    end if;
  end if;

  update public.refund_requests
  set status = p_next_status,
      admin_note = coalesce(v_admin_note, admin_note),
      processed_at = case when p_next_status = 'processed' then now() else processed_at end
  where id = p_refund_request_id;

  return jsonb_build_object(
    'refund_request_id', p_refund_request_id,
    'status', p_next_status,
    'user_draw_credit_id', v_request.user_draw_credit_id,
    'updated_at', now()
  );
end;
$$;

revoke all on function public.update_refund_request_status(uuid, public.refund_status, text) from public;
grant execute on function public.update_refund_request_status(uuid, public.refund_status, text) to authenticated;

create or replace function public.draw_gacha(p_draw_product_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, pg_temp
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

  select udc.*
  into v_credit
  from public.user_draw_credits udc
  where udc.user_id = v_user_id
    and udc.draw_product_id = p_draw_product_id
    and udc.type = 'gacha'
    and udc.status = 'unused'
    and udc.expires_at > now()
    and not exists (
      select 1
      from public.refund_requests rr
      where rr.user_draw_credit_id = udc.id
        and rr.status in ('requested', 'approved', 'processed')
    )
  order by udc.created_at asc, udc.id asc
  limit 1
  for update of udc;

  if not found then
    if exists (
      select 1
      from public.user_draw_credits
      where user_id = v_user_id
        and draw_product_id = p_draw_product_id
        and type = 'gacha'
        and status = 'unused'
        and expires_at <= now()
    ) then
      raise exception '사용 가능한 가챠권이 없습니다. 만료된 가챠권은 사용할 수 없습니다.';
    end if;

    if exists (
      select 1
      from public.user_draw_credits udc
      join public.refund_requests rr on rr.user_draw_credit_id = udc.id
      where udc.user_id = v_user_id
        and udc.draw_product_id = p_draw_product_id
        and udc.type = 'gacha'
        and udc.status = 'unused'
        and udc.expires_at > now()
        and rr.status in ('requested', 'approved', 'processed')
    ) then
      raise exception '사용 가능한 가챠권이 없습니다. 환불 요청 중인 가챠권은 사용할 수 없습니다.';
    end if;

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
