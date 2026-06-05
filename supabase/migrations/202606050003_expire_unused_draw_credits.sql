-- Manually synchronize expired draw credits.
-- Expiration does not restore sold_count or mutate inventory/result tables.

create or replace function public.expire_unused_draw_credits()
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_expired_count integer := 0;
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다.';
  end if;

  if not public.is_admin() then
    raise exception '관리자 권한이 필요합니다.';
  end if;

  with expired_credits as (
    update public.user_draw_credits
    set status = 'expired'
    where status = 'unused'
      and expires_at <= now()
    returning id
  )
  select count(*)
  into v_expired_count
  from expired_credits;

  return jsonb_build_object(
    'expired_count', v_expired_count,
    'processed_at', now()
  );
end;
$$;

revoke all on function public.expire_unused_draw_credits() from public;
grant execute on function public.expire_unused_draw_credits() to authenticated;
