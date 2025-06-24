import { json } from '@sveltejs/kit';
import { createClient } from '$lib/supabase/server';
import type { RequestEvent } from '@sveltejs/kit';

export const GET = async (event: RequestEvent) => {
    try {
        const supabase = createClient(event);
        
        // Get the current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
            return json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user's search history using the database function
        const { data: historyData, error: historyError } = await supabase
            .rpc('get_user_search_history');

        if (historyError) {
            console.error('Error getting search history:', historyError);
            // If database function doesn't exist, return empty history
            return json({
                history: []
            });
        }

        return json({
            history: historyData || []
        });

    } catch (error) {
        console.error('Search history error:', error);
        // If there's an error, return empty history
        return json({
            history: []
        });
    }
}; 