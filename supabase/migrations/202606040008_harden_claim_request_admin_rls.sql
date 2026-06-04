-- Restrict admin claim mutation to RPC paths.
-- Admins can read claim requests directly; status processing uses update_claim_request_status().

drop policy if exists "claim_requests admin manage" on public.claim_requests;

create policy "claim_requests admin read"
on public.claim_requests
for select
to authenticated
using (public.is_admin());
