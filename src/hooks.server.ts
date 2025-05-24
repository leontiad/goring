import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  console.log('Hooks: Request received for path:', event.url.pathname);
  console.log('Hooks: Request headers:', event.request.headers);

  // Create a Supabase client for the server
  const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

  // Get the session from the cookie
  const authCookie = event.request.headers.get('cookie')?.match(/sb-vnlqjqozuggbgvoyewwq-auth-token=([^;]+)/)?.[1];
  
  if (authCookie) {
    try {
      const session = JSON.parse(decodeURIComponent(authCookie));
      console.log('Hooks: Found session in cookie');
      
      // Set the session in the Supabase client
      await supabase.auth.setSession(session);
      
      // Get the validated session
      const { data: { session: validatedSession }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Hooks: Error validating session:', error);
      } else if (validatedSession) {
        console.log('Hooks: Session validated successfully');
        // Set the session in the event locals for use in load functions
        event.locals.supabase = supabase;
        event.locals.session = validatedSession;
      }
    } catch (e) {
      console.error('Hooks: Error parsing session cookie:', e);
    }
  } else {
    console.log('Hooks: No session cookie found');
  }

  // Add getSession helper to locals
  event.locals.getSession = async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Hooks: Error getting session:', error);
      return null;
    }
    return session;
  };

  // Continue with the request
  const response = await resolve(event);
  
  // Add CORS headers
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  return response;
}; 