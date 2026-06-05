# MVP QA Checklist

This checklist is for validating the current React + Supabase + Vercel MVP before adding larger features.

Use it for local Supabase, Supabase Cloud, and Vercel production checks. Mark items manually after testing.

## 1. User Flow QA

### Authentication

- [x] Google OAuth login completes successfully.
- [x] After login, the Header shows the user's display name or email.
- [x] Logout clears the user state and updates the Header.
- [x] A first-time OAuth user gets a matching `profiles` row.

### Gacha Browse And Purchase

- [x] `/gacha` shows active gacha products from Supabase.
- [x] `/gacha` product cards show title, description, price, status, sold count, purchase quantity, and grade counts.
- [x] `/gacha` prioritizes `구매 가능 수량`.
- [x] `/gacha` does not show hidden products.
- [x] `/gacha/:id` shows the selected gacha detail.
- [x] `/gacha/:id` distinguishes `구매 가능 수량` and `남은 뽑기 재고`.
- [x] `/gacha/:id` shows grade probabilities based on available inventory units.
- [x] `/gacha/:id` shows included reward items.
- [x] Non-logged-in users see a login action before adding to cart.
- [x] Logged-in users can add an active gacha product to the cart.
- [x] A sold_out or hidden product cannot be newly added to cart.

### Cart And Test Checkout

- [x] `/cart` shows the current user's cart items only.
- [x] Cart item quantity can be increased.
- [x] Cart item quantity can be decreased.
- [x] Cart item can be removed.
- [x] Quantity cannot exceed `remaining_purchase_quantity`.
- [x] Cart summary shows total quantity and total amount.
- [x] Test checkout is blocked when the cart is empty.
- [x] Test checkout creates `orders`.
- [x] Test checkout creates `order_items`.
- [x] Test checkout creates `user_draw_credits`.
- [x] Test checkout creates `credit_issuances`.
- [x] Test checkout increases `draw_products.sold_count` by issued credit quantity.
- [x] Test checkout does not decrement `inventory_units.available`.
- [x] Checkout complete UI links to `/my/draws`.

### My Page And Credits

- [x] `/my` shows profile information.
- [x] `/my` shows activity summary cards.
- [x] `/my` links to `/my/draws`.
- [x] `/my` links to `/my/items`.
- [x] `/my` links to `/my/claims`.
- [x] `/my` links to `/cart`.
- [x] `/my/draws` shows owned draw credits.
- [x] `/my/draws` shows credit issue date.
- [x] `/my/draws` shows credit expiration date.
- [x] `/my/draws` shows remaining days.
- [x] `/my/draws` shows usable, used, expired, refunded, and failed states correctly.
- [x] `/my/draws` only shows `뽑기하러 가기` for usable credits.

### Gacha Draw

- [x] `/gacha/:id/play` is protected for logged-in users.
- [x] `/gacha/:id/play` shows usable credit count.
- [x] `/gacha/:id/play` excludes expired credits from usable credit count.
- [x] `/gacha/:id/play` shows an expired-credit guide if expired unused credits exist.
- [x] `/gacha/:id/play` shows remaining draw inventory.
- [x] Draw button is disabled when no usable credit exists.
- [x] Draw button is disabled when no available inventory remains.
- [x] Draw execution calls the server RPC.
- [x] Draw execution does not generate results on the client.
- [x] Successful draw changes `user_draw_credits.status` to `used`.
- [x] Successful draw changes one `inventory_units.status` to `drawn`.
- [x] Successful draw creates `draw_results`.
- [x] Successful draw creates `draw_logs`.
- [x] Result reveal UI shows reward name, grade, theme, draw time, and verification code.
- [x] After draw, `/my/draws` shows the credit as used.

### Won Item Box And Claim

- [x] `/my/items` shows the current user's draw results.
- [x] `/my/items` shows reward name, grade, theme, gacha name, draw date, status, and verification code.
- [x] `/my/items` shows claim status derived from claim linkage.
- [x] `/claim` shows claimable stored items.
- [x] `/claim` excludes or disables already requested items.
- [x] `/claim` allows selecting at least one item.
- [x] `/claim` supports delivery method.
- [x] `/claim` supports pickup method.
- [x] Delivery claim requires recipient name, phone, postal code, address, and detailed address.
- [x] Pickup claim explains pickup code usage.
- [x] Claim creation creates `claim_requests`.
- [x] Claim creation creates `claim_request_items`.
- [x] One draw result cannot be claimed twice.
- [x] `/my/claims` shows the user's claim requests.
- [x] `/my/claims` shows request method, status, request date, and item count.

## 2. Admin Flow QA

### `/admin/users`

- [x] Admin can open `/admin/users`.
- [x] User list shows profile ID, display name, avatar, role, created date, and updated date.
- [x] User summary shows order count.
- [x] User summary shows unused credit count.
- [x] User summary shows used credit count.
- [x] User summary shows draw result count.
- [x] User summary shows claim request count.
- [x] Search by user name works.
- [x] Search by user ID works.
- [x] Role filter works.
- [x] Credit presence filter works.

### `/admin/orders`

- [x] Admin can open `/admin/orders`.
- [x] Orders list shows order ID, user, status, total amount, created date, and paid date.
- [x] Order cards show order item list.
- [x] Order cards show gacha name, quantity, unit price, line total, and credit amount.
- [x] Credit issuance quantity is shown.
- [x] Order search by order ID works.
- [x] Order search by user works.
- [x] Order status filter works.
- [x] No order update/delete UI exists.

### `/admin/gacha`

- [x] Admin can open `/admin/gacha`.
- [x] Gacha list includes hidden and non-active products.
- [x] Each card shows raw status and user-facing status.
- [x] Each card shows `sales_limit`.
- [x] Each card shows `sold_count`.
- [x] Each card shows `신규 구매 가능 수량`.
- [x] Each card shows `미추첨 재고`.
- [x] Each card shows `전체 재고`.
- [x] Grade counts and probabilities are shown.
- [x] Included reward item list is shown.
- [x] Search and filters work.
- [x] No gacha create/update/delete UI exists.

### `/admin/items`

- [x] Admin can open `/admin/items`.
- [x] Reward item list shows item ID, name, description, grade, theme, created date, and updated date.
- [x] Included gacha pool information is shown.
- [x] Inventory status counts are shown.
- [x] Search by item name works.
- [x] Search by description works.
- [x] Grade filter works.
- [x] Theme filter works.
- [x] Inventory presence filter works.
- [x] No reward item create/update/delete UI exists.

### `/admin/pools`

- [x] Admin can open `/admin/pools`.
- [x] Pool list shows draw product ID, name, type, status, price, theme, sales limit, and sold count.
- [x] Pool list shows `신규 구매 가능 수량`.
- [x] Pool list shows available and total inventory counts.
- [x] Pool item list shows configured quantity.
- [x] Pool item list shows actual inventory quantity.
- [x] Pool item list shows inventory counts by status.
- [x] Quantity mismatch warning appears when configured quantity and actual inventory differ.
- [x] Grade composition rate is shown.
- [x] Available probability is shown.
- [x] Search and filters work.
- [x] No pool or inventory mutation UI exists.

### `/admin/draw-logs`

- [x] Admin can open `/admin/draw-logs`.
- [x] Draw log list shows log ID, result ID, user, gacha, reward, grade, status, inventory ID, request ID, and created date.
- [x] Verification-related IDs are shortened.
- [x] Payload is summarized and not overexposed.
- [x] Search by gacha works.
- [x] Search by user works.
- [x] Grade filter works.
- [x] Status filter works.
- [x] No draw log update/delete UI exists.
- [x] No draw result update/delete UI exists.

### `/admin/claims`

- [x] Admin can open `/admin/claims`.
- [x] Claim requests show request ID, user, method, status, created date, item count, and item list.
- [x] Delivery claims show recipient and address information.
- [x] Delivery claims can transition `requested → preparing`.
- [x] Delivery claims can transition `preparing → shipping`.
- [x] Delivery claims can transition `shipping → completed`.
- [x] Shipping transition can store tracking number if provided.
- [x] Pickup claims show `pickup_qr_code`.
- [x] Pickup claims can transition `requested → preparing`.
- [x] Pickup claims can transition `preparing → ready_for_pickup`.
- [x] Pickup claims can transition `ready_for_pickup → completed`.
- [x] Completed claim updates `claim_requests.status = completed`.
- [x] Completed claim updates linked `draw_results.status = claimed`.
- [x] Completed claim updates linked `inventory_units.status = claimed`.
- [x] User `/my/items` shows claimed state after completion.
- [x] User `/my/claims` shows completed state after completion.

## 3. Permission And RLS QA

- [x] Non-logged-in users cannot access `/cart`.
- [x] Non-logged-in users cannot access `/my`.
- [x] Non-logged-in users cannot access `/my/draws`.
- [x] Non-logged-in users cannot access `/my/items`.
- [x] Non-logged-in users cannot access `/my/claims`.
- [x] Non-logged-in users cannot access `/claim`.
- [x] Non-logged-in users cannot access `/gacha/:id/play`.
- [x] Normal users cannot access `/admin/*`.
- [x] Normal users cannot read another user's cart.
- [x] Normal users cannot read another user's orders.
- [x] Normal users cannot read another user's credits.
- [x] Normal users cannot read another user's draw results.
- [x] Normal users cannot read another user's claim requests.
- [x] Admin users can read operational admin screens.
- [x] Users cannot directly update `draw_results`.
- [x] Users cannot directly update `draw_logs`.
- [x] Admins cannot update or delete `draw_logs`.
- [x] Admins cannot arbitrarily modify winning results in `draw_results`.
- [x] Admins cannot modify result-related `inventory_units` fields after draw.
- [x] Claim status changes are performed through admin RPC.
- [x] Claim status RPC rejects non-admin users.
- [x] Draw RPC validates `auth.uid()`.
- [x] Checkout RPC validates `auth.uid()`.

## 4. Stock And Purchase Quantity QA

- [x] Purchase quantity uses `min(sales_limit - sold_count, available_inventory_count)`.
- [x] Buying one gacha credit increases `sold_count` by 1.
- [x] Buying multiple gacha credits increases `sold_count` by issued credit quantity.
- [x] Buying credits does not immediately decrement `inventory_units.available`.
- [x] Drawing changes one `inventory_units.status` from `available` to `drawn`.
- [x] User screens prioritize `구매 가능 수량`.
- [x] User screens use `남은 뽑기 재고` only as draw inventory context.
- [x] Cart quantity cannot exceed purchase quantity.
- [x] Checkout revalidates purchase quantity inside RPC.
- [x] `sold_out` blocks new purchases.
- [x] Existing usable credits can draw a sold_out product if inventory remains.
- [x] Draw is blocked when available inventory is 0.
- [x] Admin screens distinguish `판매된 가챠권`, `신규 구매 가능 수량`, `미추첨 재고`, and `전체 재고`.

## 5. Draw Credit Expiration QA

- [x] Test checkout creates `user_draw_credits.expires_at`.
- [x] Newly issued `expires_at` is 30 days after checkout.
- [x] Existing credits are backfilled with `created_at + 30 days`.
- [x] `/my/draws` shows issue date.
- [x] `/my/draws` shows expiration date.
- [x] `/my/draws` shows remaining days.
- [x] `unused + expires_at > now()` is shown as usable.
- [x] `unused + expires_at <= now()` is shown as expired.
- [x] Used credits remain shown as used.
- [x] Refunded credits remain shown as refunded.
- [x] Failed credits remain shown as failed.
- [x] Expired credits do not show the draw CTA.
- [x] Expired credits are excluded from `/gacha/:id/play` usable credit count.
- [x] `/gacha/:id/play` shows an expired-credit guide if relevant.
- [x] `draw_gacha()` does not select expired credits.
- [x] If only expired unused credits exist, draw RPC returns a clear error.
- [x] Expiration does not decrement `draw_products.sold_count`.
- [ ] Admin can run `expire_unused_draw_credits()` manually.
- [ ] `expire_unused_draw_credits()` changes `unused + expires_at <= now()` credits to `expired`.
- [ ] `expire_unused_draw_credits()` returns the processed credit count.
- [ ] Expiration synchronization does not change `draw_products.sold_count`.
- [ ] Expiration synchronization does not change `inventory_units`, `draw_results`, or `draw_logs`.
- [x] Automatic `unused → expired` batch/cron is not implemented.
- [x] Refund request feature is MVP manual status management only, not PG refund automation.

## 5.1 Refund Request QA

- [ ] `/my/draws` shows refund request CTA only for `unused + expires_at > now()` credits.
- [ ] `/my/draws` does not show refund request CTA for used credits.
- [ ] `/my/draws` does not show refund request CTA for expired credits.
- [ ] `/my/draws` does not show refund request CTA for refunded credits.
- [ ] User can enter refund reason and create a refund request.
- [ ] Refund request creation keeps `user_draw_credits.status = unused`.
- [ ] Active refund request is shown as `환불 요청 중` or `환불 승인됨`.
- [ ] Credit with active refund request is excluded from `/gacha/:id/play` usable credit count.
- [ ] `draw_gacha()` does not select credits with active refund requests.
- [ ] Duplicate active refund requests are blocked for the same credit.
- [ ] User can cancel only their own `requested` refund request.
- [ ] Admin can open `/admin/refunds`.
- [ ] `/admin/refunds` shows requester, gacha, credit, reason, status, requested date, and processed date.
- [ ] Admin can change `requested → approved`.
- [ ] Admin can change `requested → rejected`.
- [ ] Admin can change `approved → processed`.
- [ ] Admin can change `approved → rejected`.
- [ ] `processed` changes linked `user_draw_credits.status = refunded`.
- [ ] `processed` decrements linked `draw_products.sold_count` by 1.
- [ ] Re-processing an already processed refund is rejected and does not decrement sold_count again.
- [ ] Refund processing does not change `inventory_units`.

## 6. UI, Responsive, And Theme QA

- [x] Dark theme is applied by default.
- [x] Light/dark theme toggle works.
- [x] Theme choice persists after refresh.
- [x] Header does not wrap awkwardly on mobile.
- [x] Mobile menu opens and closes correctly.
- [x] `/gacha` card layout is readable on mobile.
- [x] `/gacha` card layout uses available width on desktop.
- [x] `/gacha/:id` detail layout is readable on mobile.
- [x] `/gacha/:id/play` result UI is readable on mobile.
- [x] `/cart` quantity controls are touch-friendly.
- [x] `/my` dashboard cards stack cleanly on mobile.
- [x] `/my/draws` expiration metadata fits on mobile.
- [x] `/my/items` cards are readable on mobile.
- [x] `/claim` item selection is touch-friendly.
- [x] `/claim` delivery form does not overflow on mobile.
- [x] Admin cards are usable on mobile.
- [x] CTA buttons have sufficient contrast in dark theme.
- [x] Status badges have sufficient contrast in both themes.

## 7. Vercel And Supabase Cloud QA

- [x] Vercel has `VITE_SUPABASE_URL`.
- [x] Vercel has `VITE_SUPABASE_ANON_KEY`.
- [x] No service role key is exposed to Vite.
- [x] Google OAuth returns to the Vercel production domain.
- [x] Supabase Cloud URL configuration includes Vercel domain.
- [x] Google Cloud Authorized JavaScript origins include Vercel domain.
- [x] Google Cloud Authorized redirect URIs include Supabase Cloud callback URL.
- [x] OAuth creates profiles in Supabase Cloud.
- [x] Cloud DB creates orders after test checkout.
- [x] Cloud DB creates order_items after test checkout.
- [x] Cloud DB creates user_draw_credits after test checkout.
- [x] Cloud DB creates user_draw_credits.expires_at.
- [x] Cloud DB creates credit_issuances after test checkout.
- [x] Cloud DB creates draw_results after draw.
- [x] Cloud DB creates draw_logs after draw.
- [x] Cloud DB creates claim_requests after claim submission.
- [x] Cloud DB creates claim_request_items after claim submission.
- [x] Admin screens can read Cloud data.
- [x] Vercel refresh on nested routes does not show 404.

## 8. Known Risks

- [ ] Real PG payment integration is not implemented.
- [ ] Ticket draw execution is still placeholder.
- [ ] Automatic credit expiration batch/cron is not implemented.
- [ ] Refund request flow is MVP status management only; actual PG refund is not implemented.
- [ ] Server-side pagination is not implemented for admin lists.
- [ ] Most admin create/update/delete CMS features are not implemented.
- [ ] Real QR image rendering is not implemented.
- [ ] Notification before credit expiration is not implemented.
- [ ] Legal wording for expiration/refund policy still needs review before production.

## 9. Current Verification Log

Update this section after each QA pass.

### 2026-06-04 Manual MVP QA

- [x] User flow QA completed.
- [x] Admin flow QA completed.
- [x] Vercel production environment checked.
- [x] Supabase Cloud data flow checked.
- [x] Mobile responsive layout checked.
- [x] Dark/light theme behavior checked.
- [x] QA issue found during draw result flow: remaining credit button showed `남은 가챠권 없음` after one draw from two credits.
- [x] QA issue fixed in commit `da39927 fix: 추첨 결과 화면 남은 가챠권 표시 수정`.

Remaining risks:

- Real PG payment integration is not implemented.
- Ticket draw execution is still placeholder.
- Refund request flow is MVP status management only; actual PG refund is not implemented.
- Automatic credit expiration batch/cron is not implemented.
- Most admin create/update/delete CMS features are not implemented.
- Real QR image rendering is not implemented.
- Legal wording for expiration/refund policy still needs review before production.

Next recommended work:

1. Reconfirm guide, policy, fairness, refund, shipping, and FAQ content after deployment.
2. Reconfirm Vercel deployment after content changes.
3. Decide next feature: order/claim detail, refund request, admin CMS, or ticket phase 2.

### 2026-06-04 Guide/Policy Content Pass

- [x] `/draw` content updated for gacha/ticket differences.
- [x] `/guide` content updated for MVP usage flow.
- [x] `/fairness` content updated for server-side draw and probability policy.
- [x] `/policy/refund` content updated for unused credit, expiration, and temporary refund guidance.
- [x] `/policy/shipping` content updated for delivery, pickup, and pickup code guidance.
- [x] `/faq` content updated with MVP user questions.
- [ ] Reconfirm these pages on Vercel after deploy.

### 2026-06-04

- [x] `npm run build` passed.
- [x] `npm run lint` passed.
- [x] Route imports are covered by TypeScript/Vite build.
- [x] No code-level route import error found during build.
- [x] Manual Google OAuth login check completed.
- [x] Manual Vercel production flow check completed.
- [x] Manual Supabase Cloud data mutation check completed.
