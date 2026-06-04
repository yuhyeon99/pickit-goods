# Draw Logic

## 1. Core Principle

Draw results must never be generated on the React client.

The client only sends a request to perform a draw.

For the first MVP, only gacha draw is implemented end to end. Ticket draw logic is deferred to the second phase, and ticket pages are placeholder UI only.

The server must:

1. Verify the user
2. Verify the user's unused and unexpired draw credit
3. Select one available inventory unit using a secure random method
4. Mark the inventory unit as drawn
5. Mark the draw credit as used
6. Store draw result
7. Store draw log
8. Return the confirmed result

## 2. Recommended Architecture

```txt
React client
  ↓ request draw
Supabase Edge Function
  ↓ validate auth
Postgres RPC / transaction
  ↓ lock and select inventory
Postgres tables
  ↓ result stored
Supabase Edge Function
  ↓ response
React client
```

## 3. Random Generation Method

Use cryptographically secure random generation on the server side.

Recommended in Supabase Edge Function:

```ts
const array = new Uint32Array(1);
crypto.getRandomValues(array);
const randomValue = array[0];
```

Use the random value to select an index from available inventory units.

Do not expose raw random seeds to users.

## 4. Public Verification Code

For user trust, provide a safe public verification code.

Example:

```txt
DRAW-2026-000001-AB12CD
```

This code can be displayed in My Page and draw result detail page.

It should not reveal:

- Raw random value
- Internal seed
- Inventory snapshot data
- Other users' results

## 5. Audit Data

Store enough audit data in draw_logs:

- request_id
- user_id
- draw_product_id
- draw_credit_id
- random_method
- random_seed_hash
- available_inventory_count
- inventory_snapshot_hash
- selected_inventory_unit_id
- payload jsonb for structured internal audit data
- result id
- event type
- error message if failed

## 6. Gacha Draw Flow

```txt
1. User clicks draw button
2. Client calls perform-gacha-draw Edge Function
3. Server checks authenticated user
4. Server checks unused gacha credit with `expires_at > now()`
5. Server checks draw product status
6. Server checks available inventory units
7. Server generates secure random value
8. Server selects one inventory unit
9. Server stores draw log: started
10. Server updates inventory unit: available → drawn
11. Server updates credit: unused → used
12. Server creates draw_result
13. Server stores draw log: completed
14. Server returns reward result to client
15. Client shows capsule/ball result animation
```

## 7. Ticket Draw Flow

Ticket draw execution is not included in the first MVP. The first MVP includes ticket routes and placeholder UI only.

MVP ticket slot policy:

- The selected slot number is UX-only.
- The selected slot number does not directly identify a reward item.
- The same slot number may be selected by multiple users.
- No ticket_slots table is required in the first MVP.
- In the second phase, the server must match the result fairly at selection time using available inventory.

```txt
1. User opens ticket play page
2. User selects numbered slot
3. Client calls perform-ticket-draw Edge Function with selected slot number
4. Server checks authenticated user
5. Server checks unused ticket credit
6. Server checks slot number validity
7. Server checks draw product status
8. Server checks available inventory units
9. Server generates secure random value
10. Server selects one inventory unit at selection time
11. Server stores draw log: started
12. Server updates inventory unit: available → drawn
13. Server updates credit: unused → used
14. Server creates draw_result with ticket_slot_no
15. Server stores draw log: completed
16. Server returns reward result to client
17. Client flips selected number card and shows result
```

## 8. Inventory Selection

Inventory selection should be based on available inventory units.

```txt
available_inventory_units = inventory_units
  where draw_product_id = current draw product
  and status = 'available'
```

Then select one item using secure random index.

```txt
selected_index = secure_random_value % available_inventory_units.length
```

## 9. Duplicate Draw Prevention

Must prevent:

- Same credit used twice
- Same inventory unit drawn twice
- Same request creating duplicate result

Recommended safeguards:

- Unique request_id per draw attempt
- DB transaction or RPC
- Row-level locking in Postgres RPC
- Check credit status inside transaction
- Check inventory status inside transaction
- Unique constraint on draw_credit_id in draw_results
- Unique constraint on inventory_unit_id in draw_results

## 10. Failure Recovery

Draw failure cases:

### Case 1. Request failed before credit was used

Action:

- Keep credit as unused
- Store failed log if possible
- User can retry

### Case 2. Credit used and result stored, but client did not receive response

Action:

- Do not draw again
- Show existing result from draw_results
- Mark as completed

### Case 3. Inventory reserved but transaction failed before completion

Action:

- Roll back transaction if possible
- If reserved state remains, scheduled cleanup can release expired reservations

### Case 4. Unknown state

Action:

- Mark as recoverable
- Admin can inspect logs
- Admin cannot change winning result
- If no result exists and credit is still unused, user can retry

## 11. Sold Out Handling

Purchase availability and draw availability are separate.

New purchases must stop when:

```txt
sold_count >= sales_limit
or
available_count = count inventory_units where status = 'available' is 0
```

sold_count is the number of credits issued after paid checkout.

Examples:

```txt
Gacha 1 draw credit purchase: sold_count + 1
Gacha 10 draw credit purchase: sold_count + 10
Theme ticket 5-pack purchase: sold_count + 5
```

If a draw product reaches either new purchase stop condition:

```txt
update draw_products set status = 'sold_out'
```

Draw execution for existing credits:

```txt
If draw_product.status = 'sold_out'
and available inventory remains
and the user has an unused, unexpired matching credit
then draw is still allowed.
```

If no available inventory remains, draw must be blocked and recovery/refund handling should be shown.

User-facing availability labels:

```txt
active -> 판매중
sold_out + available inventory remains -> 구매마감 · 보유권 사용 가능
sold_out + no available inventory -> 품절
hidden -> not shown on user-facing screens
```

sold_out means new purchases are not allowed. Draw is still allowed only when available inventory remains and the user has an unused, unexpired matching credit.

## 12. Draw Credit Expiration

Gacha credits expire 30 days after checkout.

Checkout behavior:

```txt
checkout_cart()
  ↓
user_draw_credits inserted
  ↓
expires_at = now() + interval '30 days'
```

Draw behavior:

```txt
draw_gacha()
  ↓
select unused credit
  ↓
require expires_at > now()
```

If a user has only expired unused credits for a product, draw_gacha must reject the draw with a user-facing message that expired credits cannot be used.

Expiration does not:

- Restore draw_products.sold_count.
- Select or deduct inventory_units.
- Automatically refund the user.

Automatic unused → expired synchronization is not implemented yet. UI and draw RPC treat `status = unused and expires_at <= now()` as expired.

## 13. Probability Calculation

Displayed probability should be calculated from available inventory units.

Example:

```txt
S grade available: 1
A grade available: 9
B grade available: 30
C grade available: 60
Total available: 100

S = 1 / 100 = 1%
A = 9 / 100 = 9%
B = 30 / 100 = 30%
C = 60 / 100 = 60%
```

If inventory changes, displayed probability should be refreshed.

## 14. Client UI Rules

The client can:

- Show animation
- Show draw button
- Show selected ticket slot
- Show returned result
- Show public verification code

The client cannot:

- Generate random result
- Update inventory
- Mark credit as used directly
- Create draw_result directly
- Modify draw_logs

## 15. Admin Rules

Admins can:

- Create draw products
- Create reward items
- Create inventory units
- View draw results
- View draw logs
- Process claim requests
- Update claim request status

Admins cannot:

- Modify winning reward item after draw completion
- Reassign result item
- Update draw_results
- Update draw_logs
- Update inventory_units.drawn_by
- Update inventory_units.draw_result_id
- Update result-related inventory fields after inventory_units.status becomes drawn
- Delete draw audit logs in normal operation
