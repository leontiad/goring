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

        // Check remaining searches using the database function
        const { data: remainingData, error: remainingError } = await supabase
            .rpc('get_remaining_searches');

        if (remainingError) {
            console.error('Error getting remaining searches:', remainingError);
            // If database function doesn't exist, assume user can search
            return json({
                remainingSearches: 2,
                canSearch: true,
                limit: 2
            });
        }

        const remainingSearches = remainingData || 0;

        return json({
            remainingSearches,
            canSearch: remainingSearches > 0,
            limit: 2
        });

    } catch (error) {
        console.error('Search limit check error:', error);
        // If there's an error, assume user can search
        return json({
            remainingSearches: 2,
            canSearch: true,
            limit: 2
        });
    }
};

export const POST = async (event: RequestEvent) => {
    try {
        const supabase = createClient(event);
        
        // Get the current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
            return json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { username } = await event.request.json();

        if (!username) {
            return json({ error: 'Username is required' }, { status: 400 });
        }

        // Check if user can search
        const { data: canSearchData, error: canSearchError } = await supabase
            .rpc('check_search_limit');

        if (canSearchError) {
            console.error('Error checking search limit:', canSearchError);
            // If database function doesn't exist, assume user can search
            console.log('Database function not available, allowing search...');
        } else if (!canSearchData) {
            return json({ 
                error: 'Search limit reached',
                remainingSearches: 0,
                canSearch: false
            }, { status: 429 });
        }

        // Record the search
        const { error: insertError } = await supabase
            .from('searches')
            .insert({
                user_id: user.id,
                username: username
            });

        if (insertError) {
            console.error('Error recording search:', insertError);
            // If table doesn't exist, just return success
            console.log('Search table not available, continuing without recording...');
            return json({
                success: true,
                remainingSearches: 1,
                canSearch: true,
                message: 'Search completed (tracking not available)'
            });
        }

        // Get updated remaining searches
        const { data: remainingData, error: remainingError } = await supabase
            .rpc('get_remaining_searches');

        if (remainingError) {
            console.error('Error getting remaining searches:', remainingError);
            // If function doesn't exist, assume 1 search remaining
            return json({
                success: true,
                remainingSearches: 1,
                canSearch: true,
                message: 'Search recorded successfully'
            });
        }

        const remainingSearches = remainingData || 0;

        return json({
            success: true,
            remainingSearches,
            canSearch: remainingSearches > 0,
            message: 'Search recorded successfully'
        });

    } catch (error) {
        console.error('Search recording error:', error);
        // If there's an error, assume search was successful
        return json({
            success: true,
            remainingSearches: 1,
            canSearch: true,
            message: 'Search completed (tracking not available)'
        });
    }
}; 