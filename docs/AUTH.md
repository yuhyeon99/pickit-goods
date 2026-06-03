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

For hosted Supabase:

1. Open Supabase Dashboard.
2. Go to Authentication → Providers.
3. Enable Google.
4. Add Google OAuth client ID and secret.
5. Configure allowed redirect URLs for the deployed app and local dev URL.

### 3.2 Local Supabase

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

## 4. Admin Setup

Admin users are not created by seed data.

Local admin setup:

```txt
Google OAuth login once
  ↓
profiles row is created with role = user
  ↓
Open Supabase Studio
  ↓
Update that profile role to admin
```

Example local SQL after login:

```sql
update public.profiles
set role = 'admin'
where id = '<logged-in-auth-user-id>';
```

Do not seed `auth.users` or admin profiles directly in the MVP.
