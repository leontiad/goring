import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '$lib/supabase/server';
import { env } from '$env/dynamic/private';
import Stripe from "stripe";
import { PUBLIC_SITE_URL} from '$env/static/public'

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

    // Determine frequency based on price ID (you can modify this logic as needed)
    let frequency = 'monthly'; // Default to monthly
    if (priceId.includes('annual') || priceId.includes('yearly')) {
      frequency = 'annually';
    }

    // Determine plan details based on price ID
    let searchesLimit = 10; // Default for starter plan
    let price = 10.00; // Default price
    
    if (priceId === 'price_1Rdl47CIhb9RqsL0mGLjD3qY') {
      // Starter plan
      searchesLimit = 100;
      price = 29.99;
    } else if (priceId.includes('recruiter')) {
      // Recruiter plan
      searchesLimit = 500;
      price = 99.00;
    } else if (priceId.includes('enterprise')) {
      // Enterprise plan
      searchesLimit = -1; // Unlimited
      price = 299.00;
    }

    let subscriptionId: string;
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
        success_url: `${PUBLIC_SITE_URL || 'http://localhost:5173'}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${PUBLIC_SITE_URL || 'http://localhost:5173'}/pricing`,
    });
    subscriptionId = session.id;
    paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : undefined;
    
    console.log('Payment provider response:', { subscriptionId });
    
    // Store subscription in database
    const { error: dbError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan_id: priceId,
        frequency: frequency,
        status: 'pending',
        subscription_id: subscriptionId,
        payment_provider: 'stripe',
        payment_intent_id: paymentIntentId,
        searches_limit: searchesLimit,
        price: price,
        created_at: new Date().toISOString()
      });

    if (dbError) {
      console.error('Database error:', dbError);
      return json({ error: 'Failed to create subscription in database' }, { status: 500 });
    }

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


