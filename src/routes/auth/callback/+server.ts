import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
 
export async function GET({ url }) {
  // Redirect to the client-side callback handler
  throw redirect(303, `/auth/callback${url.search}`);
} 