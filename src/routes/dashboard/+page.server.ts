import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { createClient } from '$lib/supabase/server';

export const load: PageServerLoad = async (event) => {
  const supabase = createClient(event);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw redirect(303, '/login');
  }

  return {
    user: session.user,
  };
}; 