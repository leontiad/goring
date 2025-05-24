import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { RequestEvent } from '@sveltejs/kit';

export const createSupabaseServerClient = (event?: RequestEvent) => {
  console.log('\n=== CREATING SUPABASE SERVER CLIENT ===');
  console.log('1. Environment:');
  console.log('- URL:', PUBLIC_SUPABASE_URL);
  console.log('- Anon key:', PUBLIC_SUPABASE_ANON_KEY.substring(0, 10) + '...');

  if (event) {
    console.log('2. Request details:');
    console.log('- Path:', event.url.pathname);
    console.log('- Method:', event.request.method);
    console.log('- Headers:', Object.fromEntries(event.request.headers.entries()));
    console.log('- Cookies:', event.request.headers.get('cookie'));
  }

  const client = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      debug: true
    },
    global: {
      headers: event ? {
        cookie: event.request.headers.get('cookie') || ''
      } : {}
    }
  });

  console.log('3. Client created with config:', {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    hasCookies: !!event?.request.headers.get('cookie')
  });
  console.log('=== SUPABASE SERVER CLIENT CREATED ===\n');

  return client;
}; 