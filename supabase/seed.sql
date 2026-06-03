-- MVP seed data for local gacha flow testing.
-- This seed intentionally does not create auth.users, profiles, draw_results,
-- draw_logs, or user_draw_credits.

with seed_themes as (
  insert into public.themes (id, name, description, thumbnail_url, status)
  values
    (
      '10000000-0000-4000-8000-000000000001',
      'MVP Mock Theme A - 학원 콘셉트',
      'MVP 테스트용 mock theme입니다. 실제 서비스명 또는 IP 확정 데이터가 아닙니다.',
      null,
      'active'
    ),
    (
      '10000000-0000-4000-8000-000000000002',
      'MVP Mock Theme B - 모험 콘셉트',
      'MVP 테스트용 mock theme입니다. 실제 서비스명 또는 IP 확정 데이터가 아닙니다.',
      null,
      'active'
    )
  returning id
),
seed_reward_items as (
  insert into public.reward_items (id, theme_id, name, description, image_url, grade, category, status)
  values
    (
      '20000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000001',
      'Mock Theme A S급 피규어',
      'MVP 테스트용 S급 실물 상품입니다.',
      null,
      'S',
      'figure',
      'active'
    ),
    (
      '20000000-0000-4000-8000-000000000002',
      '10000000-0000-4000-8000-000000000001',
      'Mock Theme A A급 아크릴 스탠드',
      'MVP 테스트용 A급 실물 상품입니다.',
      null,
      'A',
      'acrylic',
      'active'
    ),
    (
      '20000000-0000-4000-8000-000000000003',
      '10000000-0000-4000-8000-000000000001',
      'Mock Theme A B급 키링',
      'MVP 테스트용 B급 실물 상품입니다.',
      null,
      'B',
      'keyring',
      'active'
    ),
    (
      '20000000-0000-4000-8000-000000000004',
      '10000000-0000-4000-8000-000000000001',
      'Mock Theme A C급 스티커',
      'MVP 테스트용 C급 실물 상품입니다.',
      null,
      'C',
      'sticker',
      'active'
    ),
    (
      '20000000-0000-4000-8000-000000000005',
      '10000000-0000-4000-8000-000000000002',
      'Mock Theme B S급 피규어',
      'MVP 테스트용 S급 실물 상품입니다.',
      null,
      'S',
      'figure',
      'active'
    ),
    (
      '20000000-0000-4000-8000-000000000006',
      '10000000-0000-4000-8000-000000000002',
      'Mock Theme B A급 아크릴 스탠드',
      'MVP 테스트용 A급 실물 상품입니다.',
      null,
      'A',
      'acrylic',
      'active'
    ),
    (
      '20000000-0000-4000-8000-000000000007',
      '10000000-0000-4000-8000-000000000002',
      'Mock Theme B B급 키링',
      'MVP 테스트용 B급 실물 상품입니다.',
      null,
      'B',
      'keyring',
      'active'
    ),
    (
      '20000000-0000-4000-8000-000000000008',
      '10000000-0000-4000-8000-000000000002',
      'Mock Theme B C급 스티커',
      'MVP 테스트용 C급 실물 상품입니다.',
      null,
      'C',
      'sticker',
      'active'
    )
  returning id, grade
),
seed_draw_products as (
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
  values
    (
      '30000000-0000-4000-8000-000000000001',
      'gacha',
      'random',
      null,
      'MVP 랜덤 가챠 1회권',
      '여러 mock theme의 보상으로 구성된 MVP 테스트용 랜덤 가챠입니다.',
      3900,
      1,
      100,
      0,
      'active',
      null
    ),
    (
      '30000000-0000-4000-8000-000000000002',
      'gacha',
      'theme',
      '10000000-0000-4000-8000-000000000001',
      'MVP Theme A 가챠 1회권',
      'Mock Theme A 보상만 포함된 MVP 테스트용 테마 가챠입니다.',
      3900,
      1,
      100,
      0,
      'active',
      null
    ),
    (
      '30000000-0000-4000-8000-000000000003',
      'ticket',
      'random',
      null,
      'MVP 티켓 placeholder',
      '1차 MVP에서는 실제 티켓 추첨을 실행하지 않는 route placeholder용 상품입니다.',
      1000,
      1,
      100,
      0,
      'hidden',
      null
    )
  returning id
),
seed_draw_product_items as (
  insert into public.draw_product_items (draw_product_id, reward_item_id, quantity)
  values
    ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 1),
    ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000006', 9),
    ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000003', 15),
    ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000007', 15),
    ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000004', 30),
    ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000008', 30),
    ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', 1),
    ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', 9),
    ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000003', 30),
    ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000004', 60)
  returning draw_product_id, reward_item_id, quantity
),
seed_inventory_units as (
  insert into public.inventory_units (draw_product_id, reward_item_id, grade, status)
  select
    dpi.draw_product_id,
    dpi.reward_item_id,
    ri.grade,
    'available'
  from seed_draw_product_items dpi
  join seed_reward_items ri on ri.id = dpi.reward_item_id
  cross join lateral generate_series(1, dpi.quantity)
  returning id
),
seed_policies as (
  insert into public.policies (id, type, slug, title, content, status, sort_order, is_published)
  values
    (
      '40000000-0000-4000-8000-000000000001',
      'fairness',
      'fairness',
      '공정성 안내',
      'MVP 임시 안내입니다. 뽑기 결과는 서버에서 처리되며 클라이언트는 결과를 직접 생성하지 않습니다. 실제 법무 검토 완료 문구가 아닙니다.',
      'published',
      10,
      true
    ),
    (
      '40000000-0000-4000-8000-000000000002',
      'refund',
      'refund',
      '환불 정책',
      'MVP 임시 안내입니다. 미사용 가챠권은 관리자 검토 후 수동 환불 처리할 수 있습니다. 실제 결제 환불 자동화는 포함하지 않습니다.',
      'published',
      20,
      true
    ),
    (
      '40000000-0000-4000-8000-000000000003',
      'shipping',
      'shipping',
      '배송 안내',
      'MVP 임시 안내입니다. 당첨 상품은 수령 요청 후 관리자 수동 처리로 배송 준비가 진행됩니다. 실제 택배사 연동 문구가 아닙니다.',
      'published',
      30,
      true
    ),
    (
      '40000000-0000-4000-8000-000000000004',
      'exchange',
      'exchange',
      '교환 정책',
      'MVP 임시 안내입니다. 파손, 오배송, 누락 등 상품 이슈가 있는 경우 관리자 검토 후 수동 처리합니다.',
      'published',
      40,
      true
    ),
    (
      '40000000-0000-4000-8000-000000000005',
      'usage',
      'youth',
      '청소년 이용 안내',
      'MVP 임시 안내입니다. 이용자는 거주 지역 규정과 보호자 동의가 필요한 상황을 직접 확인해야 합니다.',
      'published',
      50,
      true
    ),
    (
      '40000000-0000-4000-8000-000000000006',
      'usage',
      'privacy-placeholder',
      '개인정보 처리방침 placeholder',
      'MVP 임시 placeholder입니다. 정식 개인정보 처리방침은 법무 검토 후 별도로 확정해야 합니다.',
      'published',
      60,
      true
    ),
    (
      '40000000-0000-4000-8000-000000000007',
      'usage',
      'terms-placeholder',
      '이용약관 placeholder',
      'MVP 임시 placeholder입니다. 정식 이용약관은 법무 검토 후 별도로 확정해야 합니다.',
      'published',
      70,
      true
    )
  returning id
),
seed_faq_items as (
  insert into public.faq_items (id, category, question, answer, status, sort_order)
  values
    (
      '50000000-0000-4000-8000-000000000001',
      'draw',
      '가챠와 티켓의 차이는 무엇인가요?',
      'MVP에서는 가챠 추첨만 실제 구현합니다. 티켓은 route placeholder만 제공하며 실제 추첨 로직은 2차 작업에서 구현합니다.',
      'published',
      10
    ),
    (
      '50000000-0000-4000-8000-000000000002',
      'fairness',
      '뽑기 결과는 어떻게 정해지나요?',
      '클라이언트가 결과를 만들지 않고 서버에서 available inventory 중 하나를 선택해 결과를 확정합니다.',
      'published',
      20
    ),
    (
      '50000000-0000-4000-8000-000000000003',
      'refund',
      '미사용 가챠권은 환불할 수 있나요?',
      '사용하지 않은 가챠권은 관리자 검토 후 수동 환불 처리할 수 있습니다. 이미 사용된 가챠권은 환불 대상이 아닙니다.',
      'published',
      30
    ),
    (
      '50000000-0000-4000-8000-000000000004',
      'claim',
      '당첨 상품은 어떻게 수령하나요?',
      '당첨 상품은 보관함에서 확인한 뒤 배송 또는 현장 수령 방식으로 수령 요청할 수 있습니다.',
      'published',
      40
    ),
    (
      '50000000-0000-4000-8000-000000000005',
      'claim',
      '여러 상품을 묶음 배송할 수 있나요?',
      '네. 여러 당첨 상품을 선택해 하나의 배송 수령 요청으로 묶을 수 있습니다.',
      'published',
      50
    ),
    (
      '50000000-0000-4000-8000-000000000006',
      'pickup',
      '현장 수령은 어떻게 하나요?',
      '현장 수령을 선택하면 수령 확인용 코드가 생성됩니다. MVP에서는 이 코드를 QR 이미지로 저장하지 않고 문자열로 저장합니다.',
      'published',
      60
    ),
    (
      '50000000-0000-4000-8000-000000000007',
      'inventory',
      '품절된 상품도 보유권으로 뽑을 수 있나요?',
      '신규 구매가 마감되어도 available inventory가 남아 있고 사용자가 미사용 보유권을 가지고 있다면 뽑기를 진행할 수 있습니다.',
      'published',
      70
    )
  returning id
)
select
  (select count(*) from seed_themes) as themes_inserted,
  (select count(*) from seed_reward_items) as reward_items_inserted,
  (select count(*) from seed_draw_products) as draw_products_inserted,
  (select count(*) from seed_draw_product_items) as draw_product_items_inserted,
  (select count(*) from seed_inventory_units) as inventory_units_inserted,
  (select count(*) from seed_policies) as policies_inserted,
  (select count(*) from seed_faq_items) as faq_items_inserted;
