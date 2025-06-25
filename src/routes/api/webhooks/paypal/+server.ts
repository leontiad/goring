import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '$lib/supabase/server';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async (event) => {
  try {
    const supabase = createClient(event);
    const body = await event.request.text();
    const headers = Object.fromEntries(event.request.headers.entries());
    
    // Verify webhook signature (in production, you should verify the webhook)
    // For now, we'll process the webhook without verification
    
    const webhookData = JSON.parse(body);
    console.log('PayPal webhook received:', webhookData.event_type, webhookData.resource?.id);
    
    // Handle different webhook events
    switch (webhookData.event_type) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        await handleSubscriptionActivated(supabase, webhookData.resource);
        break;
      case 'BILLING.SUBSCRIPTION.CANCELLED':
        await handleSubscriptionCancelled(supabase, webhookData.resource);
        break;
      case 'BILLING.SUBSCRIPTION.EXPIRED':
        await handleSubscriptionExpired(supabase, webhookData.resource);
        break;
      case 'PAYMENT.SALE.COMPLETED':
        await handlePaymentCompleted(supabase, webhookData.resource);
        break;
      default:
        console.log('Unhandled webhook event:', webhookData.event_type);
    }
    
    return json({ success: true });
  } catch (error) {
    console.error('PayPal webhook error:', error);
    return json({ error: 'Webhook processing failed' }, { status: 500 });
  }
};

async function handleSubscriptionActivated(supabase: any, subscription: any) {
  console.log('Handling subscription activated:', subscription.id);
  
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      updated_at: new Date().toISOString()
    })
    .eq('subscription_id', subscription.id);
    
  if (error) {
    console.error('Error updating subscription status:', error);
  }
}

async function handleSubscriptionCancelled(supabase: any, subscription: any) {
  console.log('Handling subscription cancelled:', subscription.id);
  
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString()
    })
    .eq('subscription_id', subscription.id);
    
  if (error) {
    console.error('Error updating subscription status:', error);
  }
}

async function handleSubscriptionExpired(supabase: any, subscription: any) {
  console.log('Handling subscription expired:', subscription.id);
  
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'expired',
      updated_at: new Date().toISOString()
    })
    .eq('subscription_id', subscription.id);
    
  if (error) {
    console.error('Error updating subscription status:', error);
  }
}

async function handlePaymentCompleted(supabase: any, payment: any) {
  console.log('Handling payment completed:', payment.id);
  
  // Update the subscription status if this is the first payment
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      updated_at: new Date().toISOString()
    })
    .eq('subscription_id', payment.billing_agreement_id)
    .eq('status', 'pending');
    
  if (error) {
    console.error('Error updating subscription status:', error);
  }
} 