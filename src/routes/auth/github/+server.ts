import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${url.origin}/auth/callback`,
      scopes: 'read:user user:email'
    }
  });

  if (error) {
    console.error('GitHub OAuth error:', error);
    throw redirect(303, '/login?error=' + encodeURIComponent(error.message));
  }

  if (!data?.url) {
    throw redirect(303, '/login?error=' + encodeURIComponent('No redirect URL received'));
  }

  throw redirect(303, data.url);
}; 