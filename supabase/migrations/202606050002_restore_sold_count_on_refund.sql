-- Restore purchase capacity when an unused draw credit refund is fully processed.
-- Actual PG refund is still outside the MVP scope.

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
  v_credit public.user_draw_credits%rowtype;
  v_admin_note text := nullif(trim(coalesce(p_admin_note, '')), '');
  v_restored_sold_count boolean := false;
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
    select *
    into v_credit
    from public.user_draw_credits
    where id = v_request.user_draw_credit_id
      and user_id = v_request.user_id
    for update;

    if not found then
      raise exception '환불 처리할 가챠권을 찾을 수 없습니다.';
    end if;

    if v_credit.status <> 'unused' then
      raise exception '환불 처리할 수 있는 미사용 가챠권이 아닙니다.';
    end if;

    if exists (
      select 1
      from public.draw_results dr
      where dr.draw_credit_id = v_credit.id
    ) then
      raise exception '이미 추첨 결과가 있는 가챠권은 환불 처리할 수 없습니다.';
    end if;

    update public.user_draw_credits
    set status = 'refunded',
        refunded_at = now()
    where id = v_credit.id
      and status = 'unused';

    if not found then
      raise exception '환불 처리할 수 있는 미사용 가챠권을 찾을 수 없습니다.';
    end if;

    update public.draw_products
    set sold_count = greatest(sold_count - 1, 0)
    where id = v_credit.draw_product_id;

    if not found then
      raise exception '판매 수량을 복구할 가챠 상품을 찾을 수 없습니다.';
    end if;

    v_restored_sold_count := true;
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
    'sold_count_restored', v_restored_sold_count,
    'updated_at', now()
  );
end;
$$;

revoke all on function public.update_refund_request_status(uuid, public.refund_status, text) from public;
grant execute on function public.update_refund_request_status(uuid, public.refund_status, text) to authenticated;
