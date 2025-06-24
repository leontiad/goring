import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '$lib/supabase/server';

export const GET: RequestHandler = async (event) => {
  const requestUrl = new URL(event.request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  console.log('Auth callback received:', { code: !!code, error, errorDescription });

  if (error) {
    console.error('OAuth error:', error, errorDescription);
    throw redirect(303, '/?error=' + encodeURIComponent(errorDescription || error));
  }

  if (code) {
    try {
      const supabase = createClient(event);
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (exchangeError) {
        console.error('Session exchange error:', exchangeError);
        throw redirect(303, '/?error=' + encodeURIComponent(exchangeError.message));
      }
      
      console.log('Session exchanged successfully:', !!data.session);
    } catch (err) {
      console.error('Callback error:', err);
      throw redirect(303, '/?error=Authentication failed');
    }
  }

  throw redirect(303, '/');
}; 