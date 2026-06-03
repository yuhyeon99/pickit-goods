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