# Payment Integration Guide

This guide covers how to implement subscription payments for the Goring GitHub scoring tool using Stripe and PayPal.

## Overview

The payment system includes:
- Subscription plans (Starter, Recruiter, Enterprise)
- Monthly and annual billing cycles
- **Stripe integration** (primary, fully implemented)
- **PayPal integration** (secondary, simplified)
- Database storage and RLS policies
- Success/failure handling

## Payment Provider Options

### 1. Stripe (Recommended & Fully Implemented)
**Pros:**
- Excellent developer experience
- Comprehensive documentation
- Advanced features (webhooks, analytics, etc.)
- Competitive pricing
- Global reach

**Cons:**
- Requires PCI compliance (handled by Stripe)

**Setup:**
1. Create Stripe account
2. Get API keys (publishable and secret)
3. Configure webhooks
4. Update environment variables

### 2. PayPal (Simplified Implementation)
**Pros:**
- Widely trusted globally
- Easy integration
- Good developer documentation

**Cons:**
- Higher fees than Stripe
- Less developer-friendly

## Implementation Steps

### 1. Database Setup

Run the SQL script in `subscriptions_table.sql` in your Supabase SQL editor:

```sql
-- Copy and paste the contents of subscriptions_table.sql
```

### 2. Environment Variables

Add to your `.env` file:

```env
# Stripe (Required)
STRIPE_SECRET_KEY=sk_test_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# PayPal (Optional)
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_secret

# Site URL
PUBLIC_SITE_URL=http://localhost:5173
```

### 3. Stripe Integration

#### Frontend (Pricing Page)
The pricing page (`src/routes/pricing/+page.svelte`) includes:
- Plan selection with monthly/annual toggle
- Payment provider selector (Stripe/PayPal)
- Stripe SDK loading
- Subscription creation flow

#### Payment Confirmation Page
The payment confirmation page (`src/routes/subscription/confirm/+page.svelte`) handles:
- Stripe Elements integration
- Card payment processing
- Error handling
- Success redirect

#### Backend (API Endpoint)
The subscription creation endpoint (`src/routes/api/subscriptions/create/+server.ts`) handles:
- User authentication
- Plan validation
- Stripe customer creation
- Stripe subscription creation
- Database storage

### 4. Webhook Handling

Create a webhook endpoint to handle Stripe events:

```typescript
// src/routes/api/webhooks/stripe/+server.ts
export const POST: RequestHandler = async (event) => {
  const body = await event.request.text();
  const signature = event.request.headers.get('stripe-signature');
  
  // Verify webhook signature
  const stripeEvent = stripe.webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );
  
  // Handle different event types
  switch (stripeEvent.type) {
    case 'invoice.payment_succeeded':
      // Update subscription status to active
      break;
    case 'invoice.payment_failed':
      // Handle payment failure
      break;
    case 'customer.subscription.deleted':
      // Handle subscription cancellation
      break;
  }
};
```

## Stripe Implementation Details

### Customer Management
- Automatically creates or retrieves existing customers
- Links customers to Supabase user accounts
- Stores customer metadata

### Price Management
- Dynamically creates Stripe prices for each plan/frequency combination
- Uses lookup keys for efficient price retrieval
- Supports monthly and annual billing

### Subscription Flow
1. User selects plan and payment method
2. Backend creates Stripe subscription with `payment_behavior: 'default_incomplete'`
3. User is redirected to payment confirmation page
4. User enters card details and confirms payment
5. Stripe processes payment and webhook updates subscription status

### Error Handling
- Comprehensive error handling for payment failures
- User-friendly error messages
- Retry mechanisms for failed payments

## PayPal Implementation

The PayPal integration is currently simplified and includes:
- Basic subscription creation
- Mock payment flow for demonstration
- Database storage of subscription details

For full PayPal integration, you would need to:
1. Implement PayPal Subscriptions API
2. Create PayPal billing plans
3. Handle PayPal webhooks
4. Implement proper error handling

## Subscription Management

### Updating Search Limits

The search limit API now checks for active subscriptions:

```typescript
// src/routes/api/search-limit/+server.ts
export const GET: RequestHandler = async (event) => {
  const supabase = createClient(event);
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user has active subscription
  const { data: subscription } = await supabase
    .rpc('get_user_active_subscription', { user_uuid: user.id });

  if (subscription && subscription.length > 0) {
    const sub = subscription[0];
    return json({
      remainingSearches: sub.searches_limit === -1 ? -1 : sub.searches_limit,
      hasSubscription: true,
      plan: sub.plan_id,
      paymentProvider: sub.payment_provider
    });
  }

  // Fall back to free tier logic
  // ... existing free tier code
};
```

## Testing

### Stripe Testing
1. Use Stripe test mode
2. Use test card numbers (e.g., 4242 4242 4242 4242)
3. Test subscription creation and webhook handling
4. Verify database updates

### Production Checklist
- [ ] Update environment variables to production
- [ ] Configure webhook URLs in Stripe dashboard
- [ ] Test with real payment methods
- [ ] Set up monitoring and error handling
- [ ] Configure backup payment methods

## Security Considerations

1. **Webhook Verification**: Always verify Stripe webhook signatures
2. **Idempotency**: Use idempotency keys to prevent duplicate charges
3. **RLS Policies**: Ensure proper database access controls
4. **Error Handling**: Gracefully handle payment failures
5. **Logging**: Log all payment events for debugging

## Monitoring and Analytics

Track key metrics:
- Subscription conversion rate
- Payment success/failure rates
- Churn rate
- Revenue per user
- Plan distribution
- Payment provider usage

## Troubleshooting

### Common Issues

1. **Webhook not receiving events**
   - Check webhook URL configuration in Stripe dashboard
   - Verify signature validation
   - Check server logs

2. **Subscription not activating**
   - Verify database permissions
   - Check RLS policies
   - Validate webhook payload

3. **Payment failures**
   - Check card details
   - Verify account limits
   - Review Stripe dashboard for errors

### Support Resources

- [Stripe Documentation](https://stripe.com/docs)
- [PayPal Developer Documentation](https://developer.paypal.com/)
- [Supabase Documentation](https://supabase.com/docs)

## Next Steps

1. **Set up Stripe account** and get API keys
2. **Run the database setup script** in Supabase
3. **Update environment variables** with your Stripe keys
4. **Test the integration** in Stripe test mode
5. **Configure webhooks** for production
6. **Deploy to production** with proper monitoring

## Files Created/Updated

- `src/routes/pricing/+page.svelte` - Enhanced pricing page with payment provider selection
- `src/routes/api/subscriptions/create/+server.ts` - Subscription creation API with Stripe/PayPal support
- `src/routes/subscription/confirm/+page.svelte` - Stripe payment confirmation page
- `src/routes/subscription/success/+page.svelte` - Subscription success page
- `subscriptions_table.sql` - Updated database schema
- `PAYMENT_INTEGRATION.md` - This guide 