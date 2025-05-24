import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { browser } from '$app/environment';

if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables');
}

console.log('[Supabase Client] Initializing with:', {
  url: PUBLIC_SUPABASE_URL,
  keyPrefix: PUBLIC_SUPABASE_ANON_KEY.substring(0, 10) + '...',
  isBrowser: browser
});

// Create a single supabase client for interacting with your database
export const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: browser ? {
      getItem: (key) => {
        const value = localStorage.getItem(key);
        console.log('[Supabase Storage] Get:', {
          key,
          hasValue: !!value,
          valueLength: value?.length
        });
        return value;
      },
      setItem: (key, value) => {
        console.log('[Supabase Storage] Set:', {
          key,
          hasValue: !!value,
          valueLength: value?.length
        });
        localStorage.setItem(key, value);
      },
      removeItem: (key) => {
        console.log('[Supabase Storage] Remove:', { key });
        localStorage.removeItem(key);
      }
    } : undefined,
    debug: true
  }
});

// Add auth state change listener for debugging
if (browser) {
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('[Supabase Auth] State Change:', {
      event,
      hasSession: !!session,
      sessionDetails: session ? {
        user: session.user?.email,
        expiresAt: session.expires_at,
        accessTokenLength: session.access_token?.length,
        refreshTokenLength: session.refresh_token?.length
      } : null
    });

    // Ensure session is persisted
    if (session) {
      try {
        const sessionStr = JSON.stringify(session);
        localStorage.setItem('sb-vnlqjqozuggbgvoyewwq-auth-token', sessionStr);
        const expires = new Date();
        expires.setTime(expires.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
        document.cookie = `sb-vnlqjqozuggbgvoyewwq-auth-token=${encodeURIComponent(sessionStr)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax; Secure`;
      } catch (e) {
        console.error('[Supabase Auth] Error persisting session:', e);
      }
    }
  });
}

// Initialize session from cookie if present
if (browser) {
  const cookies = document.cookie;
  const match = cookies.match(/sb-vnlqjqozuggbgvoyewwq-auth-token=([^;]+)/);
  if (match) {
    try {
      const session = JSON.parse(decodeURIComponent(match[1]));
      console.log('Initializing session from cookie');
      supabase.auth.setSession(session);
    } catch (e) {
      console.error('Error initializing session from cookie:', e);
    }
  }
} 