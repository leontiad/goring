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

        // First, check if user has an active subscription
        const { data: subscriptionData, error: subscriptionError } = await supabase
            .rpc('get_user_active_subscription', { user_uuid: user.id });

        let userLimit = 2; // Default free plan limit
        let isSubscriber = false;

        if (!subscriptionError && subscriptionData && subscriptionData.length > 0) {
            const subscription = subscriptionData[0];
            userLimit = subscription.searches_limit;
            isSubscriber = true;
            console.log('User has active subscription:', { userLimit, isSubscriber });
        } else {
            console.log('No active subscription found, using free plan limit');
        }

        // Check remaining searches using the database function
        const { data: remainingData, error: remainingError } = await supabase
            .rpc('get_remaining_searches');

        if (remainingError) {
            console.error('Error getting remaining searches:', remainingError);
            // If database function doesn't exist, assume user can search
            return json({
                remainingSearches: userLimit,
                canSearch: true,
                limit: userLimit,
                isSubscriber
            });
        }

        const remainingSearches = remainingData || 0;

        return json({
            remainingSearches,
            canSearch: remainingSearches > 0,
            limit: userLimit,
            isSubscriber
        });

    } catch (error) {
        console.error('Search limit check error:', error);
        // If there's an error, assume user can search
        return json({
            remainingSearches: 2,
            canSearch: true,
            limit: 2,
            isSubscriber: false
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

        // First, check if user has an active subscription
        const { data: subscriptionData, error: subscriptionError } = await supabase
            .rpc('get_user_active_subscription', { user_uuid: user.id });

        let userLimit = 2; // Default free plan limit
        let isSubscriber = false;

        if (!subscriptionError && subscriptionData && subscriptionData.length > 0) {
            const subscription = subscriptionData[0];
            userLimit = subscription.searches_limit;
            isSubscriber = true;
            console.log('User has active subscription:', { userLimit, isSubscriber });
        } else {
            console.log('No active subscription found, using free plan limit');
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
                canSearch: false,
                limit: userLimit,
                isSubscriber
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
                remainingSearches: userLimit - 1,
                canSearch: true,
                limit: userLimit,
                isSubscriber,
                message: 'Search completed (tracking not available)'
            });
        }

        console.log('Search recorded successfully for user:', user.id, 'username:', username);

        // Get updated remaining searches
        const { data: remainingData, error: remainingError } = await supabase
            .rpc('get_remaining_searches');

        if (remainingError) {
            console.error('Error getting remaining searches:', remainingError);
            // If function doesn't exist, assume 1 search remaining
            return json({
                success: true,
                remainingSearches: userLimit - 1,
                canSearch: true,
                limit: userLimit,
                isSubscriber,
                message: 'Search recorded successfully'
            });
        }

        const remainingSearches = remainingData || 0;
        console.log('Updated remaining searches:', remainingSearches, 'for user limit:', userLimit);

        return json({
            success: true,
            remainingSearches,
            canSearch: remainingSearches > 0,
            limit: userLimit,
            isSubscriber,
            message: 'Search recorded successfully'
        });

    } catch (error) {
        console.error('Search recording error:', error);
        // If there's an error, assume search was successful
        return json({
            success: true,
            remainingSearches: 1,
            canSearch: true,
            limit: 2,
            isSubscriber: false,
            message: 'Search completed (tracking not available)'
        });
    }
}; 