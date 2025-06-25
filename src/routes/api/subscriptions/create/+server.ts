import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '$lib/supabase/server';
import { env } from '$env/dynamic/private';
import Stripe from "stripe";

if (!env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

export const POST: RequestHandler = async (event) => {
  try {
    const supabase = createClient(event);
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { priceId, userId } = await event.request.json();

    console.log('Subscription creation request:', { priceId, userId });

    


    let subscriptionId: string;
    let approvalUrl: string;
    let paymentIntentId: string | undefined;

    // Stripe integration (only payment provider)
    console.log('Creating Stripe subscription...');
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      line_items: [{
        price: priceId,
        quantity: 1
      }],
      mode: 'subscription',
      success_url: `${env.PUBLIC_SITE_URL || 'http://localhost:5173'}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.PUBLIC_SITE_URL || 'http://localhost:5173'}/pricing`,
    });
    subscriptionId = session.id;
    
    console.log('Payment provider response:', { subscriptionId });
    
    // Store subscription in database
    // const { error: dbError } = await supabase
    //   .from('subscriptions')
    //   .insert({
    //     user_id: userId,
    //     plan_id: priceId,
    //     frequency: frequency,
    //     status: 'pending',
    //     subscription_id: subscriptionId,
    //     payment_provider: 'stripe',
    //     payment_intent_id: paymentIntentId,
    //     // searches_limit: planDetails.searches,
    //     // price: planDetails.price,
    //     created_at: new Date().toISOString()
    //   });

    // if (dbError) {
    //   console.error('Database error:', dbError);
    //   return json({ error: 'Failed to create subscription in database' }, { status: 500 });
    // }

    console.log('Subscription created successfully');

    return json({
      sessionId:subscriptionId
    });

  } catch (error) {
    console.error('Subscription creation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return json({ error: errorMessage }, { status: 500 });
  }
};


