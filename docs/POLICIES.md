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
System checks unused credits
  ↓
Admin reviews request
  ↓
Credit status changes to refunded
  ↓
Order status changes to refunded
```

Actual payment refund automation is excluded from MVP.

refund_requests.status values:

- requested: user requested a refund.
- approved: admin approved the refund.
- rejected: admin rejected the refund.
- canceled: user canceled the refund request.
- processed: actual refund processing is complete.

The MVP uses manual admin processing for refunds.

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
- The UI can later render the pickup_qr_code string as a QR code.
- Admin checks the pickup code during pickup.
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

## 9. Claim Request Policy

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

## 10. Admin Result Modification Policy

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

## 11. Failure Recovery Policy

If a draw request fails, recovery must prioritize preventing duplicate results.

Priority order:

1. If a completed draw_result exists, show the existing result.
2. If no result exists and credit is unused, allow retry.
3. If inventory is reserved but not completed, release reservation after timeout.
4. If state is unclear, mark as recoverable and require admin review.

Admin review must not allow changing confirmed winning results.

## 12. FAQ Topics

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
