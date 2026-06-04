-- Admin claim status transition RPC.
-- Admins can process claims, but winning result fields stay immutable.

alter table public.claim_requests
add column if not exists admin_note text;

create or replace function public.update_claim_request_status(
  p_claim_request_id uuid,
  p_next_status public.claim_status,
  p_tracking_number text default null,
  p_admin_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_claim public.claim_requests%rowtype;
  v_item_count integer := 0;
  v_tracking_number text := nullif(trim(coalesce(p_tracking_number, '')), '');
  v_admin_note text := nullif(trim(coalesce(p_admin_note, '')), '');
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다.';
  end if;

  if not public.is_admin() then
    raise exception '관리자 권한이 필요합니다.';
  end if;

  select *
  into v_claim
  from public.claim_requests
  where id = p_claim_request_id
  for update;

  if not found then
    raise exception '수령 요청을 찾을 수 없습니다.';
  end if;

  if v_claim.status in ('completed', 'canceled') then
    raise exception '이미 종료된 수령 요청은 변경할 수 없습니다.';
  end if;

  if v_claim.claim_method = 'delivery' then
    if not (
      (v_claim.status = 'requested' and p_next_status = 'preparing')
      or (v_claim.status = 'preparing' and p_next_status = 'shipping')
      or (v_claim.status = 'shipping' and p_next_status = 'completed')
    ) then
      raise exception '배송 수령 요청의 상태 전환이 올바르지 않습니다.';
    end if;

    if p_next_status = 'shipping' and v_tracking_number is null then
      raise exception '배송중으로 변경하려면 송장번호가 필요합니다.';
    end if;
  elsif v_claim.claim_method = 'pickup' then
    if not (
      (v_claim.status = 'requested' and p_next_status = 'preparing')
      or (v_claim.status = 'preparing' and p_next_status = 'ready_for_pickup')
      or (v_claim.status = 'ready_for_pickup' and p_next_status = 'completed')
    ) then
      raise exception '현장 수령 요청의 상태 전환이 올바르지 않습니다.';
    end if;
  else
    raise exception '지원하지 않는 수령 방식입니다.';
  end if;

  select count(*)
  into v_item_count
  from public.claim_request_items
  where claim_request_id = p_claim_request_id;

  if v_item_count <= 0 then
    raise exception '수령 요청에 연결된 상품이 없습니다.';
  end if;

  update public.claim_requests
  set status = p_next_status,
      tracking_number = case
        when claim_method = 'delivery' and v_tracking_number is not null then v_tracking_number
        else tracking_number
      end,
      admin_note = coalesce(v_admin_note, admin_note),
      completed_at = case when p_next_status = 'completed' then now() else completed_at end
  where id = p_claim_request_id;

  if p_next_status = 'completed' then
    update public.draw_results dr
    set status = 'claimed'
    from public.claim_request_items cri
    where cri.claim_request_id = p_claim_request_id
      and cri.draw_result_id = dr.id
      and dr.status = 'completed';

    update public.inventory_units iu
    set status = 'claimed',
        claimed_at = now()
    from public.claim_request_items cri
    join public.draw_results dr on dr.id = cri.draw_result_id
    where cri.claim_request_id = p_claim_request_id
      and iu.id = dr.inventory_unit_id
      and iu.status = 'drawn';
  end if;

  return jsonb_build_object(
    'claim_request_id', p_claim_request_id,
    'status', p_next_status,
    'claim_method', v_claim.claim_method,
    'item_count', v_item_count,
    'tracking_number', case
      when v_claim.claim_method = 'delivery' and v_tracking_number is not null then v_tracking_number
      else v_claim.tracking_number
    end,
    'updated_at', now()
  );
end;
$$;

revoke all on function public.update_claim_request_status(
  uuid,
  public.claim_status,
  text,
  text
) from public;

grant execute on function public.update_claim_request_status(
  uuid,
  public.claim_status,
  text,
  text
) to authenticated;
