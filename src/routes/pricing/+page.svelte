<script lang="ts">
  import { fade } from 'svelte/transition';
  
  let selectedFrequency = 'monthly';

  const plans = [
    {
      name: "Free",
      price: "$0",
      annualPrice: "$0",
      description: "Unlimited executions.",
      features: [
        "Scoring accounts",
        "Comparisons",
        "20 profiles"
      ],
      cta: "Get Started",
      highlighted: false
    },
    {
      name: "Recruiters",
      price: "$99/mo",
      annualPrice: "$1,188/yr",
      description: "For advanced Recruiters",
      features: [
        "Advanced ML",
        "Store your results",
        "50 accounts per month"
      ],
      cta: "Get in touch",
      highlighted: true
    },
    {
      name: "Enterprise",
      price: "$299/mo",
      annualPrice: "$3,588/yr",
      description: "For advanced HR departments",
      features: [
        "Advanced ML",
        "Store your results",
        "Unlimited accounts",
        "Use our custom model"
      ],
      cta: "Get in touch",
      highlighted: false
    }
  ];
</script>

<div class="pricing" in:fade>
  <div class="header">
    <h1>Optimize your search</h1>
    <p class="subtitle">Choose the plan that best fits your needs</p>
  </div>

  <div class="pricing-options">
    <div class="frequency-selector">
      <button 
        class:active={selectedFrequency === 'monthly'} 
        on:click={() => selectedFrequency = 'monthly'}
      >
        Monthly
      </button>
      <button 
        class:active={selectedFrequency === 'annually'} 
        on:click={() => selectedFrequency = 'annually'}
      >
        Annually
      </button>
    </div>
  </div>

  <div class="plans-grid">
    {#each plans as plan}
      <div class="plan-card">
        <div class="card-header">
          <h2>{plan.name}</h2>
          <div class="price">{selectedFrequency === 'monthly' ? plan.price : plan.annualPrice}</div>
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

        {#if plan.cta === 'Get in touch'}
          <a href="mailto:contact@goring.dev" class="cta-button">
            {plan.cta}
          </a>
        {:else}
          <button class="cta-button">
            {plan.cta}
          </button>
        {/if}
      </div>
    {/each}
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
  }

  .frequency-selector button:hover {
    color: var(--text);
  }

  .frequency-selector button.active {
    background: var(--accent);
    color: white;
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
  }

  .plan-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
    border-color: var(--accent);
    background: linear-gradient(to bottom, var(--card-bg), var(--background-secondary));
  }

  .card-header {
    text-align: center;
    margin-bottom: var(--spacing-lg);
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
    display: block;
    text-align: center;
    box-sizing: border-box;
  }

  .cta-button:hover {
    background: var(--accent-hover);
    transform: translateY(-2px);
    text-decoration: none;
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
  }
</style> 