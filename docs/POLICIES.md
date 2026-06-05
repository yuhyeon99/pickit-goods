# Policies

## 1. Probability Disclosure Policy

The service must disclose probability information for each gacha or ticket product.

Displayed information:

- Total available reward count
- Grade list
- Remaining count by grade
- Probability by grade
- Reward item list by grade
- Sold out status
- Last updated time

Default grade policy:

| Grade | Description | Initial Count Example | Initial Probability Example |
|---|---|---:|---:|
| S | Highest prize | 1 | 1% |
| A | Premium prize | 9 | 9% |
| B | Standard prize | 30 | 30% |
| C | Common prize | 60 | 60% |

Probability is calculated based on remaining available inventory units.

If inventory changes, actual probability can change.

## 2. Fairness Policy

The fairness guide page should explain:

```txt
- Draws are processed on the server.
- The client cannot decide the result.
- Secure random generation is used.
- Results and logs are stored after each draw.
- Inventory is deducted after each completed draw.
- Admins cannot modify winning results.
- Users can check their draw history and public verification code.
```

Do not expose raw random seeds or internal inventory snapshots.

Safe public information:

- Draw date/time
- Draw product name
- Reward item name
- Grade
- Public verification code
- Draw type

Internal-only information:

- Raw random values
- Seed
- Snapshot hash details
- Other users' data
- Internal request IDs if sensitive

## 3. Minor User Policy

MVP does not block minors from signing up, purchasing, or using draw credits.

However, policy pages should include:

- Users are responsible for complying with local rules and guardian consent if required.
- The service may later add age verification or purchase restrictions.

## 4. Refund Policy

Refunds are allowed only when draw credits are unused.

Refund allowed:

```txt
- User purchased gacha/ticket credits
- Credits are still unused
- No draw result has been created
```

Refund not allowed:

```txt
- Credit has already been used
- Draw result has already been confirmed
- Reward item has been assigned
- Claim request has already been submitted
```

MVP refund flow:

```txt
User requests refund
  ↓
System creates refund_requests row
  ↓
System checks unused and unexpired draw credit
  ↓
Admin reviews request
  ↓
Admin marks request as processed
  ↓
Credit status changes to refunded
  ↓
draw_products.sold_count decreases by 1
```

Actual payment refund automation is excluded from MVP.
The MVP does not automatically cancel the original payment or change the order status.

refund_requests.status values:

- requested: user requested a refund.
- approved: admin approved the refund.
- rejected: admin rejected the refund.
- canceled: user canceled the refund request.
- processed: actual refund processing is complete.

The MVP uses manual admin processing for refunds.

Implemented MVP refund request rules:

- Users can create a refund request for `unused` credits only while `expires_at > now()`.
- Refund requests are created in `refund_requests` and the credit remains `unused` until admin processing is completed.
- Active duplicate requests are blocked for the same credit while the request is `requested`, `approved`, or `processed`.
- Rejected or canceled requests may be requested again while the credit is still unused and unexpired.
- Admin processing uses `/admin/refunds` and the `update_refund_request_status` RPC.
- When a request becomes `processed`, the linked `user_draw_credits.status` changes to `refunded` and `refunded_at` is set.
- When an unused credit refund becomes `processed`, the linked `draw_products.sold_count` is decreased by 1.
- `inventory_units`, `draw_results`, and `draw_logs` are not changed by refund processing.

Public-facing policy wording in the MVP is temporary guidance. Refund, expiration, delivery, and pickup wording must be reviewed and finalized before production launch.

Draw credit expiration and refunds:

- Draw credits are valid for 30 days after paid checkout.
- Unused draw credits may request refund within the valid period.
- Used draw credits cannot be refunded.
- Expired draw credits cannot be used for drawing.
- Expiration does not automatically restore draw_products.sold_count.
- Processed refunds for unused credits do restore draw_products.sold_count by 1.
- Admins can manually synchronize `unused` credits with `expires_at <= now()` to `expired` through `expire_unused_draw_credits()`.
- Public refund/expiration wording must be reviewed before production launch because it can involve consumer protection requirements.

## 5. Exchange Policy

Exchange is allowed only for product issues after reward confirmation.

Allowed cases:

- Damaged product
- Wrong product delivered
- Missing item
- Product condition clearly differs from described condition

Not allowed cases:

- User dislikes random result
- User wants another grade
- User changed their mind after draw
- Minor packaging differences unless severe

If the same item is out of stock, the admin may offer:

1. Same-grade replacement
2. Equivalent alternative
3. Manual refund after review

## 6. Shipping Policy

Users can request delivery for won items.

Requirements:

- Multiple won items can be bundled into one delivery request.
- User must provide recipient name, phone number, and address.
- Admin can update status.
- Tracking number can be added manually.

claim_method and status are used together.

Delivery flow:

```txt
requested
preparing
shipping
completed
canceled
```

## 7. On-site Pickup Policy

Users can choose on-site pickup.

Requirements:

- A pickup verification code must be generated for pickup.
- The first MVP does not store QR image files.
- claim_requests.pickup_qr_code stores a verifiable text code.
- Example codes: PICKUP-CLAIM-000001, PICKUP-{claim_request_id}.
- The UI renders a QR code that opens `/admin/claims?pickupCode=...` for admin verification.
- The pickup code text remains visible for manual verification.
- QR scanning does not automatically complete pickup.
- Admin checks the pickup code and request details during pickup.
- Pickup status changes to completed after handover.

Pickup flow:

```txt
requested
preparing
ready_for_pickup
completed
canceled
```

Advanced QR scan/verification is deferred.

## 8. Inventory Sold Out Policy

Each draw product has a sales limit, default 100.

Purchase availability and draw availability are separate.

New purchases stop when:

```txt
available inventory count = 0
or
sold_count >= sales_limit
```

sold_count is based on issued credit count after paid checkout:

```txt
Gacha 1 draw credit purchase -> sold_count + 1
Gacha 10 draw credit purchase -> sold_count + 10
Theme ticket 5-pack purchase -> sold_count + 5
```

When sold out:

- Product card shows sold out badge.
- Add to cart is disabled.
- Checkout must reject new purchases for the product.
- Draw play is allowed for users who already own valid unused credits if inventory remains.
- If no inventory remains, draw is blocked and recovery/refund handling is required.

User-facing availability labels:

- active: 판매중
- sold_out + available inventory remains: 구매마감 · 보유권 사용 가능
- sold_out + no available inventory: 품절
- hidden: user-facing screens do not show the product

Important rules:

- sold_out means new purchases are not allowed.
- sold_out does not always mean draw is blocked.
- If sold_out, available inventory remains, and the user has an unused matching credit, draw is allowed.
- If available inventory is 0, draw is not allowed.

Inventory and credit expiration rules:

- inventory_units are deducted only when a draw is executed.
- Purchasing a draw credit increases sold_count but does not select or deduct a specific inventory unit.
- Processing a refund for an unused credit decreases sold_count by 1.
- A credit that expires does not reduce sold_count.
- For the MVP, sold_count represents paid checkout issued credits minus processed unused-credit refunds.
- Any physical inventory left after credit expiration is handled by a later operational policy, such as separate resale, event use, or disposal.

User-facing quantity wording:

- Purchase screens should prioritize "구매 가능 수량".
- Draw/play screens may show "남은 뽑기 재고".
- Admin screens should distinguish sold_count, remaining purchase quantity, available inventory count, and total inventory count.

## 9. Draw Credit Expiration Policy

MVP policy:

```txt
paid checkout
  ↓
user_draw_credits issued
  ↓
expires 30 days after checkout
  ↓
unused credit can be used or refunded within the valid period
  ↓
expired credit cannot be used
```

Rules:

- Validity period: 30 days from paid checkout.
- Unused credits may request refund within the valid period.
- Used credits are not refundable.
- Expired credits are not drawable.
- Expiration does not automatically restore sales capacity.
- sold_count is not decremented on expiration.
- sold_count is decremented only when an unused credit refund is processed by an admin.
- `expire_unused_draw_credits()` can manually change `unused + expires_at <= now()` credits to `expired`.
- Manual expiration synchronization does not modify sold_count, inventory_units, draw_results, or draw_logs.
- Automatic expiration jobs and notifications are not implemented yet.
- The draw RPC excludes expired credits by requiring `expires_at > now()`.
- The checkout RPC sets `expires_at = now() + interval '30 days'` when issuing credits.

UI requirements for `/my/draws`:

- Show credit issue date.
- Show expiration date.
- Show remaining days.
- Show whether the credit is usable or expired.
- Hide or disable "뽑기하러 가기" for expired credits.

Schema impact:

- `user_draw_credits.expires_at` is required.
- Keep user_draw_credits.status values: unused, used, expired, refunded, failed.

## 10. Claim Request Policy

Won items are first stored in the user's item box.

Users can select one or more unclaimed items and create a claim request.

```txt
Won item box
  ↓
Select items
  ↓
Select delivery or pickup
  ↓
Submit claim request
  ↓
Admin processes request
```

A draw result can only be included in one claim request.

Implementation requirements:

- claim_request_items.draw_result_id must be unique.
- Creating claim_requests and claim_request_items must happen in the same transaction.
- draw_results.status remains completed while a claim is pending.
- Pending claim state is determined by the existence of claim_request_items.
- draw_results.status changes to claimed only when admin completes the claim.
- Admin claim status changes must be performed through a server-side RPC with an admin role check.
- When a claim is completed, linked inventory_units.status changes to claimed.

## 11. Admin Result Modification Policy

Admins cannot modify confirmed winning results.

Admins can:

- View draw result
- View audit logs
- Process shipping or pickup
- Handle refund/exchange requests
- Manage themes
- Manage reward items
- Manage draw products
- Manage draw product pool configuration
- Manage policies and FAQ items
- Update claim request status

Admins cannot:

- Update draw_results
- Update draw_logs
- Change reward item
- Change grade
- Reassign winning inventory
- Update inventory_units.drawn_by
- Update inventory_units.draw_result_id
- Update result-related inventory fields after inventory_units.status becomes drawn
- Delete normal draw logs

## 12. Failure Recovery Policy

If a draw request fails, recovery must prioritize preventing duplicate results.

Priority order:

1. If a completed draw_result exists, show the existing result.
2. If no result exists and credit is unused, allow retry.
3. If inventory is reserved but not completed, release reservation after timeout.
4. If state is unclear, mark as recoverable and require admin review.

Admin review must not allow changing confirmed winning results.

## 13. FAQ Topics

Recommended FAQ categories:

- How gacha works
- How ticket draw works
- Difference between gacha and ticket
- Probability and fairness
- Refunds
- Exchanges
- Delivery
- On-site pickup
- Account/login
- Draw failure and recovery
