# Pickit Goods PRD

## 1. Service Overview

Pickit Goods is a random goods drawing MVP service.

Users can purchase or receive draw credits, then use them to obtain real-world goods through one of two draw methods:

1. Gacha draw
2. Ticket draw

For the first MVP, only gacha draw is implemented end to end. Ticket routes and placeholder UI are included, but actual ticket draw execution is deferred to the second phase.

The service supports both random pools and theme-specific pools. A theme may represent a specific animation, character group, event, or collection.

The service is built with React, Supabase, and Vercel.

## 2. Core Concept

```txt
User signs in with OAuth
  ↓
User browses gacha or ticket products
  ↓
User adds draw products to cart
  ↓
User completes test payment in MVP
  ↓
Draw credits are issued
  ↓
User performs gacha or ticket draw
  ↓
Reward item is confirmed
  ↓
Reward is stored in user's item box
  ↓
User requests delivery or on-site pickup
  ↓
Admin prepares and completes fulfillment
```

## 3. Draw Types

### 3.1 Gacha

```txt
Gacha
→ User pays for or owns a gacha credit
→ User performs immediate random draw
→ UI shows ball/capsule animation
→ Reward item is confirmed immediately
```

### 3.2 Ticket

Ticket draw is a second-phase feature. The first MVP includes ticket list/detail/play placeholder pages only.

```txt
Ticket
→ User purchases or owns a ticket
→ User selects a numbered slot
→ At the moment of selection, a reward is matched
→ The selected number changes into the result item number
```

MVP ticket slot policy:

- The selected ticket number is a UX-only number.
- The selected number does not directly identify or reserve a reward item.
- The same number may be selected by multiple users.
- At selection time, the server matches the result fairly from available inventory.
- No separate ticket_slots table is required for the first MVP.

## 4. Product Types

There are two major categories:

### 4.1 Draw Products

These are products the user can purchase or receive as credits.

Examples:

- Gacha 1 draw credit
- Gacha 10 draw credits
- Theme-specific ticket 5-pack
- Random ticket 1-pack

### 4.2 Reward Items

These are the actual goods users can win.

Examples:

- Figure
- Acrylic stand
- Keyring
- Sticker
- Poster
- Badge

Reward items are not directly added to the cart.

## 5. Cart Rule

The cart contains draw products only.

```txt
Cart items
❌ Figure
❌ Keyring
❌ Sticker
⭕ Gacha 1 draw credit
⭕ Gacha 10 draw credits
⭕ Theme ticket 5-pack
⭕ Random ticket 1-pack
```

## 6. Inventory Policy

This MVP uses real stock-based drawing.

```txt
Reward pool contains actual inventory units
  ↓
A user draws
  ↓
One available inventory unit is selected
  ↓
Selected inventory unit is changed to drawn
  ↓
Inventory is deducted
```

The default sales quantity is 100 units per draw product.

Purchase availability and draw availability are separate.

New purchases must stop when:

- sold_count reaches sales_limit
- available inventory count is 0

Existing unused credits can still be used even if the draw product is sold_out, as long as available inventory remains and the user_draw_credit is unused.

sold_count is based on the number of credits issued after paid checkout.

Examples:

- Buying a gacha 1 draw credit increases sold_count by 1.
- Buying a gacha 10 draw credit product increases sold_count by 10.
- Buying a theme ticket 5-pack increases sold_count by 5.

User-facing product availability labels:

- active: 판매중
- sold_out + available inventory remains: 구매마감 · 보유권 사용 가능
- sold_out + no available inventory: 품절
- hidden: not shown on user-facing screens

### 6.1 Draw Credit Expiration Policy

MVP draw credits should be managed with an expiration policy instead of deducting inventory at purchase time.

Policy decision:

- Draw credits are valid for 30 days after paid checkout.
- Unused draw credits may request refund within the valid period.
- Used draw credits cannot be refunded.
- Expired draw credits cannot be used for drawing.
- Expiration does not automatically restore draw_products.sold_count.
- Physical inventory that remains after credit expiration is handled later by admin policy, such as a separate resale event, campaign, or disposal.

Reasoning:

```txt
Purchase
→ user_draw_credits are issued
→ draw_products.sold_count increases
→ new purchase availability decreases

Draw execution
→ one inventory_units row is selected
→ inventory_units.status changes to drawn
```

At purchase time the winning reward is not determined, so a specific inventory unit must not be deducted. sold_count represents currently reflected paid sales rights, while inventory_units represents physical stock that is only consumed at draw execution.

For the first MVP, unused-credit refunds and expiration are handled differently.

- When an unused credit refund becomes processed, sold_count decreases by 1 and purchase availability recovers.
- When an unused credit simply expires, sold_count is not automatically restored.

Planned implementation impact:

- Add `user_draw_credits.expires_at`.
- Show issued date, expiration date, remaining days, and usable/expired state on `/my/draws`.
- Block draw execution for expired credits.
- Keep refund eligibility limited to unused and unexpired credits, with legal/policy review before public launch.

## 7. Theme Policy

Random products and theme-specific products must use separate inventory pools.

```txt
Random Gacha Pool
→ Contains goods from multiple themes

Theme Gacha Pool
→ Contains goods only from a specific theme

Random Ticket Pool
→ Contains goods from multiple themes

Theme Ticket Pool
→ Contains goods only from a specific theme
```

## 8. Grade Policy

Default reward grades:

| Grade | Meaning | Recommended Example Probability |
|---|---|---:|
| S | Highest prize | 1% |
| A | Premium prize | 9% |
| B | Standard prize | 30% |
| C | Common prize | 60% |

The actual probability must be calculated from the remaining available inventory units in each pool.

Example:

```txt
Available inventory count: 100
S grade: 1 item
A grade: 9 items
B grade: 30 items
C grade: 60 items
```

If inventory changes, the displayed probability should reflect the latest available inventory count.

## 9. Fairness Policy

The service must provide a fairness guide page and also apply fairness rules internally.

Core requirements:

- Draws are processed only on the server side.
- The client cannot generate or decide draw results.
- Cryptographically secure random generation must be used.
- Draw result logs must be stored.
- Inventory snapshots or enough audit data must be stored for verification.
- Admins cannot modify winning results.

## 10. Authentication Policy

Google OAuth login only for the first MVP.

Do not implement email/password login in MVP.

Future OAuth expansion candidates:

- Kakao OAuth
- GitHub OAuth

## 11. User Features in MVP

- Google OAuth login
- Main page
- Draw introduction page
- Gacha list
- Gacha detail
- Gacha draw interaction
- Ticket list
- Ticket detail
- Ticket play placeholder UI
- Product search
- Pagination
- Category/theme filtering
- Cart
- Test checkout
- Draw credit issuance
- My Page
- Owned credits
- Draw history
- Won item box
- Minimal claim request
- Delivery claim
- On-site pickup claim with basic QR placeholder
- FAQ
- Fairness guide
- Refund policy
- Exchange policy
- Shipping guide

## 12. Admin Features in MVP

- Minimal admin dashboard
- Theme management
- Reward item management
- Draw product management
- Inventory pool management
- Gacha management
- Ticket placeholder management
- Order/test payment management
- Draw result log view
- Claim request management
- Minimal user view
- Static policy/FAQ pages

Admins can view draw results but cannot modify winning results.

## 13. MVP Exclusions

The following features are excluded from the first MVP:

- Ticket draw execution
- Full admin CMS
- FAQ admin editing
- Real payment integration
- Refund automation
- Shipping tracking number management
- Courier API integration
- Advanced on-site pickup QR verification
- Review system
- Coupon system
- Point system
- Recommendation algorithm
- Full admin dashboard statistics
- Push notifications
- Kakao notification integration
- Real-time popularity ranking

## 14. Main Page Requirements

The main page should include:

- Hero section
- CTA to gacha page
- CTA to ticket page
- Popular draw products
- How to use section
- Difference between gacha and ticket
- Fairness summary
- FAQ shortcut

## 15. Draw Introduction Page Requirements

The draw introduction page should explain:

- What gacha is
- What ticket is
- Difference between gacha and ticket
- How reward grades work
- How fairness is guaranteed
- Buttons to gacha list and ticket list

## 16. List Page Requirements

Both gacha and ticket list pages should include:

- Search input
- Category/theme filter
- Grade summary
- Remaining quantity
- Pagination
- Sold out badge
- Product cards

## 17. Claim Request Requirements

After drawing, users can request how to receive their won items.

Supported methods:

- Delivery
- On-site pickup

Delivery must support bundled shipping.

On-site pickup must generate a pickup verification code.

For the first MVP, the service does not store QR image files. claim_requests.pickup_qr_code stores a verifiable text code such as PICKUP-CLAIM-000001 or PICKUP-{claim_request_id}. The UI can later render this string as a QR code.

## 18. Failure Recovery Requirement

If draw processing fails, the system must be able to determine whether:

1. Credit was not used and no result exists
2. Credit was used but result was not returned to the client
3. Inventory was reserved but not completed
4. Result exists and should be shown again

The system should avoid duplicate rewards and duplicate credit usage.
