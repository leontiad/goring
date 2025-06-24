import { createServerClient } from '@supabase/ssr'
import type { RequestEvent } from '@sveltejs/kit'
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'

export function createClient(event: RequestEvent) {
  console.log('Creating server client with URL:', PUBLIC_SUPABASE_URL);
  console.log('Creating server client with key:', PUBLIC_SUPABASE_ANON_KEY ? 'Key exists' : 'No key');
  
  if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase environment variables');
  }

  return createServerClient(
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return event.cookies.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              event.cookies.set(name, value, { ...options, path: '/' })
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
} 