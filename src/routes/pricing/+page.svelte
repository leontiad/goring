<script lang="ts">
  import { fade } from 'svelte/transition';
  import { onMount } from 'svelte';
  import { createClient } from '$lib/supabase/client';
  
  let selectedFrequency = 'monthly';
  let selectedPaymentProvider = 'stripe';
  let loading = false;
  let error: string | null = null;
  
  const supabase = createClient();

  // Reactive statement to ensure price updates are tracked
  $: console.log('Frequency changed to:', selectedFrequency);

  const plans = [
    {
      id: 'starter',
      name: "Starter",
      price: 29.99,
      annualPrice: 287.90, // 29.99 * 12 * 0.8 (20% discount)
      description: "Perfect for individual developers",
      features: [
        "Hot: Last 30 days data",
        "Basic Scoring",
        "100 searches per month",
        "Email support"
      ],
      highlighted: false
    },
    {
      id: 'recruiter',
      name: "Recruiter",
      price: 99,
      annualPrice: 950.40, // 99 * 12 * 0.8 (20% discount)
      description: "For professional recruiters",
      features: [
        "Warm: Last year data",
        "Advanced ML",
        "Store your results",
        "500 searches per month",
        "Priority support"
      ],
      highlighted: true
    },
    {
      id: 'enterprise',
      name: "Enterprise",
      price: 299,
      annualPrice: 2870.40, // 299 * 12 * 0.8 (20% discount)
      description: "For HR departments",
      features: [
        "Cold: Arbitrary date range",
        "Advanced ML",
        "Store your results",
        "Unlimited searches",
        "Custom model training",
        "Dedicated support"
      ],
      highlighted: false
    }
  ];

  onMount(() => {
    // Load payment provider SDKs
    loadPaymentSDKs();
  });

  function loadPaymentSDKs() {
    // Load Stripe
    const stripeScript = document.createElement('script');
    stripeScript.src = 'https://js.stripe.com/v3/';
    stripeScript.onload = () => {
      console.log('Stripe SDK loaded');
    };
    document.head.appendChild(stripeScript);

    // Load PayPal
    const paypalScript = document.createElement('script');
    paypalScript.src = 'https://www.paypal.com/sdk/js?client-id=YOUR_PAYPAL_CLIENT_ID&vault=true&intent=subscription';
    paypalScript.onload = () => {
      console.log('PayPal SDK loaded');
    };
    document.head.appendChild(paypalScript);
  }

  async function handleSubscription(planId: string) {
    loading = true;
    error = null;

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Dispatch event to show login modal (handled by layout)
        window.dispatchEvent(new CustomEvent('showLoginModal'));
        return;
      }

      // Create subscription on your backend
      const response = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          frequency: selectedFrequency,
          userId: user.id,
          paymentProvider: selectedPaymentProvider
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create subscription');
      }

      const { subscriptionId, approvalUrl, paymentProvider } = await response.json();
      
      // Redirect to payment provider
      window.location.href = approvalUrl;
      
    } catch (err) {
      console.error('Subscription error:', err);
      error = err instanceof Error ? err.message : 'Failed to create subscription';
    } finally {
      loading = false;
    }
  }

  function getPrice(plan: any) {
    const price = selectedFrequency === 'monthly' ? plan.price : plan.annualPrice;
    console.log(`Getting price for ${plan.name} (${selectedFrequency}):`, price);
    return price;
  }

  function getFormattedPrice(plan: any) {
    const price = getPrice(plan);
    const formatted = `$${price.toFixed(2)}`;
    console.log(`Formatted price for ${plan.name}:`, formatted);
    return formatted;
  }

  function getSavingsAmount(plan: any) {
    if (selectedFrequency === 'annually') {
      const monthlyTotal = plan.price * 12;
      const annualPrice = plan.annualPrice;
      return monthlyTotal - annualPrice;
    }
    return 0;
  }

  function getFormattedSavings(plan: any) {
    const savings = getSavingsAmount(plan);
    if (savings > 0) {
      return `Save $${savings.toFixed(2)}`;
    }
    return '';
  }
</script>

<div class="pricing" in:fade>
  <div class="header">
    <h1>Pricing</h1>
    <p class="subtitle">Choose the plan that best fits your needs</p>
  </div>

  <div class="pricing-options">
    <div class="frequency-selector">
      <button 
        class:active={selectedFrequency === 'monthly'} 
        on:click={() => {
          selectedFrequency = 'monthly';
          console.log('Switched to monthly');
        }}
      >
        Monthly
      </button>
      <button 
        class:active={selectedFrequency === 'annually'} 
        on:click={() => {
          selectedFrequency = 'annually';
          console.log('Switched to annually');
        }}
      >
        Annually
        <span class="save-badge">Save 20%</span>
      </button>
    </div>

    <div class="payment-provider-selector">
      <label>Payment Method:</label>
      <div class="provider-buttons">
        <button 
          class:active={selectedPaymentProvider === 'stripe'} 
          on:click={() => selectedPaymentProvider = 'stripe'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.831 3.47 1.426 3.47 2.338 0 .914-.796 1.431-2.126 1.431-1.72 0-4.516-.924-6.378-2.168l-.9 5.555C6.203 22.99 9.077 24 12.165 24c2.469 0 4.763-.624 6.199-1.764 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.471l.681-4.883z"/>
          </svg>
          Credit Card
        </button>
        <button 
          class:active={selectedPaymentProvider === 'paypal'} 
          on:click={() => selectedPaymentProvider = 'paypal'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.067 8.478c.492.315.844.825.844 1.478 0 .653-.352 1.163-.844 1.478-.492.315-1.163.478-1.844.478H16.5v-2.956h1.723c.681 0 1.352.163 1.844.478zM7.933 8.478c.492-.315 1.163-.478 1.844-.478H11.5v2.956H9.777c-.681 0-1.352-.163-1.844-.478-.492-.315-.844-.825-.844-1.478 0-.653.352-1.163.844-1.478zM24 12c0 6.627-5.373 12-12 12S0 18.627 0 12 5.373 0 12 0s12 5.373 12 12z"/>
          </svg>
          PayPal
        </button>
      </div>
    </div>
  </div>

  {#if error}
    <div class="error-message">
      {error}
    </div>
  {/if}

  <div class="plans-grid">
    {#each plans as plan}
      <div class="plan-card" class:highlighted={plan.highlighted}>
        {#if plan.highlighted}
          <div class="popular-badge">Most Popular</div>
        {/if}
        
        <div class="card-header">
          <h2>{plan.name}</h2>
          <div class="price">
            ${selectedFrequency === 'monthly' ? plan.price.toFixed(2) : plan.annualPrice.toFixed(2)}
            <span class="frequency">/{selectedFrequency === 'monthly' ? 'mo' : 'year'}</span>
          </div>
          {#if selectedFrequency === 'annually'}
            <div class="savings-badge">{getFormattedSavings(plan)}</div>
          {/if}
          <p class="description">{plan.description}</p>
        </div>
        
        <ul class="features">
          {#each plan.features as feature}
            <li>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              {feature}
            </li>
          {/each}
        </ul>

        <button 
          class="cta-button"
          class:loading={loading}
          class:disabled={plan.id === 'recruiter' || plan.id === 'enterprise'}
          disabled={loading || plan.id === 'recruiter' || plan.id === 'enterprise'}
          on:click={() => plan.id !== 'recruiter' && plan.id !== 'enterprise' && handleSubscription(plan.id)}
        >
          {#if loading}
            <span class="spinner"></span>
            Processing...
          {:else if plan.id === 'recruiter' || plan.id === 'enterprise'}
            Coming Soon
          {:else}
            Subscribe Now
          {/if}
        </button>
      </div>
    {/each}
  </div>

  <div class="faq-section">
    <h3>Frequently Asked Questions</h3>
    <div class="faq-grid">
      <div class="faq-item">
        <h4>Can I cancel anytime?</h4>
        <p>Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.</p>
      </div>
      <div class="faq-item">
        <h4>What payment methods do you accept?</h4>
        <p>We accept all major credit cards, PayPal, and bank transfers for annual plans.</p>
      </div>
      <div class="faq-item">
        <h4>Do you offer refunds?</h4>
        <p>We offer a 30-day money-back guarantee for all new subscriptions.</p>
      </div>
      <div class="faq-item">
        <h4>Can I upgrade or downgrade my plan?</h4>
        <p>Yes, you can change your plan at any time. Changes take effect at the start of your next billing cycle.</p>
      </div>
    </div>
  </div>
</div>

<style>
  .pricing {
    max-width: 800px;
    margin: 0 auto;
    padding: var(--spacing-xl) 0;
  }

  .header {
    text-align: center;
    margin-bottom: var(--spacing-xl);
  }

  .header h1 {
    font-size: 2.5rem;
    margin-bottom: var(--spacing-md);
    color: var(--text);
  }

  .subtitle {
    color: var(--text-secondary);
    font-size: 1.125rem;
    max-width: 600px;
    margin: 0 auto;
  }

  .pricing-options {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-lg);
    margin-bottom: var(--spacing-xl);
  }

  .frequency-selector {
    display: flex;
    gap: var(--spacing-sm);
    background: var(--background-secondary);
    padding: var(--spacing-xs);
    border-radius: var(--radius-lg);
    border: 1px solid var(--border);
  }

  .frequency-selector button {
    padding: var(--spacing-sm) var(--spacing-lg);
    border: none;
    background: none;
    color: var(--text-secondary);
    border-radius: var(--radius-md);
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.2s ease;
    position: relative;
  }

  .frequency-selector button:hover {
    color: var(--text);
  }

  .frequency-selector button.active {
    background: var(--accent);
    color: white;
  }

  .save-badge {
    position: absolute;
    top: -8px;
    right: -8px;
    background: var(--success);
    color: white;
    font-size: 0.75rem;
    padding: 2px 6px;
    border-radius: var(--radius-sm);
    font-weight: 600;
  }

  .error-message {
    background: var(--error-bg);
    color: var(--error);
    padding: var(--spacing-md);
    border-radius: var(--radius-md);
    margin-bottom: var(--spacing-lg);
    text-align: center;
    border: 1px solid var(--error-border);
  }

  .plans-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-xl);
    margin-top: var(--spacing-xl);
  }

  .plan-card {
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: var(--spacing-lg);
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
    height: 100%;
    box-sizing: border-box;
    position: relative;
  }

  .plan-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
    border-color: var(--accent);
    background: linear-gradient(to bottom, var(--card-bg), var(--background-secondary));
  }

  .plan-card.highlighted {
    border-color: var(--accent);
    box-shadow: 0 0 0 2px var(--accent-alpha);
  }

  .popular-badge {
    position: absolute;
    top: -12px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--accent);
    color: white;
    padding: var(--spacing-xs) var(--spacing-md);
    border-radius: var(--radius-full);
    font-size: 0.875rem;
    font-weight: 600;
    z-index: 1;
  }

  .card-header {
    text-align: center;
    margin-bottom: var(--spacing-lg);
    padding-top: var(--spacing-md);
  }

  .card-header h2 {
    font-size: 1.5rem;
    margin-bottom: var(--spacing-md);
    color: var(--text);
  }

  .price {
    font-size: 2rem;
    font-weight: 700;
    color: var(--accent);
    margin-bottom: var(--spacing-sm);
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: var(--spacing-xs);
  }

  .frequency {
    font-size: 1rem;
    font-weight: 500;
    color: var(--text-secondary);
  }

  .savings-badge {
    background: var(--success);
    color: white;
    font-size: 0.875rem;
    font-weight: 600;
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--radius-sm);
    margin-bottom: var(--spacing-sm);
    display: inline-block;
  }

  .description {
    color: var(--text-secondary);
    margin-bottom: var(--spacing-lg);
    line-height: 1.6;
  }

  .features {
    list-style: none;
    padding: 0;
    margin: 0 0 var(--spacing-xl) 0;
    flex-grow: 1;
  }

  .features li {
    display: flex;
    align-items: center;
    margin-bottom: var(--spacing-md);
    color: var(--text-secondary);
    line-height: 1.6;
  }

  .features li svg {
    margin-right: var(--spacing-sm);
    color: var(--success);
    flex-shrink: 0;
  }

  .cta-button {
    width: 100%;
    padding: var(--spacing-md) var(--spacing-lg);
    font-size: 1rem;
    font-weight: 600;
    border-radius: var(--radius-md);
    background: var(--accent);
    color: white;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-top: auto;
    text-decoration: none;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
    box-sizing: border-box;
  }

  .cta-button:hover:not(:disabled) {
    background: var(--accent-hover);
    transform: translateY(-2px);
    text-decoration: none;
  }

  .cta-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .cta-button.disabled {
    background: var(--background-secondary);
    color: var(--text-secondary);
    border: 1px solid var(--border);
    opacity: 0.8;
    cursor: not-allowed;
    transform: none;
  }

  .cta-button.disabled:hover {
    background: var(--background-secondary);
    transform: none;
  }

  .cta-button.loading {
    cursor: not-allowed;
  }

  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid transparent;
    border-top: 2px solid currentColor;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .faq-section {
    margin-top: var(--spacing-xxl);
    padding-top: var(--spacing-xl);
    border-top: 1px solid var(--border);
  }

  .faq-section h3 {
    text-align: center;
    font-size: 1.75rem;
    margin-bottom: var(--spacing-xl);
    color: var(--text);
  }

  .faq-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-xl);
  }

  .faq-item {
    background: var(--card-bg);
    padding: var(--spacing-lg);
    border-radius: var(--radius-lg);
    border: 1px solid var(--border);
  }

  .faq-item h4 {
    font-size: 1.125rem;
    margin-bottom: var(--spacing-md);
    color: var(--text);
  }

  .faq-item p {
    color: var(--text-secondary);
    line-height: 1.6;
    margin: 0;
  }

  @media (max-width: 768px) {
    .pricing {
      padding: var(--spacing-lg);
    }

    .header h1 {
      font-size: 2rem;
    }

    .subtitle {
      font-size: 1rem;
    }

    .plans-grid {
      grid-template-columns: 1fr;
    }

    .frequency-selector {
      width: 100%;
      overflow-x: auto;
      padding: var(--spacing-xs);
    }

    .frequency-selector button {
      white-space: nowrap;
    }

    .faq-grid {
      grid-template-columns: 1fr;
    }
  }

  .payment-provider-selector {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-md);
  }

  .payment-provider-selector label {
    font-weight: 600;
    color: var(--text);
    font-size: 0.875rem;
  }

  .provider-buttons {
    display: flex;
    gap: var(--spacing-sm);
    background: var(--background-secondary);
    padding: var(--spacing-xs);
    border-radius: var(--radius-lg);
    border: 1px solid var(--border);
  }

  .provider-buttons button {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-sm) var(--spacing-lg);
    border: none;
    background: none;
    color: var(--text-secondary);
    border-radius: var(--radius-md);
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.2s ease;
  }

  .provider-buttons button:hover {
    color: var(--text);
  }

  .provider-buttons button.active {
    background: var(--accent);
    color: white;
  }

  .provider-buttons button svg {
    width: 16px;
    height: 16px;
  }
</style> 