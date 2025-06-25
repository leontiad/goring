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
      // PayPal integration
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
  try {
    // PayPal API configuration
    const paypalClientId = env.PAYPAL_CLIENT_ID;
    const paypalClientSecret = env.PAYPAL_CLIENT_SECRET;
    const isProduction = env.NODE_ENV === 'production';
    const paypalBaseUrl = isProduction ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
    
    if (!paypalClientId || !paypalClientSecret) {
      throw new Error('PayPal credentials not configured');
    }

    // Get PayPal access token
    const tokenResponse = await fetch(`${paypalBaseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${paypalClientId}:${paypalClientSecret}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to get PayPal access token');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Create PayPal subscription
    const subscriptionPayload = {
      plan_id: getPayPalPlanId(planId, frequency),
      start_time: new Date(Date.now() + 60000).toISOString(), // Start in 1 minute
      subscriber: {
        name: {
          given_name: user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'User',
          surname: user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || 'Name'
        },
        email_address: user.email
      },
      application_context: {
        brand_name: 'GitHub Score',
        locale: 'en-US',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'SUBSCRIBE_NOW',
        payment_method: {
          payer_selected: 'PAYPAL',
          payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED'
        },
        return_url: `${env.PUBLIC_SITE_URL || 'http://localhost:5173'}/subscription/success`,
        cancel_url: `${env.PUBLIC_SITE_URL || 'http://localhost:5173'}/pricing`
      }
    };

    const subscriptionResponse = await fetch(`${paypalBaseUrl}/v1/billing/subscriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(subscriptionPayload)
    });

    if (!subscriptionResponse.ok) {
      const errorData = await subscriptionResponse.json();
      console.error('PayPal subscription creation error:', errorData);
      throw new Error('Failed to create PayPal subscription');
    }

    const subscriptionData = await subscriptionResponse.json();
    
    return {
      subscriptionId: subscriptionData.id,
      approvalUrl: subscriptionData.links.find((link: any) => link.rel === 'approve')?.href
    };
  } catch (error) {
    console.error('PayPal subscription error:', error);
    throw error;
  }
}

function getPayPalPlanId(planId: string, frequency: string): string {
  // You need to create these plans in your PayPal dashboard first
  // For now, we'll use placeholder IDs - replace with your actual PayPal plan IDs
  const paypalPlans = {
    starter: {
      monthly: env.PAYPAL_STARTER_MONTHLY_PLAN_ID || 'P-123456789',
      annually: env.PAYPAL_STARTER_ANNUALLY_PLAN_ID || 'P-987654321'
    },
    recruiter: {
      monthly: env.PAYPAL_RECRUITER_MONTHLY_PLAN_ID || 'P-111111111',
      annually: env.PAYPAL_RECRUITER_ANNUALLY_PLAN_ID || 'P-222222222'
    },
    enterprise: {
      monthly: env.PAYPAL_ENTERPRISE_MONTHLY_PLAN_ID || 'P-333333333',
      annually: env.PAYPAL_ENTERPRISE_ANNUALLY_PLAN_ID || 'P-444444444'
    }
  };

  const plan = paypalPlans[planId as keyof typeof paypalPlans];
  if (!plan) {
    throw new Error(`Invalid plan: ${planId}`);
  }

  const paypalPlanId = plan[frequency as keyof typeof plan];
  if (!paypalPlanId) {
    throw new Error(`Invalid frequency: ${frequency}`);
  }

  return paypalPlanId;
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