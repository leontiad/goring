import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '$lib/supabase/server';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async (event) => {
  try {
    const supabase = createClient(event);
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planId, frequency, userId, paymentProvider = 'stripe' } = await event.request.json();

    // Validate input
    if (!planId || !frequency || !userId) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Define plan details
    const plans = {
      starter: {
        monthly: { price: 29.99, searches: 100 },
        annually: { price: 359.88, searches: 100 }
      },
      recruiter: {
        monthly: { price: 99, searches: 500 },
        annually: { price: 1188, searches: 500 }
      },
      enterprise: {
        monthly: { price: 299, searches: -1 }, // -1 means unlimited
        annually: { price: 3588, searches: -1 }
      }
    };

    const plan = plans[planId as keyof typeof plans];
    if (!plan) {
      return json({ error: 'Invalid plan' }, { status: 400 });
    }

    const planDetails = plan[frequency as keyof typeof plan];
    if (!planDetails) {
      return json({ error: 'Invalid frequency' }, { status: 400 });
    }

    let subscriptionId: string;
    let approvalUrl: string;
    let paymentIntentId: string | undefined;

    if (paymentProvider === 'stripe') {
      // Stripe integration
      const stripeResponse = await createStripeSubscription(planId, frequency, planDetails, user);
      subscriptionId = stripeResponse.subscriptionId;
      approvalUrl = stripeResponse.approvalUrl;
      paymentIntentId = stripeResponse.paymentIntentId;
    } else if (paymentProvider === 'paypal') {
      // PayPal integration (simplified for now)
      const paypalResponse = await createPayPalSubscription(planId, frequency, planDetails, user);
      subscriptionId = paypalResponse.subscriptionId;
      approvalUrl = paypalResponse.approvalUrl;
    } else {
      return json({ error: 'Unsupported payment provider' }, { status: 400 });
    }
    
    // Store subscription in database
    const { error: dbError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan_id: planId,
        frequency: frequency,
        status: 'pending',
        subscription_id: subscriptionId,
        payment_provider: paymentProvider,
        payment_intent_id: paymentIntentId,
        searches_limit: planDetails.searches,
        price: planDetails.price,
        created_at: new Date().toISOString()
      });

    if (dbError) {
      console.error('Database error:', dbError);
      return json({ error: 'Failed to create subscription' }, { status: 500 });
    }

    return json({
      subscriptionId,
      approvalUrl,
      paymentProvider,
      message: 'Subscription created successfully'
    });

  } catch (error) {
    console.error('Subscription creation error:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

async function createStripeSubscription(planId: string, frequency: string, planDetails: any, user: any) {
  // Import Stripe dynamically to avoid issues if not installed
  const stripe = await import('stripe');
  const stripeClient = new stripe.default(env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-05-28.basil'
  });

  // Create or get customer
  let customer;
  const existingCustomers = await stripeClient.customers.list({
    email: user.email,
    limit: 1
  });

  if (existingCustomers.data.length > 0) {
    customer = existingCustomers.data[0];
  } else {
    customer = await stripeClient.customers.create({
      email: user.email,
      metadata: {
        user_id: user.id
      }
    });
  }

  // Create price ID based on plan and frequency
  const priceId = await getOrCreateStripePrice(stripeClient, planId, frequency, planDetails.price);

  // Create subscription
  const subscription = await stripeClient.subscriptions.create({
    customer: customer.id,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    payment_settings: { save_default_payment_method: 'on_subscription' },
    expand: ['latest_invoice.payment_intent'],
    metadata: {
      user_id: user.id,
      plan_id: planId,
      frequency: frequency
    }
  });

  const paymentIntent = (subscription.latest_invoice as any)?.payment_intent;

  return {
    subscriptionId: subscription.id,
    approvalUrl: paymentIntent?.client_secret ? 
      `/subscription/confirm?payment_intent=${paymentIntent.client_secret}` : 
      `/subscription/success?subscription_id=${subscription.id}`,
    paymentIntentId: paymentIntent?.id
  };
}

async function createPayPalSubscription(planId: string, frequency: string, planDetails: any, user: any) {
  // Simplified PayPal integration - in production you'd use the full SDK
  // For now, we'll create a mock subscription and redirect to PayPal checkout
  
  const subscriptionId = `paypal_sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // In a real implementation, you would:
  // 1. Create PayPal subscription using their API
  // 2. Get the approval URL from PayPal
  // 3. Return the PayPal checkout URL
  
  // For demo purposes, we'll redirect to a success page
  const approvalUrl = `/subscription/success?subscription_id=${subscriptionId}`;

  return {
    subscriptionId,
    approvalUrl
  };
}

async function getOrCreateStripePrice(stripeClient: any, planId: string, frequency: string, price: number) {
  // Check if price already exists
  const prices = await stripeClient.prices.list({
    active: true,
    lookup_keys: [`${planId}_${frequency}`]
  });

  if (prices.data.length > 0) {
    return prices.data[0].id;
  }

  // Create new price
  const newPrice = await stripeClient.prices.create({
    unit_amount: Math.round(price * 100), // Convert to cents
    currency: 'usd',
    recurring: {
      interval: frequency === 'monthly' ? 'month' : 'year'
    },
    lookup_key: `${planId}_${frequency}`,
    metadata: {
      plan_id: planId,
      frequency: frequency
    }
  });

  return newPrice.id;
} 