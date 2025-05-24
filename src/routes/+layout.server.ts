import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ locals, url }) => {
  const session = await locals.getSession();
  console.log('Layout server load - Session:', session ? 'present' : 'missing');
  console.log('Current path:', url.pathname);

  // If we're on the callback route, don't redirect
  if (url.pathname.startsWith('/auth/callback')) {
    return { session };
  }

  // If we're on the login page and have a session, redirect to home
  if (session && url.pathname === '/login') {
    throw redirect(303, '/');
  }

  // If we're not on the login page and don't have a session, redirect to login
  if (!session && url.pathname !== '/login') {
    throw redirect(303, '/login');
  }
  
  return { session };
}; 