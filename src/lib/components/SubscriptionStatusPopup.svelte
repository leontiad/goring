<script lang="ts">
  import { onMount } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  import { goto } from '$app/navigation';

  export let show = false;

  const dispatch = createEventDispatcher();

  let loading = false;
  let error: string | null = null;
  let subscriptionData: any = null;
  let remainingSearches = 0;

  onMount(async () => {
    if (show) {
      await loadSubscriptionData();
    }
  });

  async function loadSubscriptionData() {
    try {
      loading = true;
      error = null;

      console.log('Loading subscription data...');
      
      // Test mode - bypass API call for debugging
      if (false) { // Set to true to test without API
        console.log('Test mode - showing test data');
        subscriptionData = {
          id: 'test-123',
          planId: 'price_1Rdl47CIhb9RqsL0mGLjD3qY',
          status: 'active',
          price: 10.00,
          frequency: 'monthly',
          searchesLimit: 100,
          paymentProvider: 'stripe',
          createdAt: new Date().toISOString(),
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          daysUntilRenewal: 30
        };
        remainingSearches = 85;
        loading = false;
        return;
      }

      // Check if user is authenticated
      const { createClient } = await import('$lib/supabase/client');
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated. Please log in to view subscription details.');
      }

      const response = await fetch('/api/subscriptions/details');
      const data = await response.json();

      console.log('API response:', { status: response.status, data });

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      subscriptionData = data.subscription;
      remainingSearches = data.remainingSearches;

      console.log('Subscription data loaded:', { subscriptionData, remainingSearches });

    } catch (err) {
      console.error('Error loading subscription data:', err);
      error = err instanceof Error ? err.message : 'Failed to load subscription details';
    } finally {
      loading = false;
    }
  }

  function closePopup() {
    console.log('Close button clicked');
    dispatch('close');
  }

  function goToPricing() {
    goto('/pricing');
    closePopup();
  }

  function goToDashboard() {
    goto('/dashboard');
    closePopup();
  }

  // Watch for show changes to load data
  $: if (show) {
    console.log('Popup opened, resetting state and loading data');
    loading = true;
    error = null;
    subscriptionData = null;
    remainingSearches = 0;
    loadSubscriptionData();
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  function formatPrice(price: number) {
    return `$${price.toFixed(2)}`;
  }

  function getPlanName(planId: string) {
    const planNames: { [key: string]: string } = {
      'price_1Rdl47CIhb9RqsL0mGLjD3qY': 'Starter',
      'recruiter': 'Recruiter',
      'enterprise': 'Enterprise'
    };
    return planNames[planId] || planId;
  }
</script>

{#if show}
  <div 
    class="popup-overlay" 
    on:click={closePopup}
    on:keydown={(e) => e.key === 'Escape' && closePopup()}
    role="dialog"
    aria-modal="true"
    aria-labelledby="popup-title"
    tabindex="-1"
  >
    <div class="popup-content" on:click|stopPropagation>
      <button class="close-button" on:click={closePopup} aria-label="Close subscription details">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      {#if loading}
        <div class="loading">
          <div class="spinner"></div>
          <p>Loading subscription details...</p>
        </div>
      {:else if error}
        <div class="error">
          <h2 id="popup-title">Something went wrong</h2>
          <p>{error}</p>
          {#if error.includes('Unauthorized') || error.includes('not authenticated')}
            <p>Please make sure you're logged in to view your subscription details.</p>
            <button class="btn-primary" on:click={closePopup}>Close</button>
          {:else}
            <button class="btn-primary" on:click={goToPricing}>Go to Pricing</button>
          {/if}
        </div>
      {:else if !subscriptionData}
        <div class="no-subscription">
          <div class="no-subscription-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
              <path d="M2 17l10 5 10-5"></path>
              <path d="M2 12l10 5 10-5"></path>
            </svg>
          </div>
          
          <h2 id="popup-title">No Active Subscription</h2>
          <p>You're currently on the free plan with limited searches.</p>
          
          <div class="subscription-details">
            <h3>Current Status</h3>
            <div class="detail-row">
              <span class="label">Plan:</span>
              <span class="value">Free</span>
            </div>
            <div class="detail-row">
              <span class="label">Remaining Searches:</span>
              <span class="value">{remainingSearches}</span>
            </div>
            <div class="detail-row">
              <span class="label">Search Limit:</span>
              <span class="value">2 per day</span>
            </div>
          </div>

          <div class="actions">
            <button class="btn-primary" on:click={goToPricing}>
              Upgrade Now
            </button>
            <button class="btn-secondary" on:click={goToDashboard}>
              Go to Dashboard
            </button>
          </div>
        </div>
      {:else}
        <div class="subscription-active">
          <div class="success-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          
          <h2 id="popup-title">Active Subscription</h2>
          <p>You have an active subscription with enhanced features.</p>
          
          <div class="subscription-details">
            <h3>Subscription Details</h3>
            <div class="detail-row">
              <span class="label">Status:</span>
              <span class="value status-active">Active</span>
            </div>
            <div class="detail-row">
              <span class="label">Plan:</span>
              <span class="value">{getPlanName(subscriptionData.planId)}</span>
            </div>
            <div class="detail-row">
              <span class="label">Price:</span>
              <span class="value">{formatPrice(subscriptionData.price)}</span>
            </div>
            <div class="detail-row">
              <span class="label">Billing:</span>
              <span class="value">{subscriptionData.frequency.charAt(0).toUpperCase() + subscriptionData.frequency.slice(1)}</span>
            </div>
            <div class="detail-row">
              <span class="label">Remaining Searches:</span>
              <span class="value">
                {subscriptionData.searchesLimit === -1 ? 'Unlimited' : remainingSearches}
              </span>
            </div>
            {#if subscriptionData.daysUntilRenewal !== null}
              <div class="detail-row">
                <span class="label">Next Billing:</span>
                <span class="value">
                  {subscriptionData.daysUntilRenewal > 0 
                    ? `${subscriptionData.daysUntilRenewal} days` 
                    : 'Today'}
                </span>
              </div>
            {/if}
            <div class="detail-row">
              <span class="label">Payment Method:</span>
              <span class="value">{subscriptionData.paymentProvider.charAt(0).toUpperCase() + subscriptionData.paymentProvider.slice(1)}</span>
            </div>
          </div>

          <div class="actions">
            <button class="btn-primary" on:click={goToDashboard}>
              Go to Dashboard
            </button>
            <button class="btn-secondary" on:click={goToPricing}>
              Manage Subscription
            </button>
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .popup-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(4px);
  }

  .popup-content {
    background: var(--background);
    border: 1px solid var(--border);
    border-radius: 0.75rem;
    padding: 2rem;
    max-width: 500px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }

  .close-button {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 0.25rem;
    transition: all 0.2s ease;
    z-index: 10;
  }

  .close-button:hover {
    color: var(--text);
    background: var(--background-secondary);
  }

  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    text-align: center;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid var(--border);
    border-top: 4px solid var(--accent);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .error {
    text-align: center;
    color: var(--error);
  }

  .error h2 {
    margin-bottom: 1rem;
  }

  .no-subscription, .subscription-active {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    text-align: center;
  }

  .no-subscription-icon, .success-icon {
    color: var(--text-secondary);
    margin-bottom: 0.5rem;
  }

  .success-icon {
    color: var(--success);
  }

  h2 {
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--text);
    margin: 0;
  }

  p {
    color: var(--text-secondary);
    margin: 0;
    line-height: 1.6;
  }

  .subscription-details {
    background: var(--background-secondary);
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    padding: 1.5rem;
    width: 100%;
  }

  .subscription-details h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text);
    margin: 0 0 1rem 0;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--border);
  }

  .detail-row:last-child {
    border-bottom: none;
  }

  .label {
    font-weight: 500;
    color: var(--text-secondary);
  }

  .value {
    font-weight: 600;
    color: var(--text);
  }

  .status-active {
    color: var(--success);
  }

  .actions {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    justify-content: center;
    margin-top: 1rem;
  }

  .btn-primary, .btn-secondary {
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-weight: 500;
    text-decoration: none;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.875rem;
  }

  .btn-primary {
    background: var(--accent);
    color: white;
  }

  .btn-primary:hover {
    background: var(--accent-hover);
  }

  .btn-secondary {
    background: var(--background);
    color: var(--text);
    border: 1px solid var(--border);
  }

  .btn-secondary:hover {
    background: var(--background-secondary);
  }

  @media (max-width: 640px) {
    .popup-content {
      padding: 1.5rem;
      margin: 1rem;
    }

    .actions {
      flex-direction: column;
    }

    .btn-primary, .btn-secondary {
      width: 100%;
    }
  }
</style> 