<script lang="ts">
  import { onMount } from 'svelte';
  import type { GitHubScore } from '$lib/types';
  import ScoreBreakdown from '$lib/components/ScoreBreakdown.svelte';
  import ComparisonView from '$lib/components/ComparisonView.svelte';
  import Layout from '$lib/components/Layout.svelte';
  import UserStats from '$lib/components/UserStats.svelte';
  
  let username = '';
  let usernames = '';
  let loading = false;
  let error: string | null = null;
  let score: GitHubScore | null = null;
  let comparisonScores: GitHubScore[] = [];
  
  async function searchUser() {
    if (!username.trim()) {
      error = 'Please enter a GitHub username';
      return;
    }

    loading = true;
    error = '';
    score = null;

    try {
      const res = await fetch(`http://0.0.0.0:8001/api/score/${username}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.detail || 'Failed to fetch user data');
      }
      const data = await res.json();
      score = data;
    } catch (e) {
      console.error('Error fetching user data:', e);
      error = e instanceof Error ? e.message : 'Failed to fetch user data';
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
          const response = await fetch(`/api/score/${username}`);
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
          <div class="score-value">{score.final_score}%</div>
        </div>
        <ScoreBreakdown {score} />
        <UserStats {score} />
      </section>
    {/if}
  </div>
</Layout>

<style>
  .page {
    padding: 2rem;
  }

  .hero-section {
    text-align: center;
    margin-bottom: 3rem;
  }

  h1 {
    font-size: 3rem;
    font-weight: 700;
    background: linear-gradient(135deg, #ffffff, #a0a0a0);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 1rem;
  }

  .subtitle {
    font-size: 1.25rem;
    color: #a0a0a0;
  }

  .search-section {
    max-width: 600px;
    margin: 0 auto 3rem;
  }

  .search-container {
    display: flex;
    gap: 1rem;
  }

  input {
    flex: 1;
    padding: 1rem;
    border-radius: 0.5rem;
    border: 1px solid #2a2a2a;
    background: #1a1a1a;
    color: #ffffff;
    font-size: 1rem;
  }

  input:focus {
    outline: none;
    border-color: #3a3a3a;
    background: #222222;
  }

  button {
    padding: 1rem 2rem;
    border-radius: 0.5rem;
    border: none;
    background: linear-gradient(135deg, #3a3a3a, #4a4a4a);
    color: #ffffff;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.2s;
  }

  button:hover {
    opacity: 0.9;
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .error-message {
    margin-top: 1rem;
    padding: 1rem;
    border-radius: 0.5rem;
    background: rgba(255, 0, 0, 0.1);
    color: #ff4444;
    text-align: center;
  }

  .score-section {
    background: linear-gradient(135deg, #111111, #1a1a1a);
    border-radius: 1rem;
    padding: 2rem;
    border: 1px solid #2a2a2a;
    margin-bottom: 3rem;
  }

  .score-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 2rem;
  }

  .score-header h2 {
    font-size: 2rem;
    font-weight: 600;
    color: #ffffff;
  }

  .rating {
    font-size: 1.25rem;
    color: #a0a0a0;
  }

  .final-score {
    text-align: center;
    margin-bottom: 2rem;
  }

  .score-label {
    color: #a0a0a0;
    font-size: 1rem;
    margin-bottom: 0.5rem;
  }

  .score-value {
    font-size: 4rem;
    font-weight: 700;
    color: #ffffff;
  }
</style>