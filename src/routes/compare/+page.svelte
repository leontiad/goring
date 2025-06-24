<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import type { GitHubScore } from '$lib/types';
  import ComparisonView from '$lib/components/ComparisonView.svelte';
  import Layout from '$lib/components/Layout.svelte';
  import UsernameAutocomplete from '$lib/components/UsernameAutocomplete.svelte';
  import { debounce } from '$lib/utils';

  let usernames = '';
  let loading = false;
  let error: string | null = null;
  let comparisonScores: GitHubScore[] = [];
  let suggestions: { login: string; avatar_url: string }[] = [];
  let showDropdown = false;
  let currentInput = '';

  async function searchUsers(query: string) {
    if (query.length < 2) {
      suggestions = [];
      return;
    }

    try {
      const response = await fetch(`https://api.github.com/search/users?q=${query}&per_page=5`);
      if (response.ok) {
        const data = await response.json();
        suggestions = data.items;
      }
    } catch (error) {
      console.error('Failed to fetch user suggestions:', error);
    }
  }

  const debouncedSearch = debounce(searchUsers, 300);

  function handleInput(event: Event) {
    const input = event.target as HTMLInputElement;
    currentInput = input.value;
    showDropdown = true;
    debouncedSearch(currentInput);
  }

  function handleSelect(selectedUsername: string) {
    if (usernames) {
      usernames += ', ' + selectedUsername;
    } else {
      usernames = selectedUsername;
    }
    showDropdown = false;
    currentInput = '';
  }

  async function compareUsers() {
    if (!usernames) return;
    
    loading = true;
    error = null;
    comparisonScores = [];
    
    try {
      const usernamesList = usernames.split(',').map(u => u.trim()).filter(Boolean);
      const scores = await Promise.all(
        usernamesList.map(async (username) => {
          const response = await fetch(`https://goring-hg3o.shuttle.app/api/score`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username })
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Failed to fetch score for ${username}`);
          }

          const data = await response.json();
          return {
            username: username,
            rating: data.rating,
            final_score: data.score.final_score * 100,
            contribution_score: data.score.component_scores.contribution_weight * 100,
            repository_significance: data.score.component_scores.repo_significance * 100,
            code_quality: data.score.component_scores.code_quality * 100,
            community_engagement: data.score.component_scores.community_engagement * 100
          };
        })
      );
      comparisonScores = scores;
    } catch (err) {
      error = err instanceof Error ? err.message : 'An unknown error occurred';
    } finally {
      loading = false;
    }
  }
</script>

<Layout>
  <div class="page">
    <section class="hero-section">
      <h1>Compare GitHub Profiles</h1>
      <p class="subtitle">Compare scores between different GitHub users</p>
    </section>

    <section class="search-section">
      <div class="search-container">
        <input
          type="text"
          placeholder="Enter GitHub usernames (comma-separated)"
          bind:value={usernames}
          on:input={handleInput}
          disabled={loading}
        />
        <button on:click={compareUsers} disabled={loading || !usernames}>
          {loading ? 'Loading...' : 'Compare'}
        </button>
      </div>
      <UsernameAutocomplete
        suggestions={suggestions}
        isLoading={loading}
        {showDropdown}
        onSelect={handleSelect}
      />
      {#if error}
        <div class="error-message">{error}</div>
      {/if}
    </section>

    {#if comparisonScores.length > 0}
      <ComparisonView scores={comparisonScores} />
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
    position: relative;
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
</style> 