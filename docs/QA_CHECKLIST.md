# MVP QA Checklist

This checklist is for validating the current React + Supabase + Vercel MVP before adding larger features.

Use it for local Supabase, Supabase Cloud, and Vercel production checks. Mark items manually after testing.

## 1. User Flow QA

### Authentication

- [ ] Google OAuth login completes successfully.
- [ ] After login, the Header shows the user's display name or email.
- [ ] Logout clears the user state and updates the Header.
- [ ] A first-time OAuth user gets a matching `profiles` row.

### Gacha Browse And Purchase

- [ ] `/gacha` shows active gacha products from Supabase.
- [ ] `/gacha` product cards show title, description, price, status, sold count, purchase quantity, and grade counts.
- [ ] `/gacha` prioritizes `구매 가능 수량`.
- [ ] `/gacha` does not show hidden products.
- [ ] `/gacha/:id` shows the selected gacha detail.
- [ ] `/gacha/:id` distinguishes `구매 가능 수량` and `남은 뽑기 재고`.
- [ ] `/gacha/:id` shows grade probabilities based on available inventory units.
- [ ] `/gacha/:id` shows included reward items.
- [ ] Non-logged-in users see a login action before adding to cart.
- [ ] Logged-in users can add an active gacha product to the cart.
- [ ] A sold_out or hidden product cannot be newly added to cart.

### Cart And Test Checkout

- [ ] `/cart` shows the current user's cart items only.
- [ ] Cart item quantity can be increased.
- [ ] Cart item quantity can be decreased.
- [ ] Cart item can be removed.
- [ ] Quantity cannot exceed `remaining_purchase_quantity`.
- [ ] Cart summary shows total quantity and total amount.
- [ ] Test checkout is blocked when the cart is empty.
- [ ] Test checkout creates `orders`.
- [ ] Test checkout creates `order_items`.
- [ ] Test checkout creates `user_draw_credits`.
- [ ] Test checkout creates `credit_issuances`.
- [ ] Test checkout increases `draw_products.sold_count` by issued credit quantity.
- [ ] Test checkout does not decrement `inventory_units.available`.
- [ ] Checkout complete UI links to `/my/draws`.

### My Page And Credits

- [ ] `/my` shows profile information.
- [ ] `/my` shows activity summary cards.
- [ ] `/my` links to `/my/draws`.
- [ ] `/my` links to `/my/items`.
- [ ] `/my` links to `/my/claims`.
- [ ] `/my` links to `/cart`.
- [ ] `/my/draws` shows owned draw credits.
- [ ] `/my/draws` shows credit issue date.
- [ ] `/my/draws` shows credit expiration date.
- [ ] `/my/draws` shows remaining days.
- [ ] `/my/draws` shows usable, used, expired, refunded, and failed states correctly.
- [ ] `/my/draws` only shows `뽑기하러 가기` for usable credits.

### Gacha Draw

- [ ] `/gacha/:id/play` is protected for logged-in users.
- [ ] `/gacha/:id/play` shows usable credit count.
- [ ] `/gacha/:id/play` excludes expired credits from usable credit count.
- [ ] `/gacha/:id/play` shows an expired-credit guide if expired unused credits exist.
- [ ] `/gacha/:id/play` shows remaining draw inventory.
- [ ] Draw button is disabled when no usable credit exists.
- [ ] Draw button is disabled when no available inventory remains.
- [ ] Draw execution calls the server RPC.
- [ ] Draw execution does not generate results on the client.
- [ ] Successful draw changes `user_draw_credits.status` to `used`.
- [ ] Successful draw changes one `inventory_units.status` to `drawn`.
- [ ] Successful draw creates `draw_results`.
- [ ] Successful draw creates `draw_logs`.
- [ ] Result reveal UI shows reward name, grade, theme, draw time, and verification code.
- [ ] After draw, `/my/draws` shows the credit as used.

### Won Item Box And Claim

- [ ] `/my/items` shows the current user's draw results.
- [ ] `/my/items` shows reward name, grade, theme, gacha name, draw date, status, and verification code.
- [ ] `/my/items` shows claim status derived from claim linkage.
- [ ] `/claim` shows claimable stored items.
- [ ] `/claim` excludes or disables already requested items.
- [ ] `/claim` allows selecting at least one item.
- [ ] `/claim` supports delivery method.
- [ ] `/claim` supports pickup method.
- [ ] Delivery claim requires recipient name, phone, postal code, address, and detailed address.
- [ ] Pickup claim explains pickup code usage.
- [ ] Claim creation creates `claim_requests`.
- [ ] Claim creation creates `claim_request_items`.
- [ ] One draw result cannot be claimed twice.
- [ ] `/my/claims` shows the user's claim requests.
- [ ] `/my/claims` shows request method, status, request date, and item count.

## 2. Admin Flow QA

### `/admin/users`

- [ ] Admin can open `/admin/users`.
- [ ] User list shows profile ID, display name, avatar, role, created date, and updated date.
- [ ] User summary shows order count.
- [ ] User summary shows unused credit count.
- [ ] User summary shows used credit count.
- [ ] User summary shows draw result count.
- [ ] User summary shows claim request count.
- [ ] Search by user name works.
- [ ] Search by user ID works.
- [ ] Role filter works.
- [ ] Credit presence filter works.

### `/admin/orders`

- [ ] Admin can open `/admin/orders`.
- [ ] Orders list shows order ID, user, status, total amount, created date, and paid date.
- [ ] Order cards show order item list.
- [ ] Order cards show gacha name, quantity, unit price, line total, and credit amount.
- [ ] Credit issuance quantity is shown.
- [ ] Order search by order ID works.
- [ ] Order search by user works.
- [ ] Order status filter works.
- [ ] No order update/delete UI exists.

### `/admin/gacha`

- [ ] Admin can open `/admin/gacha`.
- [ ] Gacha list includes hidden and non-active products.
- [ ] Each card shows raw status and user-facing status.
- [ ] Each card shows `sales_limit`.
- [ ] Each card shows `sold_count`.
- [ ] Each card shows `신규 구매 가능 수량`.
- [ ] Each card shows `미추첨 재고`.
- [ ] Each card shows `전체 재고`.
- [ ] Grade counts and probabilities are shown.
- [ ] Included reward item list is shown.
- [ ] Search and filters work.
- [ ] No gacha create/update/delete UI exists.

### `/admin/items`

- [ ] Admin can open `/admin/items`.
- [ ] Reward item list shows item ID, name, description, grade, theme, created date, and updated date.
- [ ] Included gacha pool information is shown.
- [ ] Inventory status counts are shown.
- [ ] Search by item name works.
- [ ] Search by description works.
- [ ] Grade filter works.
- [ ] Theme filter works.
- [ ] Inventory presence filter works.
- [ ] No reward item create/update/delete UI exists.

### `/admin/pools`

- [ ] Admin can open `/admin/pools`.
- [ ] Pool list shows draw product ID, name, type, status, price, theme, sales limit, and sold count.
- [ ] Pool list shows `신규 구매 가능 수량`.
- [ ] Pool list shows available and total inventory counts.
- [ ] Pool item list shows configured quantity.
- [ ] Pool item list shows actual inventory quantity.
- [ ] Pool item list shows inventory counts by status.
- [ ] Quantity mismatch warning appears when configured quantity and actual inventory differ.
- [ ] Grade composition rate is shown.
- [ ] Available probability is shown.
- [ ] Search and filters work.
- [ ] No pool or inventory mutation UI exists.

### `/admin/draw-logs`

- [ ] Admin can open `/admin/draw-logs`.
- [ ] Draw log list shows log ID, result ID, user, gacha, reward, grade, status, inventory ID, request ID, and created date.
- [ ] Verification-related IDs are shortened.
- [ ] Payload is summarized and not overexposed.
- [ ] Search by gacha works.
- [ ] Search by user works.
- [ ] Grade filter works.
- [ ] Status filter works.
- [ ] No draw log update/delete UI exists.
- [ ] No draw result update/delete UI exists.

### `/admin/claims`

- [ ] Admin can open `/admin/claims`.
- [ ] Claim requests show request ID, user, method, status, created date, item count, and item list.
- [ ] Delivery claims show recipient and address information.
- [ ] Delivery claims can transition `requested → preparing`.
- [ ] Delivery claims can transition `preparing → shipping`.
- [ ] Delivery claims can transition `shipping → completed`.
- [ ] Shipping transition can store tracking number if provided.
- [ ] Pickup claims show `pickup_qr_code`.
- [ ] Pickup claims can transition `requested → preparing`.
- [ ] Pickup claims can transition `preparing → ready_for_pickup`.
- [ ] Pickup claims can transition `ready_for_pickup → completed`.
- [ ] Completed claim updates `claim_requests.status = completed`.
- [ ] Completed claim updates linked `draw_results.status = claimed`.
- [ ] Completed claim updates linked `inventory_units.status = claimed`.
- [ ] User `/my/items` shows claimed state after completion.
- [ ] User `/my/claims` shows completed state after completion.

## 3. Permission And RLS QA

- [ ] Non-logged-in users cannot access `/cart`.
- [ ] Non-logged-in users cannot access `/my`.
- [ ] Non-logged-in users cannot access `/my/draws`.
- [ ] Non-logged-in users cannot access `/my/items`.
- [ ] Non-logged-in users cannot access `/my/claims`.
- [ ] Non-logged-in users cannot access `/claim`.
- [ ] Non-logged-in users cannot access `/gacha/:id/play`.
- [ ] Normal users cannot access `/admin/*`.
- [ ] Normal users cannot read another user's cart.
- [ ] Normal users cannot read another user's orders.
- [ ] Normal users cannot read another user's credits.
- [ ] Normal users cannot read another user's draw results.
- [ ] Normal users cannot read another user's claim requests.
- [ ] Admin users can read operational admin screens.
- [ ] Users cannot directly update `draw_results`.
- [ ] Users cannot directly update `draw_logs`.
- [ ] Admins cannot update or delete `draw_logs`.
- [ ] Admins cannot arbitrarily modify winning results in `draw_results`.
- [ ] Admins cannot modify result-related `inventory_units` fields after draw.
- [ ] Claim status changes are performed through admin RPC.
- [ ] Claim status RPC rejects non-admin users.
- [ ] Draw RPC validates `auth.uid()`.
- [ ] Checkout RPC validates `auth.uid()`.

## 4. Stock And Purchase Quantity QA

- [ ] Purchase quantity uses `min(sales_limit - sold_count, available_inventory_count)`.
- [ ] Buying one gacha credit increases `sold_count` by 1.
- [ ] Buying multiple gacha credits increases `sold_count` by issued credit quantity.
- [ ] Buying credits does not immediately decrement `inventory_units.available`.
- [ ] Drawing changes one `inventory_units.status` from `available` to `drawn`.
- [ ] User screens prioritize `구매 가능 수량`.
- [ ] User screens use `남은 뽑기 재고` only as draw inventory context.
- [ ] Cart quantity cannot exceed purchase quantity.
- [ ] Checkout revalidates purchase quantity inside RPC.
- [ ] `sold_out` blocks new purchases.
- [ ] Existing usable credits can draw a sold_out product if inventory remains.
- [ ] Draw is blocked when available inventory is 0.
- [ ] Admin screens distinguish `판매된 가챠권`, `신규 구매 가능 수량`, `미추첨 재고`, and `전체 재고`.

## 5. Draw Credit Expiration QA

- [ ] Test checkout creates `user_draw_credits.expires_at`.
- [ ] Newly issued `expires_at` is 30 days after checkout.
- [ ] Existing credits are backfilled with `created_at + 30 days`.
- [ ] `/my/draws` shows issue date.
- [ ] `/my/draws` shows expiration date.
- [ ] `/my/draws` shows remaining days.
- [ ] `unused + expires_at > now()` is shown as usable.
- [ ] `unused + expires_at <= now()` is shown as expired.
- [ ] Used credits remain shown as used.
- [ ] Refunded credits remain shown as refunded.
- [ ] Failed credits remain shown as failed.
- [ ] Expired credits do not show the draw CTA.
- [ ] Expired credits are excluded from `/gacha/:id/play` usable credit count.
- [ ] `/gacha/:id/play` shows an expired-credit guide if relevant.
- [ ] `draw_gacha()` does not select expired credits.
- [ ] If only expired unused credits exist, draw RPC returns a clear error.
- [ ] Expiration does not decrement `draw_products.sold_count`.
- [ ] Automatic `unused → expired` batch/cron is not implemented.
- [ ] Refund feature is not implemented.

## 6. UI, Responsive, And Theme QA

- [ ] Dark theme is applied by default.
- [ ] Light/dark theme toggle works.
- [ ] Theme choice persists after refresh.
- [ ] Header does not wrap awkwardly on mobile.
- [ ] Mobile menu opens and closes correctly.
- [ ] `/gacha` card layout is readable on mobile.
- [ ] `/gacha` card layout uses available width on desktop.
- [ ] `/gacha/:id` detail layout is readable on mobile.
- [ ] `/gacha/:id/play` result UI is readable on mobile.
- [ ] `/cart` quantity controls are touch-friendly.
- [ ] `/my` dashboard cards stack cleanly on mobile.
- [ ] `/my/draws` expiration metadata fits on mobile.
- [ ] `/my/items` cards are readable on mobile.
- [ ] `/claim` item selection is touch-friendly.
- [ ] `/claim` delivery form does not overflow on mobile.
- [ ] Admin cards are usable on mobile.
- [ ] CTA buttons have sufficient contrast in dark theme.
- [ ] Status badges have sufficient contrast in both themes.

## 7. Vercel And Supabase Cloud QA

- [ ] Vercel has `VITE_SUPABASE_URL`.
- [ ] Vercel has `VITE_SUPABASE_ANON_KEY`.
- [ ] No service role key is exposed to Vite.
- [ ] Google OAuth returns to the Vercel production domain.
- [ ] Supabase Cloud URL configuration includes Vercel domain.
- [ ] Google Cloud Authorized JavaScript origins include Vercel domain.
- [ ] Google Cloud Authorized redirect URIs include Supabase Cloud callback URL.
- [ ] OAuth creates profiles in Supabase Cloud.
- [ ] Cloud DB creates orders after test checkout.
- [ ] Cloud DB creates order_items after test checkout.
- [ ] Cloud DB creates user_draw_credits after test checkout.
- [ ] Cloud DB creates user_draw_credits.expires_at.
- [ ] Cloud DB creates credit_issuances after test checkout.
- [ ] Cloud DB creates draw_results after draw.
- [ ] Cloud DB creates draw_logs after draw.
- [ ] Cloud DB creates claim_requests after claim submission.
- [ ] Cloud DB creates claim_request_items after claim submission.
- [ ] Admin screens can read Cloud data.
- [ ] Vercel refresh on nested routes does not show 404.

## 8. Known Risks

- [ ] Real PG payment integration is not implemented.
- [ ] Ticket draw execution is still placeholder.
- [ ] Automatic credit expiration batch/cron is not implemented.
- [ ] Refund request flow is not implemented.
- [ ] Server-side pagination is not implemented for admin lists.
- [ ] Most admin create/update/delete CMS features are not implemented.
- [ ] Real QR image rendering is not implemented.
- [ ] Notification before credit expiration is not implemented.
- [ ] Legal wording for expiration/refund policy still needs review before production.
- [ ] Manual browser QA is still required for OAuth/Vercel flows.

## 9. Current Verification Log

Update this section after each QA pass.

### 2026-06-04

- [x] `npm run build` passed.
- [x] `npm run lint` passed.
- [x] Route imports are covered by TypeScript/Vite build.
- [x] No code-level route import error found during build.
- [ ] Manual Google OAuth login check required.
- [ ] Manual Vercel production flow check required.
- [ ] Manual Supabase Cloud data mutation check required.
