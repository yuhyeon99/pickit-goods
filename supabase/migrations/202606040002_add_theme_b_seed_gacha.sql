-- Add a second theme gacha product for UI density and scroll testing.

insert into public.draw_products (
  id,
  type,
  scope,
  theme_id,
  title,
  description,
  price,
  credit_amount,
  sales_limit,
  sold_count,
  status,
  thumbnail_url
)
values (
  '30000000-0000-4000-8000-000000000004',
  'gacha',
  'theme',
  '10000000-0000-4000-8000-000000000002',
  'MVP Theme B 가챠 1회권',
  'Mock Theme B 보상만 포함된 MVP 테스트용 테마 가챠입니다.',
  3900,
  1,
  100,
  0,
  'active',
  null
)
on conflict (id) do nothing;

insert into public.draw_product_items (draw_product_id, reward_item_id, quantity)
values
  ('30000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000005', 1),
  ('30000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000006', 9),
  ('30000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000007', 30),
  ('30000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000008', 60)
on conflict (draw_product_id, reward_item_id) do nothing;

insert into public.inventory_units (draw_product_id, reward_item_id, grade, status)
select
  dpi.draw_product_id,
  dpi.reward_item_id,
  ri.grade,
  'available'
from public.draw_product_items dpi
join public.reward_items ri on ri.id = dpi.reward_item_id
cross join lateral generate_series(1, dpi.quantity)
where dpi.draw_product_id = '30000000-0000-4000-8000-000000000004'
  and not exists (
    select 1
    from public.inventory_units iu
    where iu.draw_product_id = dpi.draw_product_id
  );
