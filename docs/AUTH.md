# Auth Setup

## 1. MVP Auth Policy

Pickit Goods MVP uses Google OAuth only.

Do not implement email/password login in the MVP.

## 2. Profile Flow

After Google OAuth login:

```txt
Supabase Auth session
  ↓
Read auth user id
  ↓
Select profiles row by auth.users.id
  ↓
If missing, insert profiles row with role = user
  ↓
Use profiles.role for route authorization
```

The current `profiles` table stores:

- id
- display_name
- avatar_url
- role
- created_at
- updated_at

The schema does not store email in `profiles`. OAuth email is used only in the frontend as display fallback.

## 3. Google OAuth Setup

Actual Google OAuth requires Supabase Auth provider configuration.

### 3.1 Google Cloud Console

Create a Google OAuth client with these local development values:

```txt
Application type: Web application

Authorized JavaScript origins:
http://127.0.0.1:5173
http://localhost:5173

Authorized redirect URIs:
http://127.0.0.1:54321/auth/v1/callback
```

If the OAuth consent screen is in Testing mode, add your Google account as a test user.

### 3.2 Supabase Cloud

Supabase Cloud uses Dashboard settings instead of `supabase/config.toml`.

1. Create a Supabase project.
2. Open Project Settings -> API.
3. Copy the Project URL and anon public key.
4. Put them in local `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-cloud-anon-key
```

Do not store the service_role key in frontend env files.

Enable Google provider:

1. Open Authentication -> Providers.
2. Enable Google.
3. Paste the Google OAuth Client ID.
4. Paste the Google OAuth Client Secret in the Supabase Dashboard only.
5. Save the provider settings.

Find the Supabase Cloud callback URL in the Google provider screen. It usually has this shape:

```txt
https://your-project-ref.supabase.co/auth/v1/callback
```

Add that Cloud callback URL to Google Cloud Console:

```txt
APIs & Services
  -> Credentials
  -> OAuth 2.0 Client IDs
  -> Authorized redirect URIs
```

Keep the local callback URL too if local Supabase testing is still needed:

```txt
http://127.0.0.1:54321/auth/v1/callback
```

Configure Supabase Cloud redirect URLs:

```txt
Authentication
  -> URL Configuration
```

Recommended MVP values:

```txt
Site URL:
http://127.0.0.1:5173

Redirect URLs:
http://127.0.0.1:5173/**
http://localhost:5173/**
https://your-vercel-domain.vercel.app/**
https://your-production-domain/**
```

When testing against Supabase Cloud from local Vite, run:

```bash
npm run dev -- --host 127.0.0.1
```

Then open `http://127.0.0.1:5173`.

### 3.3 Vercel Deployment

Vercel must use the Supabase Cloud project, not the local Supabase CLI URL.

Add these environment variables in Vercel:

```txt
Project
  -> Settings
  -> Environment Variables
```

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-cloud-anon-key
```

Apply them to the required environments:

- Production
- Preview
- Development, if Vercel CLI is used

Redeploy after changing environment variables.

Configure Supabase Cloud URL settings:

```txt
Authentication
  -> URL Configuration
```

Recommended production values:

```txt
Site URL:
https://your-vercel-production-domain

Redirect URLs:
https://your-vercel-production-domain/**
http://127.0.0.1:5173/**
http://localhost:5173/**
```

If OAuth must be tested on Vercel Preview deployments, add a preview redirect pattern:

```txt
https://*.vercel.app/**
```

For production, prefer exact redirect URLs over broad wildcards.

Configure Google Cloud Console:

```txt
APIs & Services
  -> Credentials
  -> OAuth 2.0 Client IDs
```

Add the Vercel production domain to Authorized JavaScript origins:

```txt
https://your-vercel-production-domain
```

Authorized redirect URIs must include the Supabase Cloud callback URL:

```txt
https://your-project-ref.supabase.co/auth/v1/callback
```

Do not add the Vercel app URL as the Google authorized redirect URI for this Supabase OAuth flow. Google redirects to Supabase Auth first, then Supabase redirects back to the frontend through `redirectTo`.

The frontend login flow already redirects to the current deployment origin:

```ts
redirectTo: window.location.origin
```

Deployment verification checklist:

- Vercel environment variables are set.
- Latest deployment was redeployed after env changes.
- Supabase Cloud Site URL points to the production frontend domain.
- Supabase Cloud Redirect URLs include local and deployed frontend URLs.
- Google Authorized JavaScript origins include the deployed frontend domain.
- Google Authorized redirect URIs include the Supabase Cloud callback URL.
- Google login returns to the Vercel site.
- `profiles` row is created or loaded.
- `/gacha` and `/gacha/:id` read seed data from Supabase Cloud.

### 3.4 Local Supabase

Local Google OAuth is configured in `supabase/config.toml`:

```toml
[auth]
site_url = "http://127.0.0.1:5173"
additional_redirect_urls = [
  "http://127.0.0.1:5173",
  "http://localhost:5173"
]

[auth.external.google]
enabled = true
client_id = "GOOGLE_CLIENT_ID"
secret = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET)"
skip_nonce_check = false
```

The client secret must be supplied through a local shell environment variable:

```bash
export SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET="GOOGLE_CLIENT_SECRET"
npx supabase stop
npx supabase start
```

Do not write the Google Client Secret into `supabase/config.toml`, `.env.local`, or committed files.

The frontend login flow redirects back to the current app origin:

```ts
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: window.location.origin,
  },
});
```

For local testing, run the frontend with the same origin configured above:

```bash
npm run dev -- --host 127.0.0.1
```

Then open `http://127.0.0.1:5173`.

`supabase/config.toml` is local-development configuration. Do not use it as the source of truth for Supabase Cloud Auth provider settings.

## 4. Admin Setup

Admin users are not created by seed data.

Admin setup starts after the target user signs in once with Google OAuth:

```txt
Google OAuth login once
  ↓
profiles row is created with role = user
  ↓
Open Supabase SQL Editor
  ↓
Bootstrap the first admin profile
```

`profiles.role` is protected by the `prevent_profile_role_escalation` trigger. A normal update from a non-admin session fails with:

```txt
only admins can update profile role
```

This is expected. The first admin must be bootstrapped with database owner privileges in Supabase SQL Editor.

Find the target profile id:

```sql
select id, display_name, role, created_at
from public.profiles
order by created_at desc;
```

Confirm the trigger name:

```sql
select
  tgname as trigger_name,
  tgrelid::regclass as table_name
from pg_trigger
where tgrelid = 'public.profiles'::regclass
  and not tgisinternal;
```

Bootstrap the first admin:

```sql
begin;

alter table public.profiles
disable trigger prevent_profile_role_escalation;

update public.profiles
set role = 'admin',
    updated_at = now()
where id = '<logged-in-profile-id>';

alter table public.profiles
enable trigger prevent_profile_role_escalation;

commit;
```

Verify the result:

```sql
select id, display_name, role, updated_at
from public.profiles
where id = '<logged-in-profile-id>';
```

Do not seed `auth.users` or admin profiles directly in the MVP.

Use this trigger-disable flow only for the first admin bootstrap. After that, admin role changes should be handled by a dedicated admin feature or a tightly scoped RPC with explicit admin checks.

After changing role, sign out and sign in again so the frontend reloads `profiles.role`.
