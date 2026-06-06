# Database Design

This project uses Supabase Postgres.

All tables should use UUID primary keys unless there is a clear reason not to.

RLS must be enabled on all user-facing tables.

Status and role values must be managed by enum types or check constraints.

Required enum/check targets:

- profiles.role
- draw_products.status
- inventory_units.status
- user_draw_credits.status
- claim_requests.status
- draw_results.status
- orders.status
- refund_requests.status

## 1. Main Entities

```txt
profiles
  ↓
orders
  ↓
user_draw_credits
  ↓
draw_results
  ↓
claim_request_items
  ↓
claim_requests
```

```txt
themes
  ↓
reward_items
  ↓
draw_product_items
  ↓
draw_products
  ↓
inventory_units
```

```txt
orders
  ↓
order_items
  ↓
credit_issuances
  ↓
user_draw_credits
```

## 2. profiles

Stores user profile and role information.

| Column | Type | Notes |
|---|---|---|
| id | uuid | auth.users.id |
| display_name | text | nullable |
| avatar_url | text | nullable |
| role | text | user or admin |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

Rules:

- A user can read and update their own profile except role.
- Only admins can update role.

## 3. themes

Stores theme information.

| Column | Type | Notes |
|---|---|---|
| id | uuid | primary key |
| name | text | required |
| description | text | nullable |
| thumbnail_url | text | nullable |
| status | text | active, hidden, archived |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

## 4. reward_items

Stores actual goods that can be won.

| Column | Type | Notes |
|---|---|---|
| id | uuid | primary key |
| theme_id | uuid | references themes, nullable for random goods |
| name | text | required |
| description | text | nullable |
| image_url | text | nullable |
| grade | text | S, A, B, C |
| category | text | figure, acrylic, keyring, sticker, etc. |
| status | text | active, hidden, archived |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

Rules:

- Admins can create and update reward_items from `/admin/items`.
- `/admin/items` stores product images by uploading JPG, PNG, or WEBP files to Supabase Storage instead of asking admins to type image URLs.
- Uploaded reward item images are center-cropped and converted to square WebP assets before `reward_items.image_url` is updated.
- Deletion is not exposed in the MVP; use hidden or archived status instead.
- Reward item creation/update manages only base item metadata.
- Draw product pool composition and inventory unit creation are handled separately.
- Existing uploaded image cleanup/replacement deletion is not automated yet.

Storage:

- Bucket: `reward-item-images`
- Public read is allowed so item cards can render product images.
- Insert/update is restricted to admins through Storage policies.
- Delete is not exposed in the MVP.

## 5. draw_products

Stores purchasable draw products.

Examples:

- Gacha 1 draw
- Gacha 10 draws
- Random Ticket 1 pack
- Theme Ticket 5 pack

| Column | Type | Notes |
|---|---|---|
| id | uuid | primary key |
| type | text | gacha or ticket |
| scope | text | random or theme |
| theme_id | uuid | nullable, references themes |
| title | text | required |
| description | text | nullable |
| price | integer | MVP test price |
| credit_amount | integer | issued credits count |
| sales_limit | integer | default 100 |
| sold_count | integer | default 0, issued credit count minus processed unused-credit refunds |
| status | text | draft, active, sold_out, hidden, archived |
| thumbnail_url | text | nullable |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

Rules:

- sold_count is based on issued credit quantity, not order item row count or completed draw count.
- A gacha 1 draw purchase increases sold_count by 1.
- A gacha 10 draw purchase increases sold_count by 10.
- A theme ticket 5-pack purchase increases sold_count by 5.
- A processed refund for an unused credit decreases sold_count by 1.
- New purchases must stop if available inventory count is 0.
- New purchases must stop if sold_count reaches sales_limit.
- Existing unused credits can still be drawn against a sold_out product if available inventory remains.
- sold_count is not automatically restored when a credit expires.
- For the MVP, sold_count is the current paid sale count after processed unused-credit refunds, not completed draw count.

## 6. draw_product_items

Defines the seed/configuration of a draw product's reward pool.

Actual draw execution must use inventory_units. This table is used to configure which reward items and quantities should be included when inventory units are created.

| Column | Type | Notes |
|---|---|---|
| id | uuid | primary key |
| draw_product_id | uuid | references draw_products |
| reward_item_id | uuid | references reward_items |
| quantity | integer | number of inventory units to create |
| created_at | timestamptz | default now() |

## 7. inventory_units

Represents one actual stock unit.

This is the core table for stock-based drawing.

| Column | Type | Notes |
|---|---|---|
| id | uuid | primary key |
| draw_product_id | uuid | references draw_products |
| reward_item_id | uuid | references reward_items |
| grade | text | S, A, B, C |
| status | text | available, reserved, drawn, claimed, void |
| reserved_by | uuid | nullable, references profiles |
| drawn_by | uuid | nullable, references profiles |
| draw_result_id | uuid | nullable, references draw_results |
| created_at | timestamptz | default now() |
| reserved_at | timestamptz | nullable |
| drawn_at | timestamptz | nullable |
| claimed_at | timestamptz | nullable |

Rules:

- Users cannot directly update this table.
- Draw functions update this table.
- Admins can create inventory.
- Admins cannot modify drawn results after completion.
- Admins cannot update drawn_by or draw_result_id.
- After status becomes drawn, admins cannot modify status or result-related fields.

## 8. cart_items

Stores user cart items.

| Column | Type | Notes |
|---|---|---|
| id | uuid | primary key |
| user_id | uuid | references profiles |
| draw_product_id | uuid | references draw_products |
| quantity | integer | required |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

Rules:

- Users can manage their own cart items.
- Cart items represent draw products, not reward items.

## 9. orders

Stores test checkout orders.

| Column | Type | Notes |
|---|---|---|
| id | uuid | primary key |
| user_id | uuid | references profiles |
| status | text | pending, paid, canceled, refund_requested, refunded |
| total_amount | integer | MVP test amount |
| created_at | timestamptz | default now() |
| paid_at | timestamptz | nullable |
| canceled_at | timestamptz | nullable |

## 10. order_items

Stores draw products included in an order.

| Column | Type | Notes |
|---|---|---|
| id | uuid | primary key |
| order_id | uuid | references orders |
| draw_product_id | uuid | references draw_products |
| quantity | integer | required |
| unit_price | integer | copied at order time |
| credit_amount | integer | copied at order time |
| created_at | timestamptz | default now() |

## 11. credit_issuances

Stores credit issuance history for paid checkout.

| Column | Type | Notes |
|---|---|---|
| id | uuid | primary key |
| order_id | uuid | references orders |
| order_item_id | uuid | references order_items |
| user_id | uuid | references profiles |
| draw_product_id | uuid | references draw_products |
| issued_quantity | integer | number of user_draw_credits created |
| created_at | timestamptz | default now() |

Rules:

- A paid checkout should create credit_issuances rows and matching user_draw_credits rows in the same transaction.
- draw_products.sold_count should increase by issued_quantity.

## 12. user_draw_credits

Stores user's usable draw credits.

| Column | Type | Notes |
|---|---|---|
| id | uuid | primary key |
| user_id | uuid | references profiles |
| order_id | uuid | nullable, references orders |
| draw_product_id | uuid | references draw_products |
| type | text | gacha or ticket |
| status | text | unused, used, expired, refunded, failed |
| used_at | timestamptz | nullable |
| refunded_at | timestamptz | nullable |
| expires_at | timestamptz | required, defaults to 30 days after issuance |
| created_at | timestamptz | default now() |

Rules:

- Refund is allowed only when status is unused.
- A used credit cannot be refunded.
- Draw credits are valid for 30 days after paid checkout.
- Expired credits cannot be used for drawing.
- Expiration changes credit usability but does not decrement draw_products.sold_count.
- Processed refunds for unused credits do decrement draw_products.sold_count by 1.
- `expire_unused_draw_credits()` can manually synchronize `status = unused and expires_at <= now()` rows to `expired`.
- Manual expiration synchronization does not change sold_count, inventory_units, draw_results, or draw_logs.
- checkout_cart() sets expires_at to now() + interval '30 days' when credits are issued.
- Existing credits are backfilled to created_at + interval '30 days' by migration.
- draw_gacha() only selects unused credits where expires_at > now().
- `/my/draws` shows issue date, expiration date, remaining days, and usable/expired state.
- Automatic scheduled unused → expired synchronization is not implemented yet.
- Refund request creation and admin processing are implemented for unused and unexpired credits.

Expiration design notes:

- A paid checkout issues draw credits but does not select inventory_units.
- inventory_units are selected and changed to drawn only during server-side draw execution.
- If a credit expires unused, the physical inventory unit remains available until a future draw, resale, event, or admin policy handles it.
- The MVP should not infer available purchase quantity from inventory_units alone. Use `min(sales_limit - sold_count, available_inventory_count)`.

## 13. draw_results

Stores confirmed draw results.

| Column | Type | Notes |
|---|---|---|
| id | uuid | primary key |
| user_id | uuid | references profiles |
| draw_credit_id | uuid | references user_draw_credits |
| draw_product_id | uuid | references draw_products |
| inventory_unit_id | uuid | references inventory_units |
| reward_item_id | uuid | references reward_items |
| type | text | gacha or ticket |
| ticket_slot_no | integer | nullable, for ticket draw |
| grade | text | S, A, B, C |
| status | text | completed, recoverable, failed, claimed |
| public_verify_code | text | safe public verification code |
| created_at | timestamptz | default now() |

Rules:

- Users can read their own results.
- Admins can read all results.
- No one can update the winning result after completion.
- draw_credit_id must be unique.
- inventory_unit_id must be unique.
- ticket_slot_no is a UX-only selected number for ticket draws.
- In the first MVP, ticket draw results are not created because ticket draw execution is deferred.

## 14. draw_logs

Stores internal audit logs for draw processing.

| Column | Type | Notes |
|---|---|---|
| id | uuid | primary key |
| draw_result_id | uuid | nullable, references draw_results |
| user_id | uuid | references profiles |
| draw_credit_id | uuid | nullable |
| draw_product_id | uuid | nullable |
| request_id | text | unique request id |
| event_type | text | started, reserved, completed, failed, recovered |
| random_method | text | e.g. crypto.getRandomValues |
| random_seed_hash | text | hash only, not raw seed |
| available_inventory_count | integer | count at draw time |
| inventory_snapshot_hash | text | hash of snapshot data |
| selected_inventory_unit_id | uuid | nullable, references inventory_units |
| payload | jsonb | nullable, structured internal audit data |
| error_message | text | nullable |
| created_at | timestamptz | default now() |

Rules:

- Users should not directly access internal logs.
- Admins can read logs.
- Admins cannot delete normal draw logs.
- Logs must not expose sensitive raw random values.

## 15. claim_requests

Stores delivery or on-site pickup requests.

| Column | Type | Notes |
|---|---|---|
| id | uuid | primary key |
| user_id | uuid | references profiles |
| claim_method | text | delivery or pickup |
| status | text | requested, preparing, ready_for_pickup, shipping, completed, canceled |
| recipient_name | text | nullable |
| recipient_phone | text | nullable |
| postal_code | text | nullable |
| address1 | text | nullable |
| address2 | text | nullable |
| delivery_note | text | nullable |
| pickup_qr_code | text | nullable |
| tracking_number | text | nullable |
| courier_name | text | nullable |
| admin_note | text | nullable |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |
| completed_at | timestamptz | nullable |

Rules:

- claim_method and status are used together.
- Delivery flow: requested → preparing → shipping → completed.
- Pickup flow: requested → preparing → ready_for_pickup → completed.
- Admins can update claim status.
- First MVP does not store QR image files.
- pickup_qr_code stores a verifiable text code such as PICKUP-CLAIM-000001 or PICKUP-{claim_request_id}.
- The UI renders a QR code that opens `/admin/claims?pickupCode=...` and also displays the text code.
- QR scanning does not automatically complete pickup; admin completion remains manual.
- Advanced QR verification is deferred.
- Admin status updates must use a server-side RPC that validates admin role and allowed status transitions.
- When a claim is completed, linked draw_results.status changes to claimed and linked inventory_units.status changes to claimed.

## 16. claim_request_items

Links draw results to claim requests.

| Column | Type | Notes |
|---|---|---|
| id | uuid | primary key |
| claim_request_id | uuid | references claim_requests |
| draw_result_id | uuid | references draw_results |
| created_at | timestamptz | default now() |

Rules:

- A draw result can be claimed only once.
- draw_result_id must be unique.
- Multiple draw results can be bundled into one delivery claim.
- Creating claim_requests and claim_request_items must happen in the same transaction.
- In the current schema, draw_results.status remains completed while a request is pending.
- Request state is derived from claim_request_items existence.
- draw_results.status changes to claimed only when admin completes the claim.

## 17. refund_requests

Stores refund requests for manual admin review.

| Column | Type | Notes |
|---|---|---|
| id | uuid | primary key |
| order_id | uuid | nullable, references orders |
| user_id | uuid | references profiles |
| user_draw_credit_id | uuid | references user_draw_credits |
| reason | text | required |
| status | text | requested, approved, rejected, canceled, processed |
| admin_note | text | nullable |
| requested_at | timestamptz | default now() |
| processed_at | timestamptz | nullable |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

Rules:

- Refund automation and actual PG refund are excluded from the first MVP.
- Refunds may be requested only for unused credits with `expires_at > now()`.
- A credit cannot have duplicate active refund requests in `requested`, `approved`, or `processed` states.
- Rejected or canceled requests may be requested again while the credit is still eligible.
- Admin review updates refund_requests.status and admin_note through `update_refund_request_status`.
- requested: user requested a refund.
- approved: admin approved the refund.
- rejected: admin rejected the refund.
- canceled: user canceled the refund request.
- processed: actual refund processing is complete.
- In the MVP, refunds are designed around manual admin processing.
- When status becomes `processed`, the linked user_draw_credits row changes to `refunded`.
- When an unused credit refund becomes `processed`, draw_products.sold_count decreases by 1.
- Refund processing does not modify inventory_units, draw_results, or draw_logs.

## 18. faq_items

Stores FAQ content.

| Column | Type | Notes |
|---|---|---|
| id | uuid | primary key |
| category | text | required |
| question | text | required |
| answer | text | required |
| status | text | draft, published, hidden |
| sort_order | integer | default 0 |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

Rules:

- faq_items uses status only for visibility.
- User-facing FAQ pages read published FAQ items.

## 19. policies

Stores policy content.

| Column | Type | Notes |
|---|---|---|
| id | uuid | primary key |
| type | text | refund, exchange, shipping, fairness, usage |
| slug | text | unique, required |
| title | text | required |
| content | text | required |
| status | text | draft, published, hidden, archived |
| sort_order | integer | default 0 |
| is_published | boolean | default false |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

## 20. RLS Summary

| Table | User Access | Admin Access |
|---|---|---|
| profiles | read/update own profile except role | read/update all |
| themes | read active | full management |
| reward_items | read active | full management |
| draw_products | read active | full management |
| inventory_units | no direct user update | create/read, restricted update |
| cart_items | manage own | read all |
| orders | read own | read all |
| order_items | read own through order | read all |
| credit_issuances | read own | read all |
| user_draw_credits | read own | read all |
| draw_results | read own | read all, no winning result modification |
| draw_logs | no user access | read all |
| claim_requests | manage own requests | manage all |
| refund_requests | read own, create/cancel through RPC | read all, status change through admin RPC |
| faq_items | read published | manage all |
| policies | read published | manage all |

Admin update restrictions:

- Admins can manage themes, reward_items, draw_products, draw_product_items, policies, faq_items, and claim_requests.status.
- Admins cannot modify draw_results.
- Admins cannot modify draw_logs.
- Admins cannot update inventory_units.drawn_by.
- Admins cannot update inventory_units.draw_result_id.
- Admins cannot update result-related inventory fields after inventory_units.status becomes drawn.

## 21. Local Seed Data

Local MVP seed data is stored in:

```txt
supabase/seed.sql
```

Run seed data through Supabase reset:

```bash
npx supabase db reset
```

Seed data includes:

- 2 MVP mock themes
- theme-based reward_items with S/A/B/C grades
- 3 active gacha draw_products: 1 random gacha and 2 theme gachas
- 1 hidden ticket placeholder draw_product
- draw_product_items pool configuration
- 100 available inventory_units per active gacha product
- published policy placeholder pages
- published FAQ items

Seed data must not create:

- auth.users
- profiles
- user_draw_credits
- draw_results
- draw_logs

Admin account setup should be handled separately after OAuth login. The first admin must be bootstrapped in Supabase SQL Editor by temporarily disabling the `prevent_profile_role_escalation` trigger, updating the target `profiles.role` to `admin`, and immediately re-enabling the trigger. See `docs/AUTH.md`.

## 22. Supabase Cloud Migration

Local Supabase remains the default development target, and `supabase/config.toml` is kept for local CLI development.

To apply migrations to Supabase Cloud:

```bash
npx supabase login
npx supabase link --project-ref <PROJECT_REF>
npx supabase db push --dry-run
npx supabase db push
```

Rules:

- Do not commit Project URL, anon key, service_role key, database password, or Google Client Secret.
- Use `.env.local` for the frontend Project URL and anon key.
- Never put the service_role key in Vite frontend environment variables.
- Confirm `db push --dry-run` output before applying remote migrations.
- Avoid `npx supabase db reset --linked` unless intentionally resetting the linked Cloud database.

After remote migrations are applied, configure Supabase Cloud Auth separately in the Dashboard:

```txt
Authentication -> Providers -> Google
Authentication -> URL Configuration
```

Seed data can be applied to the linked project only when the remote environment is intended for test data.
