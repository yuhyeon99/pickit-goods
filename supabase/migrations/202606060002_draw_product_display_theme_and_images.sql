alter table public.draw_products
add column if not exists display_theme_name text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'draw-product-images',
  'draw-product-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "draw product images public read" on storage.objects;
create policy "draw product images public read"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'draw-product-images');

drop policy if exists "draw product images admin insert" on storage.objects;
create policy "draw product images admin insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'draw-product-images'
  and public.is_admin()
);

drop policy if exists "draw product images admin update" on storage.objects;
create policy "draw product images admin update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'draw-product-images'
  and public.is_admin()
)
with check (
  bucket_id = 'draw-product-images'
  and public.is_admin()
);
