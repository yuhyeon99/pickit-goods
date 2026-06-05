# Routes

## 1. User Routes

```txt
/
Main page

/draw
Draw introduction page

/gacha
Gacha list page

/gacha/:id
Gacha detail page

/gacha/:id/play
Gacha draw play page

/ticket
Ticket list page placeholder for first MVP

/ticket/:id
Ticket detail page placeholder for first MVP

/ticket/:id/play
Ticket number selection placeholder page for first MVP

/cart
Cart page

/checkout
Test checkout page

/checkout/success
Checkout success page

/my
My Page dashboard

/my/credits
Owned draw credits

/my/draws
Draw history

/my/items
Won item box

/my/claims
Claim request history

/claim
Create claim request page

/guide
Usage guide page

/fairness
Fairness guide page

/policy/refund
Refund policy page

/policy/exchange
Exchange policy page

/policy/shipping
Shipping guide page

/faq
FAQ page

/login
OAuth login page
```

## 2. Admin Routes

```txt
/admin
Admin dashboard

/admin/themes
Theme management

/admin/items
Reward item management

/admin/pools
Inventory pool management

/admin/gacha
Gacha product management

/admin/tickets
Ticket product management

/admin/orders
Order and test payment management

/admin/draw-logs
Draw result log view

/admin/claims
Claim request management

/admin/refunds
Refund request management

/admin/users
User management

/admin/policies
Policy and FAQ management
```

## 3. Route Access Rules

| Route Group | Access |
|---|---|
| Public pages | Guest and authenticated users |
| Cart | Authenticated users only |
| Checkout | Authenticated users only |
| Draw play pages | Authenticated users with valid credits only |
| Ticket play page | Placeholder only in first MVP; actual draw execution is second phase |
| My Page | Authenticated users only |
| Claim pages | Authenticated users only |
| Admin pages | Admin users only |

## 4. Recommended Layouts

```txt
AppLayout
├─ Header
├─ Main
└─ Footer

AdminLayout
├─ AdminSidebar
├─ AdminHeader
└─ AdminMain

AuthLayout
└─ Centered auth card
```

## 5. Navigation Requirements

Main navigation:

- Home
- Draw Guide
- Gacha
- Ticket
- FAQ
- My Page
- Cart

Admin navigation:

- Dashboard
- Themes
- Reward Items
- Pools
- Gacha
- Tickets
- Orders
- Draw Logs
- Claims
- Users
- Policies

## 6. First MVP Route Scope

Implemented end to end in the first MVP:

- Main, guide, gacha list/detail/play
- Cart, checkout, checkout success
- My Page, credits, draw history, won item box
- Minimal claim request and claim history
- Static FAQ and policy pages
- Google OAuth login
- Minimal admin routes for product, inventory, orders, draw logs, and claims

Placeholder only in the first MVP:

- Ticket list/detail/play
- Full admin dashboard statistics
- Full policy/FAQ admin CMS

## 7. User-Facing Product Status Labels

Product list/detail routes should use these labels:

- active: 판매중
- sold_out + available inventory remains: 구매마감 · 보유권 사용 가능
- sold_out + no available inventory: 품절
- hidden: not shown on user-facing routes

sold_out blocks new purchases. Draw play remains allowed only when available inventory remains and the user has an unused matching credit.
