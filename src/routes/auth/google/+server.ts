import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${url.origin}/auth/callback`,
      scopes: 'email profile',
      queryParams: {
        access_type: 'offline',
        prompt: 'consent'
      }
    }
  });

  if (error) {
    console.error('Google OAuth error:', error);
    throw redirect(303, '/login?error=' + encodeURIComponent(error.message));
  }

  if (!data?.url) {
    throw redirect(303, '/login?error=' + encodeURIComponent('No redirect URL received'));
  }

  throw redirect(303, data.url);
}; 