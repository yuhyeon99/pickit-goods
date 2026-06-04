# Implementation Tasks

## First MVP Scope

Included in the first MVP:

- Project base structure
- Routing and layouts
- Supabase schema and RLS
- Google OAuth login
- Gacha list/detail/play UI
- Cart
- Test checkout
- Gacha credit issuance
- Server-side gacha draw logic
- Draw results and won item box
- Minimal claim request
- Minimal admin features

Excluded from the first MVP:

- Ticket draw execution
- Full admin CMS
- FAQ admin editing
- Refund automation
- Shipping tracking number management
- Advanced on-site pickup QR verification
- Real-time popular products
- Full admin dashboard statistics

Ticket routes and placeholder UI should be created in the first MVP. Actual ticket draw logic is a second-phase task.

## Task 0. Requirement Review

Before coding:

- Read AGENTS.md
- Read all docs files
- Identify conflicting requirements
- Identify missing relationships in DB design
- Identify MVP scope risks
- Propose implementation order

Do not write code in this task.

## Task 1. Project Setup

Goal:

Create React + Vite + TypeScript project base.

Requirements:

- React
- TypeScript
- Vite
- React Router
- Tailwind CSS
- TanStack Query
- Supabase JS
- Jotai or Zustand
- Environment prepared for Google OAuth only

Output:

- Basic project structure
- App entry
- Router setup
- Global layout placeholder
- Environment variable example file

## Task 2. Routing and Layout

Goal:

Implement route skeletons based on docs/ROUTES.md.

Requirements:

- User routes
- Admin routes
- Ticket routes as placeholder pages only
- AppLayout
- AdminLayout
- AuthLayout
- NotFound page
- Protected route placeholder
- Admin protected route placeholder

Use mock placeholder pages only.

## Task 3. Supabase Schema SQL

Goal:

Create Supabase migration SQL based on docs/DATABASE.md.

Before applying migrations to Supabase Cloud, read:

- docs/DATABASE.md, "Supabase Cloud Migration"

Requirements:

- Tables
- Enums or check constraints
- Foreign keys
- Unique constraints
- Indexes
- created_at / updated_at columns
- Basic triggers if needed

Important constraints:

- draw_results.draw_credit_id should be unique
- draw_results.inventory_unit_id should be unique
- inventory_units should prevent duplicate drawn state conflicts

## Task 4. Supabase RLS Policies

Goal:

Apply RLS policies.

Requirements:

- Enable RLS on user-facing tables
- User can manage own profile except role
- User can manage own cart
- User can read own orders, credits, results, claims
- User cannot update draw_results or draw_logs
- Admin can manage operational tables
- Admin cannot modify confirmed winning results

## Task 5. Mock Data

Goal:

Create mock data and Supabase seed data for UI and DB flow development.

Include:

- Themes
- Reward items
- Gacha products
- Ticket products
- Ticket placeholder data only
- Inventory summaries
- draw_product_items pool configuration
- 100 available inventory_units per active gacha product
- FAQ items

User-specific mock data such as cart items, draw results, and claim requests may be added as UI-only mock data later, but must not be inserted by the Supabase seed.

Supabase seed file:

```txt
supabase/seed.sql
```

Seed rules:

- Do not create auth.users.
- Do not create profiles.
- Do not create user_draw_credits.
- Do not create draw_results.
- Do not create draw_logs.
- Admin profile role setup is handled separately after OAuth login.

Seed verification:

```bash
npx supabase db reset
```

## Task 6. User Static UI

Goal:

Implement user-facing static UI using mock data.

Before UI work, read:

- docs/UI_GUIDELINES.md

UI completion checklist:

- Check mobile layout first.
- Check light mode.
- Check dark mode.
- Confirm Header does not wrap or overlap awkwardly.
- Confirm primary CTA readability.
- Confirm card and badge color contrast.
- Confirm icon-only buttons include `aria-label`.

Pages:

- Main
- Draw introduction
- Gacha list
- Gacha detail
- Gacha play
- Ticket list
- Ticket detail
- Ticket play
- Cart
- My Page
- Credits
- Draw history
- Won item box
- Claim request
- Claim history
- Usage guide
- Fairness guide
- Refund policy
- Exchange policy
- Shipping policy
- FAQ

Requirements:

- Search input on list pages
- Category/theme filter
- Pagination UI
- Sold out badge
- Availability labels: 판매중, 구매마감 · 보유권 사용 가능, 품절
- Difference between gacha and ticket
- Fairness summary
- Ticket pages must clearly remain placeholder UI for first MVP and must not perform draw execution.

## Task 7. Admin Static UI

Goal:

Implement minimal admin-facing static UI using mock data.

Before admin UI work, read:

- docs/UI_GUIDELINES.md

Admin UI completion checklist:

- Check mobile layout first.
- Check light mode.
- Check dark mode.
- Confirm navigation remains usable on small screens.
- Confirm read-only/admin state badges remain readable.

Pages:

- Admin dashboard
- Minimal dashboard only; full statistics are excluded from first MVP
- Theme management
- Reward item management
- Inventory pool management
- Gacha product management
- Ticket product management
- Order management
- Draw log view
- Claim management
- User management
- Policy/FAQ management

Important:

- Draw result table is read-only.
- Winning result edit UI must not exist.
- Full policy/FAQ CMS is excluded from first MVP.

## Task 8. OAuth Authentication

Goal:

Implement Supabase Google OAuth login.

Before auth work, read:

- docs/AUTH.md

Requirements:

- Google OAuth login only
- No email/password login
- Kakao/GitHub OAuth are future extensions
- Login page
- Logout
- Auth state handling
- Create or load profile after login
- Role-based route protection
- Admin route protection

## Task 8.5. Vercel Deployment Setup

Goal:

Connect the deployed Vercel frontend to Supabase Cloud and Google OAuth.

Before deployment work, read:

- docs/AUTH.md, "Vercel Deployment"
- docs/DATABASE.md, "Supabase Cloud Migration"

Checklist:

- Push committed code to GitHub.
- Create or connect Vercel project.
- Set `VITE_SUPABASE_URL` in Vercel environment variables.
- Set `VITE_SUPABASE_ANON_KEY` in Vercel environment variables.
- Redeploy after environment variable changes.
- Set Supabase Cloud Site URL to the production Vercel domain.
- Add Vercel production domain to Supabase Redirect URLs.
- Keep local development redirect URLs if local testing is still used.
- Add Vercel production domain to Google Authorized JavaScript origins.
- Confirm Google Authorized redirect URIs include the Supabase Cloud callback URL.
- Test Google login, profile creation, `/gacha`, and `/gacha/:id` on the deployed site.

## Task 9. Cart and Test Checkout

Goal:

Implement cart and MVP test checkout.

Rules:

- Cart contains draw products only.
- Reward items cannot be added to cart.
- Test checkout creates paid order.
- Paid order issues user_draw_credits.
- Each quantity and credit_amount should create correct credit records.
- paid checkout creates credit_issuances rows.
- draw_products.sold_count increases by issued credit quantity.
- New purchases are blocked if sold_count >= sales_limit or available inventory count is 0.

## Task 10. Gacha Draw Function

Goal:

Implement server-side gacha draw.

Recommended:

- Supabase Edge Function calls Postgres RPC
- Use secure random generation
- Use transaction or row locking

Requirements:

- Verify user auth
- Verify unused gacha credit
- Allow draw if the product is active, or if the product is sold_out but available inventory remains and the user has an unused matching credit
- Verify available inventory
- Select one inventory unit
- Mark inventory as drawn
- Mark credit as used
- Create draw_result
- Create draw_logs
- Return result
- Prevent duplicate usage
- Handle failure recovery

## Task 11. Ticket Draw Function

Goal:

Second-phase task: implement server-side ticket draw.

First MVP requirement:

- Do not implement actual ticket draw execution.
- Keep ticket routes and placeholder UI only.
- No ticket_slots table is created in the first MVP.
- Ticket slot number is UX-only and may be reused by multiple users.

Second-phase requirements:

- Verify user auth
- Verify unused ticket credit
- Validate selected slot number
- At selection moment, select inventory using secure random generation
- Store selected slot number in draw_results
- Mark inventory as drawn
- Mark credit as used
- Create draw_result
- Create draw_logs
- Return result
- Prevent duplicate usage
- Handle failure recovery

## Task 12. Draw UI Integration

Goal:

Connect gacha play page with server draw function.

Gacha UI:

- Draw button
- Ball/capsule animation
- Loading state
- Result reveal
- Public verification code

Ticket UI:

- Numbered slot grid
- Select one slot
- Card flip animation
- Placeholder state only in first MVP
- No server draw call in first MVP

## Task 13. Claim Request

Goal:

Implement minimal claim request flow.

Requirements:

- User selects unclaimed won items
- Delivery or pickup selection
- Delivery address form
- Pickup verification code generation
- Bundled delivery support
- Claim request creation
- Claim status display
- claim_request_items.draw_result_id must be unique.
- claim_request_items creation and draw_results.status update must be transactional.
- The first MVP does not store QR image files.
- claim_requests.pickup_qr_code stores a verifiable text code such as PICKUP-CLAIM-000001 or PICKUP-{claim_request_id}.
- The UI can later render pickup_qr_code as a QR code.

## Task 14. Admin Claim Processing

Goal:

Allow admin to process minimal claim requests.

Requirements:

- View claim request list
- View claim detail
- Update status
- Complete delivery
- Complete pickup
- Tracking number management is excluded from first MVP.
- Advanced QR verification is excluded from first MVP.

## Task 15. Policy and FAQ Management

Goal:

Implement static policy and FAQ pages.

User:

- Read FAQ
- Read policies

Admin:

- Policy/FAQ admin editing is deferred to the second phase

First MVP notes:

- FAQ admin editing is excluded.
- Full policy/FAQ CMS is excluded.
- Database schema still includes policies.slug, policies.status, policies.sort_order, faq_items.category, faq_items.status, and faq_items.sort_order for future admin management.
- faq_items uses status only for visibility.

## Task 16. Probability Display

Goal:

Display probability information based on available inventory.

Requirements:

- Total available count
- Count by grade
- Probability by grade
- Reward list by grade
- Last updated time

## Task 17. Sold Out Automation

Goal:

Ensure draw product stops selling when inventory is depleted or sales limit is reached.

Requirements:

- Disable cart button
- Show sold out badge
- Show active products as 판매중
- Show sold_out products with available inventory as 구매마감 · 보유권 사용 가능
- Show sold_out products with no available inventory as 품절
- Do not show hidden products on user-facing screens
- Prevent checkout for sold out product
- Prevent draw only if no inventory remains or the user has no unused matching credit
- Allow draw for existing unused credits when product is sold_out but available inventory remains
- Update draw_products.status to sold_out
- sold_count is issued credit count after paid checkout.

## Task 18. Error and Recovery UX

Goal:

Handle draw failures safely.

Cases:

- Network error after result created
- Credit unused, no result
- Credit used, result exists
- Inventory unavailable
- Product sold out

Requirements:

- Show existing result if already completed
- Allow retry only if safe
- Never create duplicate result

## Task 19. Final Review

Goal:

Review implementation against docs.

Checklist:

- OAuth only
- Google OAuth only for first MVP
- Client does not generate draw result
- RLS enabled
- Draw results read-only after completion
- Admin cannot modify winning results
- Inventory deducted once
- Sold out works
- Refund policy supports unused credits only
- Claim request works
- Admin claim processing works
- Probability displayed
- Fairness page exists
- Ticket draw execution remains deferred to phase 2
