-- User claim request RPC.
-- draw_results.status remains completed until admin completes the claim.

alter table public.claim_requests
add column if not exists delivery_note text;

create or replace function public.create_claim_request(
  p_draw_result_ids uuid[],
  p_claim_method public.claim_method,
  p_recipient_name text default null,
  p_recipient_phone text default null,
  p_postal_code text default null,
  p_address1 text default null,
  p_address2 text default null,
  p_delivery_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_claim_request_id uuid;
  v_selected_count integer := 0;
  v_owned_count integer := 0;
  v_already_claimed_count integer := 0;
  v_pickup_qr_code text;
begin
  if v_user_id is null then
    raise exception '로그인이 필요합니다.';
  end if;

  select count(*)
  into v_selected_count
  from (select distinct unnest(p_draw_result_ids) as id) selected;

  if v_selected_count <= 0 then
    raise exception '수령 요청할 상품을 선택해주세요.';
  end if;

  if p_claim_method = 'delivery' then
    if nullif(trim(coalesce(p_recipient_name, '')), '') is null
       or nullif(trim(coalesce(p_recipient_phone, '')), '') is null
       or nullif(trim(coalesce(p_postal_code, '')), '') is null
       or nullif(trim(coalesce(p_address1, '')), '') is null then
      raise exception '배송 수령에는 수령자 이름, 연락처, 우편번호, 주소가 필요합니다.';
    end if;
  end if;

  select count(*)
  into v_owned_count
  from public.draw_results dr
  join (select distinct unnest(p_draw_result_ids) as id) selected on selected.id = dr.id
  where dr.user_id = v_user_id
    and dr.status = 'completed';

  if v_owned_count <> v_selected_count then
    raise exception '수령 요청할 수 없는 상품이 포함되어 있습니다.';
  end if;

  select count(*)
  into v_already_claimed_count
  from public.claim_request_items cri
  join (select distinct unnest(p_draw_result_ids) as id) selected on selected.id = cri.draw_result_id;

  if v_already_claimed_count > 0 then
    raise exception '이미 수령 요청된 상품이 포함되어 있습니다.';
  end if;

  insert into public.claim_requests (
    user_id,
    claim_method,
    status,
    recipient_name,
    recipient_phone,
    postal_code,
    address1,
    address2,
    delivery_note
  )
  values (
    v_user_id,
    p_claim_method,
    'requested',
    case when p_claim_method = 'delivery' then nullif(trim(coalesce(p_recipient_name, '')), '') else null end,
    case when p_claim_method = 'delivery' then nullif(trim(coalesce(p_recipient_phone, '')), '') else null end,
    case when p_claim_method = 'delivery' then nullif(trim(coalesce(p_postal_code, '')), '') else null end,
    case when p_claim_method = 'delivery' then nullif(trim(coalesce(p_address1, '')), '') else null end,
    case when p_claim_method = 'delivery' then nullif(trim(coalesce(p_address2, '')), '') else null end,
    case when p_claim_method = 'delivery' then nullif(trim(coalesce(p_delivery_note, '')), '') else null end
  )
  returning id into v_claim_request_id;

  if p_claim_method = 'pickup' then
    v_pickup_qr_code := 'PICKUP-' || v_claim_request_id::text;

    update public.claim_requests
    set pickup_qr_code = v_pickup_qr_code
    where id = v_claim_request_id;
  end if;

  insert into public.claim_request_items (claim_request_id, draw_result_id)
  select v_claim_request_id, selected.id
  from (select distinct unnest(p_draw_result_ids) as id) selected;

  return jsonb_build_object(
    'claim_request_id', v_claim_request_id,
    'claim_method', p_claim_method,
    'status', 'requested',
    'item_count', v_selected_count,
    'pickup_qr_code', v_pickup_qr_code,
    'created_at', now()
  );
end;
$$;

revoke all on function public.create_claim_request(
  uuid[],
  public.claim_method,
  text,
  text,
  text,
  text,
  text,
  text
) from public;

grant execute on function public.create_claim_request(
  uuid[],
  public.claim_method,
  text,
  text,
  text,
  text,
  text,
  text
) to authenticated;
