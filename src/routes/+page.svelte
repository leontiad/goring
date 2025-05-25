<script lang="ts">
  import { onMount } from 'svelte';
  import type { GitHubScore } from '$lib/types';
  import ScoreBreakdown from '$lib/components/ScoreBreakdown.svelte';
  import ComparisonView from '$lib/components/ComparisonView.svelte';
  import Layout from '$lib/components/Layout.svelte';
  import UserStats from '$lib/components/UserStats.svelte';
  import { endpoints } from '$lib/config';
  import { page } from '$app/stores';

  let username = '';
  let usernames = '';
  let loading = false;
  let error: string | null = null;
  let score: GitHubScore | null = null;
  let comparisonScores: GitHubScore[] = [];
  let rating: string | null = null;
  let componentScores: any = null;
  let detailedComponents: any = null;
  
  interface GitHubRepo {
    name: string;
    full_name: string;
    stargazers_count: number;
    forks_count: number;
    updated_at: string;
    owner: { login: string };
    description: string | null;
  }

  interface GitHubEvent {
    type: string;
    created_at: string;
    repo: { name: string } | null;
    payload: { action: string | null } | null;
  }

  interface GitHubPullRequest {
    merged_at: string | null;
  }
  
  
  onMount(() => {
    console.log('Home page mounted');
    console.log('Session:', $page.data.session);
  });

  async function searchUser() {
    if (!username) return;
    
    loading = true;
    error = null;
    
    try {
        // Call our scoring API with just the username
        const scoreResponse = await fetch(endpoints.score, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username })
        });

        if (!scoreResponse.ok) {
            if (scoreResponse.status === 404) {
                throw new Error('User not found');
            }
            throw new Error('Failed to calculate score');
        }

        const scoreData = await scoreResponse.json();
        
        // Update the UI with the score data
        score = {
            username: username,
            rating: scoreData.rating,
            final_score: scoreData.score.final_score * 100,
            contribution_score: scoreData.score.component_scores.contribution_weight * 100,
            repository_significance: scoreData.score.component_scores.repo_significance * 100,
            code_quality: scoreData.score.component_scores.code_quality * 100,
            community_engagement: scoreData.score.component_scores.community_engagement * 100
        };
        
    } catch (e: unknown) {
        error = e instanceof Error ? e.message : 'An unknown error occurred';
        score = null;
    } finally {
        loading = false;
    }
  }
  
  async function compareUsers() {
    if (!usernames) return;
    
    loading = true;
    error = '';
    comparisonScores = [];
    
    try {
      const usernamesList = usernames.split(',').map(u => u.trim()).filter(Boolean);
      const scores = await Promise.all(
        usernamesList.map(async (username) => {
          const response = await fetch(`${endpoints.score}/${username}`);
          if (!response.ok) {
            throw new Error(`Failed to fetch score for ${username}`);
          }
          return response.json();
        })
      );
      comparisonScores = scores;
    } catch (e: unknown) {
      error = e instanceof Error ? e.message : 'An unknown error occurred';
    } finally {
      loading = false;
    }
  }
</script>

<Layout>
  <div class="page">
    <section class="hero-section">
      <h1>GitHub Score</h1>
      <p class="subtitle">Analyze and compare GitHub developer profiles</p>
    </section>

    <section class="search-section">
      <div class="search-container">
        <input
          type="text"
          bind:value={username}
          placeholder="Enter GitHub username"
          on:keydown={(e) => e.key === 'Enter' && searchUser()}
        />
        <button on:click={searchUser} disabled={loading}>
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>
    </div>

      {#if error}
        <div class="error-message">{error}</div>
      {/if}
  </section>

    {#if score}
      <section class="score-section">
        <div class="score-header">
          <h2>{score.username}</h2>
          <div class="rating">{score.rating}</div>
        </div>
        <div class="final-score">
          <div class="score-label">Final Score</div>
          <div class="score-value">{score.final_score.toFixed(2)}%</div>
        </div>
        <ScoreBreakdown {score} />
        <UserStats {score} />
      </section>
    {/if}
  </div>
</Layout>

<style>
  .page {
    padding: 1.5rem;
  }

  .hero-section {
    text-align: center;
    margin-bottom: 2rem;
  }

  h1 {
    font-size: 2.5rem;
    font-weight: 700;
    background: linear-gradient(135deg, #ffffff, #a0a0a0);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 0.75rem;
  }

  .subtitle {
    font-size: 1.125rem;
    color: #a0a0a0;
  }

  .search-section {
    max-width: 600px;
    margin: 0 auto 2rem;
  }

  .search-container {
    display: flex;
    gap: 0.75rem;
  }

  input {
    flex: 1;
    padding: 0.75rem;
    border-radius: 0.5rem;
    border: 1px solid var(--border);
    background: var(--background-secondary);
    color: var(--text);
    font-size: 0.875rem;
  }

  input:focus {
    outline: none;
    border-color: var(--accent);
    background: var(--background);
  }

  button {
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    border: none;
    background: var(--accent);
    color: white;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  button:hover {
    background: var(--accent-hover);
    transform: translateY(-2px);
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .error-message {
    margin-top: 0.75rem;
    padding: 0.75rem;
    border-radius: 0.5rem;
    background: rgba(255, 0, 0, 0.1);
    color: #ff4444;
    text-align: center;
    font-size: 0.875rem;
  }

  .score-section {
    background: var(--background);
    border-radius: 0.75rem;
    padding: 1.5rem;
    border: 1px solid var(--border);
    margin-bottom: 2rem;
  }

  .score-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.5rem;
  }

  .score-header h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text);
  }

  .rating {
    font-size: 1rem;
    color: var(--text-secondary);
    background: var(--background-secondary);
    padding: 0.375rem 0.75rem;
    border-radius: 0.375rem;
    border: 1px solid var(--border);
  }

  .final-score {
    text-align: center;
    margin-bottom: 1.5rem;
    background: var(--background-secondary);
    border-radius: 0.5rem;
    padding: 1rem;
    border: 1px solid var(--border);
  }

  .score-label {
    color: var(--text-secondary);
    font-size: 0.875rem;
    margin-bottom: 0.25rem;
  }

  .score-value {
    font-size: 3rem;
    font-weight: 700;
    color: var(--text);
  }
</style>