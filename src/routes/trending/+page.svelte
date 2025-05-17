<script lang="ts">
  import { onMount } from 'svelte';
  import type { GitHubScore } from '$lib/types';
  import Layout from '$lib/components/Layout.svelte';
  
  let loading = false;
  let error = '';
  let trendingDevelopers: GitHubScore[] = [];
  let selectedTimeframe = 'week';
  
  const timeframes = [
    { value: 'day', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' }
  ];
  
  onMount(() => {
    loadTrendingDevelopers();
  });
  
  async function loadTrendingDevelopers() {
    loading = true;
    error = '';
    
    try {
      // TODO: Replace with actual API call
      // For now, using mock data
      trendingDevelopers = [
        {
          username: 'user1',
          rating: 'A+',
          final_score: 95,
          contribution_score: 90,
          repository_significance: 95,
          code_quality: 92,
          community_engagement: 88
        },
        {
          username: 'user2',
          rating: 'A',
          final_score: 88,
          contribution_score: 85,
          repository_significance: 90,
          code_quality: 88,
          community_engagement: 85
        },
        {
          username: 'user3',
          rating: 'A-',
          final_score: 82,
          contribution_score: 80,
          repository_significance: 85,
          code_quality: 82,
          community_engagement: 80
        }
      ];
    } catch (e: unknown) {
      error = e instanceof Error ? e.message : 'An unknown error occurred';
    } finally {
      loading = false;
    }
  }
</script>

<Layout>
  <div class="trending-page">
    <div class="hero-section">
      <h1>Trending Developers</h1>
      <p class="subtitle">Discover the most active and influential developers</p>
      
      <div class="timeframe-selector">
        {#each timeframes as timeframe}
          <button
            class:active={selectedTimeframe === timeframe.value}
            on:click={() => {
              selectedTimeframe = timeframe.value;
              loadTrendingDevelopers();
            }}
          >
            {timeframe.label}
          </button>
        {/each}
      </div>
    </div>

    {#if error}
      <div class="error">
        {error}
      </div>
    {/if}

    {#if loading}
      <div class="loading">
        Loading trending developers...
      </div>
    {:else if trendingDevelopers.length > 0}
      <div class="trending-grid">
        {#each trendingDevelopers as developer}
          <div class="developer-card">
            <div class="developer-header">
              <h3>{developer.username}</h3>
              <span class="rating">{developer.rating}</span>
            </div>
            
            <div class="score">
              <div class="score-value">{developer.final_score}%</div>
              <div class="score-label">Overall Score</div>
            </div>
            
            <div class="metrics">
              <div class="metric">
                <div class="metric-label">Contribution</div>
                <div class="progress-bar">
                  <div
                    class="progress"
                    style="width: {developer.contribution_score}%"
                  />
                </div>
                <div class="metric-value">{developer.contribution_score}%</div>
              </div>
              
              <div class="metric">
                <div class="metric-label">Repository</div>
                <div class="progress-bar">
                  <div
                    class="progress"
                    style="width: {developer.repository_significance}%"
                  />
                </div>
                <div class="metric-value">{developer.repository_significance}%</div>
              </div>
              
              <div class="metric">
                <div class="metric-label">Code Quality</div>
                <div class="progress-bar">
                  <div
                    class="progress"
                    style="width: {developer.code_quality}%"
                  />
                </div>
                <div class="metric-value">{developer.code_quality}%</div>
              </div>
              
              <div class="metric">
                <div class="metric-label">Community</div>
                <div class="progress-bar">
                  <div
                    class="progress"
                    style="width: {developer.community_engagement}%"
                  />
                </div>
                <div class="metric-value">{developer.community_engagement}%</div>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</Layout>

<style>
  .trending-page {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .hero-section {
    text-align: center;
    padding: 4rem 2rem;
    background: linear-gradient(135deg, #111111, #1a1a1a);
    border-radius: 1rem;
    margin-bottom: 2rem;
  }

  h1 {
    font-size: 3.5rem;
    font-weight: 800;
    margin-bottom: 1rem;
    background: linear-gradient(135deg, #ffffff, #a0a0a0);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .subtitle {
    font-size: 1.25rem;
    color: #a0a0a0;
    margin-bottom: 2rem;
  }

  .timeframe-selector {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-top: 2rem;
  }

  .timeframe-selector button {
    padding: 0.75rem 1.5rem;
    background: #1a1a1a;
    color: #a0a0a0;
    border: 1px solid #2a2a2a;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .timeframe-selector button:hover {
    background: #2a2a2a;
    color: #ffffff;
  }

  .timeframe-selector button.active {
    background: linear-gradient(135deg, #3a3a3a, #2a2a2a);
    color: #ffffff;
    border-color: #3a3a3a;
  }

  .error {
    background: #2a1a1a;
    color: #ff6b6b;
    padding: 1rem;
    border-radius: 0.5rem;
    border: 1px solid #3a2a2a;
  }

  .loading {
    text-align: center;
    color: #a0a0a0;
    padding: 2rem;
  }

  .trending-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
  }

  .developer-card {
    background: linear-gradient(135deg, #111111, #1a1a1a);
    border-radius: 1rem;
    padding: 1.5rem;
    border: 1px solid #2a2a2a;
  }

  .developer-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .developer-header h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #ffffff;
  }

  .rating {
    background: linear-gradient(135deg, #3a3a3a, #2a2a2a);
    color: #ffffff;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    font-weight: 600;
  }

  .score {
    text-align: center;
    margin-bottom: 1.5rem;
  }

  .score-value {
    font-size: 2.5rem;
    font-weight: 700;
    color: #ffffff;
    margin-bottom: 0.25rem;
  }

  .score-label {
    color: #a0a0a0;
    font-size: 0.875rem;
  }

  .metrics {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .metric {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .metric-label {
    width: 100px;
    color: #a0a0a0;
    font-size: 0.875rem;
  }

  .progress-bar {
    flex: 1;
    height: 6px;
    background: #2a2a2a;
    border-radius: 3px;
    overflow: hidden;
  }

  .progress {
    height: 100%;
    background: linear-gradient(90deg, #3a3a3a, #4a4a4a);
    border-radius: 3px;
    transition: width 0.3s ease;
  }

  .metric-value {
    width: 50px;
    text-align: right;
    color: #ffffff;
    font-size: 0.875rem;
    font-weight: 500;
  }
</style> 