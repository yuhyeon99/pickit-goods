# AGENTS.md

## Project Overview

This repository is for a React + Supabase + Vercel MVP service for random goods drawing.

Before implementing features, read the following documents:

- docs/PRD.md
- docs/ROUTES.md
- docs/DATABASE.md
- docs/DRAW_LOGIC.md
- docs/POLICIES.md
- docs/TASKS.md

## Development Rules

- Do not implement the entire service at once.
- Work task by task based on docs/TASKS.md.
- Do not create draw results on the client.
- All draw logic must be handled on the server side using Supabase Edge Functions or Postgres RPC.
- Apply Supabase RLS policies for user/admin separation.
- Users must not be able to update draw_results or draw_logs.
- Admins can view draw results but cannot modify winning results.
- Use mock data first when implementing UI pages.
- After each task, summarize changed files and remaining work.


## UI/UX Direction

Use the clean, trustworthy product UI often seen in Toss app/web as the main visual reference.

Do not copy Toss UI exactly. Instead, use it only as a reference for product clarity and interaction quality.

- Wide spacing
- Clear information hierarchy
- Large titles and short descriptions
- Rounded card layouts
- Clear CTA buttons
- Soft status badges
- Mobile-first responsive layout
- Flows where the user's next action is easy to understand
- Friendly but trustworthy financial/product-service tone
- Smooth micro-interactions where they help user understanding
- Dark-friendly visual direction by default, with light/dark theme support
- Avoid hardcoded one-off colors in UI work; prefer shared CSS variables and common UI styles
- Mobile-first responsive implementation for all user-facing screens
- Reuse common card, button, badge, spacing, and layout styles before adding new variants

Before implementing or modifying user-facing pages, check `docs/UI_GUIDELINES.md`.

For MVP, prioritize clarity over decoration.
