<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { createClient } from '$lib/supabase/client';
  import Layout from '$lib/components/Layout.svelte';

  let loading = true;
  let error: string | null = null;
  let subscriptionData: any = null;
  
  const supabase = createClient();

  onMount(async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const subscriptionId = urlParams.get('session_id');
      const paymentIntent = urlParams.get('payment_intent');
      // const isTest = urlParams.get('test') === 'true';

      if (!subscriptionId ) {
        error = 'No subscription information found';
        loading = false;
        return;
      }

      // if (isTest) {
      //   // Handle test subscription
      //   subscriptionData = {
      //     id: subscriptionId,
      //     status: 'active',
      //     test: true
      //   };
      //   loading = false;
      //   return;
      // }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        error = 'User not authenticated';
        loading = false;
        return;
      }

      // Update subscription status in database
      if (subscriptionId) {
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('subscription_id', subscriptionId)
          .eq('user_id', user.id);

        if (updateError) {
          console.error('Error updating subscription:', updateError);
        }
      }

      // Fetch subscription details
      const { data: subscription, error: fetchError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('subscription_id', subscriptionId || paymentIntent)
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        console.error('Error fetching subscription:', fetchError);
        error = 'Failed to load subscription details';
      } else {
        subscriptionData = subscription;
      }

    } catch (err) {
      console.error('Success page error:', err);
      error = 'An unexpected error occurred';
    } finally {
      loading = false;
    }
  });

  function goToDashboard() {
    goto('/dashboard');
  }

  function goToPricing() {
    goto('/pricing');
  }
</script>

<Layout>
  <div class="success-page">
    {#if loading}
      <div class="loading">
        <div class="spinner"></div>
        <p>Processing your subscription...</p>
      </div>
    {:else if error}
      <div class="error">
        <h1>Something went wrong</h1>
        <p>{error}</p>
        <button class="btn-primary" on:click={goToPricing}>Back to Pricing</button>
      </div>
    {:else}
      <div class="success">
        <div class="success-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </div>
        
        <h1>Subscription Successful!</h1>
        
        {#if subscriptionData?.test}
          <p class="test-notice">This was a test subscription. In production, you would be redirected to PayPal for payment.</p>
        {/if}
        
        <div class="subscription-details">
          <h2>Subscription Details</h2>
          <div class="detail-row">
            <span class="label">Status:</span>
            <span class="value status-active">Active</span>
          </div>
          {#if subscriptionData?.plan_id}
            <div class="detail-row">
              <span class="label">Plan:</span>
              <span class="value">{subscriptionData.plan_id.charAt(0).toUpperCase() + subscriptionData.plan_id.slice(1)}</span>
            </div>
          {/if}
          {#if subscriptionData?.frequency}
            <div class="detail-row">
              <span class="label">Billing:</span>
              <span class="value">{subscriptionData.frequency.charAt(0).toUpperCase() + subscriptionData.frequency.slice(1)}</span>
            </div>
          {/if}
          {#if subscriptionData?.price}
            <div class="detail-row">
              <span class="label">Price:</span>
              <span class="value">${subscriptionData.price}</span>
            </div>
          {/if}
        </div>

        <div class="actions">
          <button class="btn-primary" on:click={goToDashboard}>
            Go to Dashboard
          </button>
          <button class="btn-secondary" on:click={goToPricing}>
            Back to Pricing
          </button>
        </div>
      </div>
    {/if}
  </div>
</Layout>

<style>
  .success-page {
    max-width: 600px;
    margin: 0 auto;
    padding: 2rem;
    text-align: center;
  }

  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .error {
    color: #ef4444;
  }

  .success {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
  }

  .success-icon {
    color: #10b981;
    margin-bottom: 1rem;
  }

  h1 {
    font-size: 2.5rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0;
  }

  .test-notice {
    background: #fef3c7;
    color: #92400e;
    padding: 1rem;
    border-radius: 0.5rem;
    border: 1px solid #f59e0b;
    font-size: 0.875rem;
  }

  .subscription-details {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    padding: 1.5rem;
    width: 100%;
    max-width: 400px;
  }

  .subscription-details h2 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #374151;
    margin: 0 0 1rem 0;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid #e5e7eb;
  }

  .detail-row:last-child {
    border-bottom: none;
  }

  .label {
    font-weight: 500;
    color: #6b7280;
  }

  .value {
    font-weight: 600;
    color: #1f2937;
  }

  .status-active {
    color: #10b981;
  }

  .actions {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    justify-content: center;
  }

  .btn-primary, .btn-secondary {
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-weight: 500;
    text-decoration: none;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-primary {
    background: #3b82f6;
    color: white;
  }

  .btn-primary:hover {
    background: #2563eb;
  }

  .btn-secondary {
    background: #f3f4f6;
    color: #374151;
    border: 1px solid #d1d5db;
  }

  .btn-secondary:hover {
    background: #e5e7eb;
  }
</style> 