<script lang="ts">
  import { onMount } from 'svelte';
  import Layout from '$lib/components/Layout.svelte';
  import ComparisonView from '$lib/components/ComparisonView.svelte';
  import type { GitHubScore } from '$lib/types';

  let username1 = '';
  let username2 = '';
  let loading = false;
  let error: string | null = null;
  let user1: GitHubScore | null = null;
  let user2: GitHubScore | null = null;

  async function compareUsers() {
    if (!username1.trim() || !username2.trim()) {
      error = 'Please enter both GitHub usernames';
      return;
    }

    loading = true;
    error = null;

    try {
      // TODO: Replace with actual API calls
      const mockScore1: GitHubScore = {
        username: username1,
        rating: 'A+',
        final_score: 85,
        contribution_score: 90,
        repository_significance: 80,
        code_quality: 85,
        community_engagement: 75
      };

      const mockScore2: GitHubScore = {
        username: username2,
        rating: 'A',
        final_score: 80,
        contribution_score: 85,
        repository_significance: 75,
        code_quality: 80,
        community_engagement: 80
      };

      user1 = mockScore1;
      user2 = mockScore2;
    } catch (e) {
      error = 'Failed to fetch user data';
      console.error(e);
    } finally {
      loading = false;
    }
  }
</script>

<Layout>
  <div class="page">
    <section class="hero-section">
      <h1>Compare Developers</h1>
      <p class="subtitle">Compare GitHub profiles side by side</p>
    </section>

    <section class="search-section">
      <div class="search-container">
        <div class="input-group">
          <input
            type="text"
            bind:value={username1}
            placeholder="First GitHub username"
            on:keydown={(e) => e.key === 'Enter' && compareUsers()}
          />
          <div class="vs">VS</div>
          <input
            type="text"
            bind:value={username2}
            placeholder="Second GitHub username"
            on:keydown={(e) => e.key === 'Enter' && compareUsers()}
          />
        </div>
        <button on:click={compareUsers} disabled={loading}>
          {loading ? 'Comparing...' : 'Compare'}
        </button>
      </div>

      {#if error}
        <div class="error-message">{error}</div>
      {/if}
    </section>

    {#if user1 && user2}
      <ComparisonView {user1} {user2} />
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
    max-width: 800px;
    margin: 0 auto 3rem;
  }

  .search-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .input-group {
    display: flex;
    align-items: center;
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

  .vs {
    font-size: 1.5rem;
    font-weight: 700;
    color: #4a4a4a;
    padding: 0 1rem;
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
</style> 