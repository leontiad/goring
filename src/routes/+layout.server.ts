import type { LayoutServerLoad } from './$types';
import { createClient } from '$lib/supabase/server';

export const load: LayoutServerLoad = async (event) => {
  const supabase = createClient(event);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  let remainingSearches = 2;

  // If user is authenticated, check their remaining searches
  if (session?.user) {
    try {
      const { data: remainingData, error: remainingError } = await supabase
        .rpc('get_remaining_searches');

      if (!remainingError && remainingData !== null) {
        remainingSearches = remainingData;
      }
    } catch (error) {
      console.error('Error getting remaining searches:', error);
      // Default to 2 searches if there's an error
      remainingSearches = 2;
    }
  }

  return {
    session,
    remainingSearches,
  };
}; 