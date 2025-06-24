<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  
  let loading = true;
  let error: string | null = null;
  let stripe: any = null;
  let elements: any = null;
  let cardElement: any = null;

  onMount(() => {
    const paymentIntent = $page.url.searchParams.get('payment_intent');
    
    if (!paymentIntent) {
      error = 'No payment intent provided';
      loading = false;
      return;
    }

    loadStripeAndConfirm(paymentIntent);
  });

  async function loadStripeAndConfirm(paymentIntent: string) {
    try {
      // Load Stripe
      if (typeof window !== 'undefined' && (window as any).Stripe) {
        stripe = (window as any).Stripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
      } else {
        // Fallback: load Stripe script
        await new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://js.stripe.com/v3/';
          script.onload = () => {
            stripe = (window as any).Stripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
            resolve(true);
          };
          document.head.appendChild(script);
        });
      }

      // Create card element
      elements = stripe.elements();
      cardElement = elements.create('card', {
        style: {
          base: {
            fontSize: '16px',
            color: '#424770',
            '::placeholder': {
              color: '#aab7c4',
            },
          },
          invalid: {
            color: '#9e2146',
          },
        },
      });

      // Mount card element
      cardElement.mount('#card-element');

      // Handle form submission
      const form = document.getElementById('payment-form');
      if (form) {
        form.addEventListener('submit', async (event) => {
          event.preventDefault();
          await confirmPayment(paymentIntent);
        });
      }

      loading = false;
    } catch (err) {
      console.error('Error loading Stripe:', err);
      error = 'Failed to load payment form';
      loading = false;
    }
  }

  async function confirmPayment(paymentIntent: string) {
    loading = true;
    error = null;

    try {
      const { error: confirmError } = await stripe.confirmCardPayment(paymentIntent, {
        payment_method: {
          card: cardElement,
          billing_details: {
            // You can add billing details here
          },
        },
      });

      if (confirmError) {
        error = confirmError.message;
      } else {
        // Payment successful, redirect to success page
        goto('/subscription/success?payment_intent=' + paymentIntent);
      }
    } catch (err) {
      console.error('Payment error:', err);
      error = 'Payment failed. Please try again.';
    } finally {
      loading = false;
    }
  }
</script>

<div class="payment-confirmation">
  <div class="payment-card">
    {#if loading && !error}
      <div class="loading-state">
        <div class="spinner"></div>
        <h2>Loading payment form...</h2>
      </div>
    {:else if error}
      <div class="error-state">
        <div class="error-icon">⚠️</div>
        <h2>Payment Error</h2>
        <p>{error}</p>
        <button class="retry-button" on:click={() => goto('/pricing')}>
          Back to Pricing
        </button>
      </div>
    {:else}
      <div class="payment-form">
        <h1>Complete Your Payment</h1>
        <p class="subtitle">Enter your card details to complete your subscription</p>
        
        <form id="payment-form">
          <div class="form-group">
            <label for="card-element">Credit or debit card</label>
            <div id="card-element" class="card-element"></div>
            <div id="card-errors" class="error-message" role="alert"></div>
          </div>

          <button type="submit" class="submit-button" disabled={loading}>
            {#if loading}
              <span class="spinner"></span>
              Processing...
            {:else}
              Pay Now
            {/if}
          </button>
        </form>

        <div class="security-notice">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
          </svg>
          Your payment is secured by Stripe
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .payment-confirmation {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-lg);
    background: linear-gradient(135deg, var(--background), var(--background-secondary));
  }

  .payment-card {
    background: var(--card-bg);
    border-radius: var(--radius-xl);
    padding: var(--spacing-xxl);
    box-shadow: var(--shadow-lg);
    border: 1px solid var(--border);
    max-width: 500px;
    width: 100%;
  }

  .loading-state,
  .error-state,
  .payment-form {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-lg);
    text-align: center;
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

  .error-icon {
    font-size: 4rem;
    margin-bottom: var(--spacing-md);
  }

  h1 {
    font-size: 2rem;
    color: var(--text);
    margin: 0;
  }

  h2 {
    font-size: 1.5rem;
    color: var(--text);
    margin: 0;
  }

  .subtitle {
    color: var(--text-secondary);
    margin: 0;
  }

  .form-group {
    width: 100%;
    margin-bottom: var(--spacing-lg);
  }

  .form-group label {
    display: block;
    font-weight: 600;
    color: var(--text);
    margin-bottom: var(--spacing-sm);
  }

  .card-element {
    padding: var(--spacing-md);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: white;
    min-height: 40px;
  }

  .error-message {
    color: var(--error);
    font-size: 0.875rem;
    margin-top: var(--spacing-sm);
    min-height: 20px;
  }

  .submit-button {
    width: 100%;
    padding: var(--spacing-md) var(--spacing-lg);
    background: var(--accent);
    color: white;
    border: none;
    border-radius: var(--radius-md);
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
  }

  .submit-button:hover:not(:disabled) {
    background: var(--accent-hover);
  }

  .submit-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .security-notice {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    color: var(--text-secondary);
    font-size: 0.875rem;
    margin-top: var(--spacing-lg);
  }

  .security-notice svg {
    color: var(--success);
  }

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
  }

  .retry-button:hover {
    background: var(--accent-hover);
  }

  @media (max-width: 768px) {
    .payment-card {
      padding: var(--spacing-lg);
    }

    h1 {
      font-size: 1.75rem;
    }
  }
</style> 