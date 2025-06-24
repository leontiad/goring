import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '$lib/supabase/server';

export const GET: RequestHandler = async (event) => {
  const requestUrl = new URL(event.request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');
  const redirectTo = requestUrl.searchParams.get('redirectTo');

  console.log('Auth callback received:', { code: !!code, error, errorDescription, redirectTo });

  if (error) {
    console.error('OAuth error:', error, errorDescription);
    const errorUrl = redirectTo ? `${redirectTo}?error=${encodeURIComponent(errorDescription || error)}` : `/?error=${encodeURIComponent(errorDescription || error)}`;
    throw redirect(303, errorUrl);
  }

  if (code) {
    try {
      const supabase = createClient(event);
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (exchangeError) {
        console.error('Session exchange error:', exchangeError);
        const errorUrl = redirectTo ? `${redirectTo}?error=${encodeURIComponent(exchangeError.message)}` : `/?error=${encodeURIComponent(exchangeError.message)}`;
        throw redirect(303, errorUrl);
      }
      
      console.log('Session exchanged successfully:', !!data.session);
    } catch (err) {
      console.error('Callback error:', err);
      const errorUrl = redirectTo ? `${redirectTo}?error=Authentication failed` : '/?error=Authentication failed';
      throw redirect(303, errorUrl);
    }
  }

  // Redirect to the specified page or default to dashboard
  const finalRedirectUrl = redirectTo || '/dashboard';
  throw redirect(303, finalRedirectUrl);
}; 