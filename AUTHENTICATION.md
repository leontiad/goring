# Authentication Setup

This project uses Supabase for Google OAuth authentication.

## Configuration

The authentication is configured with the following environment variables in `.env`:

```
PUBLIC_SUPABASE_URL=https://vnlqjqozuggbgvoyewwq.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZubHFqcW96dWdnYmd2b3lld3dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5Mzg0MTYsImV4cCI6MjA2MzUxNDQxNn0.nfKncFTtuFZ6asPCWRxDpMgh2lcsEzL9NKDYXNV9iJk
```

## Authentication Flow

1. **Login Page** (`/login`): Users can sign in with their Google account
2. **OAuth Redirect**: After Google authentication, users are redirected to `/auth/callback`
3. **Dashboard Access**: Authenticated users are redirected to `/dashboard`
4. **Session Management**: Sessions are managed via cookies and automatically refreshed

## Protected Routes

- `/dashboard` - Requires authentication, redirects to `/login` if not authenticated
- Other routes are publicly accessible

## Key Files

- `src/lib/supabase/client.ts` - Client-side Supabase configuration
- `src/lib/supabase/server.ts` - Server-side Supabase configuration
- `src/routes/login/+page.svelte` - Login page with Google OAuth
- `src/routes/auth/callback/+server.ts` - OAuth callback handler
- `src/routes/dashboard/+page.server.ts` - Dashboard authentication guard
- `src/routes/+layout.server.ts` - Global session management

## Usage

1. Visit `/login` to sign in with Google
2. After successful authentication, you'll be redirected to `/dashboard`
3. Use the "Sign Out" button in the dashboard to log out
4. The "Try It Now" button on the main page will redirect to login if not authenticated, or dashboard if authenticated

## Dependencies

- `@supabase/ssr` - For server-side rendering support
- `@supabase/supabase-js` - Supabase JavaScript client 