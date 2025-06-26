import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '$lib/supabase/server';

export const GET: RequestHandler = async (event) => {
  try {
    console.log('Subscription details API called');
    const supabase = createClient(event);
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    console.log('User auth result:', { user: user?.id, error: userError });
    
    if (!user) {
      console.log('No user found, returning unauthorized');
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('User authenticated:', user.id);

    // Get user's active subscription
    let { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    console.log('Subscription query result:', { subscription, error: subscriptionError });

    if (subscriptionError && subscriptionError.code !== 'PGRST116') {
      console.error('Error fetching subscription:', subscriptionError);
      return json({ error: 'Failed to fetch subscription details' }, { status: 500 });
    }

    // If no active subscription found, let's check for any subscription
    if (!subscription) {
      console.log('No active subscription found, checking for any subscription...');
      const { data: anySubscription, error: anySubscriptionError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      console.log('Any subscription query result:', { anySubscription, error: anySubscriptionError });
      
      if (anySubscription) {
        console.log('Found subscription with status:', anySubscription.status);
        // For debugging, let's return this subscription even if it's not active
        subscription = anySubscription;
      }
    }

    // Get remaining searches
    const { data: remainingData, error: remainingError } = await supabase
      .rpc('get_remaining_searches');

    if (remainingError) {
      console.error('Error getting remaining searches:', remainingError);
    }

    const remainingSearches = remainingData || 0;

    if (!subscription) {
      return json({
        hasSubscription: false,
        remainingSearches,
        subscription: null
      });
    }

    // Calculate subscription duration and next billing date
    const now = new Date();
    const createdAt = new Date(subscription.created_at);
    const nextBillingDate = subscription.next_billing_date ? new Date(subscription.next_billing_date) : null;
    
    // If no next billing date, calculate based on frequency
    let calculatedNextBilling = nextBillingDate;
    if (!calculatedNextBilling) {
      if (subscription.frequency === 'monthly') {
        calculatedNextBilling = new Date(createdAt);
        calculatedNextBilling.setMonth(calculatedNextBilling.getMonth() + 1);
      } else if (subscription.frequency === 'annually') {
        calculatedNextBilling = new Date(createdAt);
        calculatedNextBilling.setFullYear(calculatedNextBilling.getFullYear() + 1);
      }
    }

    return json({
      hasSubscription: true,
      remainingSearches,
      subscription: {
        id: subscription.id,
        planId: subscription.plan_id,
        status: subscription.status,
        price: subscription.price,
        frequency: subscription.frequency,
        searchesLimit: subscription.searches_limit,
        paymentProvider: subscription.payment_provider,
        createdAt: subscription.created_at,
        nextBillingDate: calculatedNextBilling?.toISOString(),
        daysUntilRenewal: calculatedNextBilling ? Math.ceil((calculatedNextBilling.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null
      }
    });

  } catch (error) {
    console.error('Subscription details error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return json({ error: errorMessage }, { status: 500 });
  }
}; 