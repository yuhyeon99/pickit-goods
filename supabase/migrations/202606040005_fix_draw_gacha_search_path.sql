-- Supabase Cloud can install pgcrypto helpers such as digest() in the extensions schema.
-- Keep the RPC security-definer search path explicit while allowing pgcrypto lookup.

alter function public.draw_gacha(uuid)
set search_path = public, extensions, pg_temp;
