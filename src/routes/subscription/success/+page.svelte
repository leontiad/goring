<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { createClient } from '$lib/supabase/client';
  
  let subscriptionId = '';
  let loading = true;
  let error: string | null = null;
  
  const supabase = createClient();

  onMount(() => {
    subscriptionId = $page.url.searchParams.get('subscription_id') || '';
    
    if (subscriptionId) {
      verifySubscription();
    } else {
      error = 'No subscription ID provided';
      loading = false;
    }
  });

  async function verifySubscription() {
    try {
      // In a real implementation, you would verify the subscription with PayPal
      // and update the database status
      
      // For demo purposes, we'll simulate a successful verification
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update subscription status in database
      const { error: dbError } = await supabase
        .from('subscriptions')
        .update({ status: 'active' })
        .eq('subscription_id', subscriptionId);

      if (dbError) {
        console.error('Database error:', dbError);
        error = 'Failed to activate subscription';
      }
      
    } catch (err) {
      console.error('Verification error:', err);
      error = 'Failed to verify subscription';
    } finally {
      loading = false;
    }
  }

  function goToDashboard() {
    goto('/dashboard');
  }
</script>

<div class="success-page">
  <div class="success-card">
    {#if loading}
      <div class="loading-state">
        <div class="spinner"></div>
        <h2>Activating your subscription...</h2>
        <p>Please wait while we set up your account.</p>
      </div>
    {:else if error}
      <div class="error-state">
        <div class="error-icon">⚠️</div>
        <h2>Something went wrong</h2>
        <p>{error}</p>
        <button class="retry-button" on:click={verifySubscription}>
          Try Again
        </button>
      </div>
    {:else}
      <div class="success-state">
        <div class="success-icon">✅</div>
        <h1>Welcome to Goring!</h1>
        <p class="subtitle">Your subscription has been activated successfully.</p>
        
        <div class="subscription-details">
          <h3>Subscription Details</h3>
          <div class="detail-item">
            <span class="label">Subscription ID:</span>
            <span class="value">{subscriptionId}</span>
          </div>
          <div class="detail-item">
            <span class="label">Status:</span>
            <span class="value status-active">Active</span>
          </div>
        </div>

        <div class="next-steps">
          <h3>What's next?</h3>
          <ul>
            <li>Start searching GitHub profiles with unlimited access</li>
            <li>Explore advanced scoring features</li>
            <li>Save and compare your results</li>
          </ul>
        </div>

        <button class="cta-button" on:click={goToDashboard}>
          Go to Dashboard
        </button>
      </div>
    {/if}
  </div>
</div>

<style>
  .success-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-lg);
    background: linear-gradient(135deg, var(--background), var(--background-secondary));
  }

  .success-card {
    background: var(--card-bg);
    border-radius: var(--radius-xl);
    padding: var(--spacing-xxl);
    box-shadow: var(--shadow-lg);
    border: 1px solid var(--border);
    max-width: 600px;
    width: 100%;
    text-align: center;
  }

  .loading-state,
  .error-state,
  .success-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-lg);
  }

  .spinner {
    width: 48px;
    height: 48px;
    border: 4px solid var(--border);
    border-top: 4px solid var(--accent);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .success-icon,
  .error-icon {
    font-size: 4rem;
    margin-bottom: var(--spacing-md);
  }

  h1 {
    font-size: 2.5rem;
    color: var(--text);
    margin: 0;
  }

  h2 {
    font-size: 1.75rem;
    color: var(--text);
    margin: 0;
  }

  h3 {
    font-size: 1.25rem;
    color: var(--text);
    margin: 0 0 var(--spacing-md) 0;
  }

  .subtitle {
    font-size: 1.125rem;
    color: var(--text-secondary);
    margin: 0;
  }

  p {
    color: var(--text-secondary);
    margin: 0;
  }

  .subscription-details {
    background: var(--background-secondary);
    padding: var(--spacing-lg);
    border-radius: var(--radius-lg);
    width: 100%;
    text-align: left;
  }

  .detail-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-sm) 0;
    border-bottom: 1px solid var(--border);
  }

  .detail-item:last-child {
    border-bottom: none;
  }

  .label {
    font-weight: 600;
    color: var(--text);
  }

  .value {
    color: var(--text-secondary);
    font-family: monospace;
  }

  .status-active {
    color: var(--success);
    font-weight: 600;
  }

  .next-steps {
    text-align: left;
    width: 100%;
  }

  .next-steps ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .next-steps li {
    padding: var(--spacing-sm) 0;
    color: var(--text-secondary);
    position: relative;
    padding-left: var(--spacing-lg);
  }

  .next-steps li::before {
    content: "→";
    position: absolute;
    left: 0;
    color: var(--accent);
    font-weight: bold;
  }

  .cta-button,
  .retry-button {
    background: var(--accent);
    color: white;
    border: none;
    padding: var(--spacing-md) var(--spacing-xl);
    border-radius: var(--radius-md);
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-top: var(--spacing-lg);
  }

  .cta-button:hover,
  .retry-button:hover {
    background: var(--accent-hover);
    transform: translateY(-2px);
  }

  @media (max-width: 768px) {
    .success-card {
      padding: var(--spacing-lg);
    }

    h1 {
      font-size: 2rem;
    }

    h2 {
      font-size: 1.5rem;
    }

    .detail-item {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--spacing-xs);
    }
  }
</style> 