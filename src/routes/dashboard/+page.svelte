<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import type { GitHubScore } from '$lib/types';
  import ScoreBreakdown from '$lib/components/ScoreBreakdown.svelte';
  import UserStats from '$lib/components/UserStats.svelte';
  import UserRepositories from '$lib/components/UserRepositories.svelte';
  import UserContributions from '$lib/components/UserContributions.svelte';
  import Layout from '$lib/components/Layout.svelte';
  import UsernameAutocomplete from '$lib/components/UsernameAutocomplete.svelte';
  import { debounce } from '$lib/utils';
  import type { PageData } from './$types';

  export let data: PageData;

  let username = '';
  let loading = false;
  let error: string | null = null;
  let score: GitHubScore | null = null;
  let suggestions: { login: string; avatar_url: string }[] = [];
  let showDropdown = false;
  let searchTimeout: NodeJS.Timeout;
  let profileInfo: any = null;
  let searchInput: HTMLInputElement;
  let remainingSearches = 2;
  let canSearch = true;

  onMount(() => {
    console.log('Dashboard page mounted');
    checkSearchLimit();
    if (browser && searchInput) {
      searchInput.focus();
    }
  });

  async function checkSearchLimit() {
    try {
      console.log('Checking search limit...');
      const response = await fetch('/api/search-limit');
      const data = await response.json();
      
      if (response.ok) {
        remainingSearches = data.remainingSearches;
        canSearch = data.canSearch;
        console.log('Search limit check result:', { remainingSearches, canSearch });
      } else {
        // If database functions don't exist yet, assume user can search
        remainingSearches = 2;
        canSearch = true;
        console.log('Search limit check failed, using defaults:', { remainingSearches, canSearch });
      }
    } catch (err) {
      console.error('Error checking search limit:', err);
      // If there's an error, assume user can search
      remainingSearches = 2;
      canSearch = true;
    }
  }

  async function updateHeaderSearchCount() {
    // Dispatch a custom event to update the header count
    window.dispatchEvent(new CustomEvent('updateSearchCount', { 
      detail: { remainingSearches } 
    }));
  }

  async function searchUsers(query: string) {
    if (query.length < 2) {
      suggestions = [];
      showDropdown = false;
      return;
    }

    try {
      loading = true;
      const response = await fetch(`https://api.github.com/search/users?q=${query}&per_page=5`);
      if (response.ok) {
        const data = await response.json();
        suggestions = data.items;
        showDropdown = true;
        // Ensure input stays focused after updating suggestions
        requestAnimationFrame(() => {
          if (searchInput) {
            searchInput.focus();
          }
        });
      } else if (response.status === 403) {
        error = 'GitHub API rate limit exceeded. Please try again in a few minutes.';
        suggestions = [];
        showDropdown = false;
      } else {
        const errorData = await response.json();
        error = errorData.message || 'Failed to fetch suggestions';
        suggestions = [];
        showDropdown = false;
      }
    } catch (error) {
      console.error('Failed to fetch user suggestions:', error);
      suggestions = [];
      showDropdown = false;
    } finally {
      loading = false;
    }
  }

  function handleInput(event: Event) {
    const input = event.target as HTMLInputElement;
    username = input.value;
    error = null;
    
    if (username.length >= 2) {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
      searchTimeout = setTimeout(() => {
        searchUsers(username);
        // Ensure input stays focused after showing suggestions
        requestAnimationFrame(() => {
          input.focus();
        });
      }, 300);
    } else {
      suggestions = [];
      showDropdown = false;
    }
  }

  async function handleSelect(selectedUsername: string) {
    username = selectedUsername;
    showDropdown = false;
    // Ensure input stays focused after selection
    requestAnimationFrame(() => {
      if (searchInput) {
        searchInput.focus();
      }
    });
    
    // Check if user can search before submitting
    await checkSearchLimit();
    if (canSearch) {
      handleSubmit();
    } else {
      error = 'You have reached your daily search limit. Please try again tomorrow.';
    }
  }

  onDestroy(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
  });

  async function handleSubmit() {
    if (!username) return;

    // Always check search limit before making any API calls
    await checkSearchLimit();
    
    console.log('Search attempt - canSearch:', canSearch, 'remainingSearches:', remainingSearches);
    
    if (!canSearch) {
      error = 'You have reached your daily search limit. Please try again tomorrow.';
      console.log('Search blocked - limit reached');
      return;
    }

    loading = true;
    error = null;
    showDropdown = false;

    try {
      console.log('Fetching score for username:', username);
      
      // Test the score API directly first
      const response = await fetch(`https://goring-hg3o.shuttle.app/api/score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username })
      });

      console.log('Score API response status:', response.status);
      console.log('Score API response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('Score API response data:', data);
        
        score = {
          username: username,
          rating: data.rating,
          final_score: data.score.final_score * 100,
          contribution_score: data.score.component_scores.contribution_weight * 100,
          repository_significance: data.score.component_scores.repo_significance * 100,
          code_quality: data.score.component_scores.code_quality * 100,
          community_engagement: data.score.component_scores.community_engagement * 100
        };

        // Now record the search after successful score fetch
        try {
          console.log('Recording search attempt for username:', username);
          const searchResponse = await fetch('/api/search-limit', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username })
          });

          console.log('Search limit API response status:', searchResponse.status);
          console.log('Search limit API response ok:', searchResponse.ok);

          if (searchResponse.ok) {
            const searchData = await searchResponse.json();
            console.log('Search limit API response data:', searchData);
            remainingSearches = searchData.remainingSearches;
            canSearch = searchData.canSearch;

            // Update header search count
            await updateHeaderSearchCount();
          } else if (searchResponse.status === 429) {
            error = 'You have reached your daily search limit. Please try again tomorrow.';
            await checkSearchLimit(); // Refresh the limit display
            return;
          } else {
            // If database functions don't exist, continue with search anyway
            console.log('Search tracking not available, continuing with search...');
          }
        } catch (searchErr) {
          // If search tracking fails, continue with the actual search
          console.log('Search tracking failed, continuing with search...', searchErr);
        }

        try {
          const profileResponse = await fetch(`https://api.github.com/users/${username}`);
          if (profileResponse.ok) {
            profileInfo = await profileResponse.json();
          } else if (profileResponse.status === 403) {
            console.warn('GitHub API rate limit exceeded');
            profileInfo = null;
          } else {
            console.warn('Failed to fetch GitHub profile');
            profileInfo = null;
          }
        } catch (profileError) {
          console.error('Error fetching GitHub profile:', profileError);
          profileInfo = null;
        }
      } else {
        console.error('Score API error status:', response.status);
        let errorData;
        try {
          errorData = await response.json();
          console.error('Score API error data:', errorData);
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          errorData = { error: 'Failed to parse error response' };
        }
        
        error = errorData.error || errorData.message || `Failed to fetch score (Status: ${response.status})`;
        score = null;
        profileInfo = null;
      }
    } catch (err) {
      console.error('Exception during score fetching:', err);
      error = err instanceof Error ? err.message : 'An error occurred while fetching the score';
      score = null;
      profileInfo = null;
    } finally {
      loading = false;
    }
  }
</script>

<Layout>
  <div class="dashboard">
    <div class="search-section">
      <h1>GitHub Score Dashboard</h1>
      <div class="search-container">
        <input
          type="text"
          placeholder="Enter GitHub username"
          bind:value={username}
          bind:this={searchInput}
          on:input={handleInput}
          disabled={loading || !canSearch}
        />
        <button on:click={handleSubmit} disabled={loading || !username || !canSearch}>
          {loading ? 'Loading...' : 'Get Score'}
        </button>
      </div>
      <div class="search-info">
        <span class="remaining-searches">
          {remainingSearches} search{remainingSearches !== 1 ? 'es' : ''} remaining today
        </span>
      </div>
      <div class="autocomplete-wrapper">
        <UsernameAutocomplete
          suggestions={suggestions}
          isLoading={loading}
          {showDropdown}
          onSelect={handleSelect}
        />
      </div>
      {#if error}
        <div class="error-message">{error}</div>
      {/if}
      {#if !canSearch && remainingSearches === 0}
        <div class="limit-warning">
          <strong>Search Limit Reached!</strong> You've used all your daily searches. Try again tomorrow or upgrade to a paid plan for unlimited searches.
        </div>
      {/if}
    </div>

    {#if score}
      <div class="results-section">
        <div class="score-header">
          <h2>{score.username}</h2>
          <div class="rating">{score.rating}</div>
        </div>

        {#if profileInfo}
          <div class="profile-info">
            {#if profileInfo.name}
              <div class="name">{profileInfo.name}</div>
            {/if}
            {#if profileInfo.bio}
              <div class="bio">{profileInfo.bio}</div>
            {/if}
            <div class="info-grid">
              {#if profileInfo.company}
                <div class="info-item">
                  <span class="label">Company</span>
                  <span class="value">{profileInfo.company}</span>
                </div>
              {/if}
              {#if profileInfo.location}
                <div class="info-item">
                  <span class="label">Location</span>
                  <span class="value">{profileInfo.location}</span>
                </div>
              {/if}
              {#if profileInfo.blog}
                <div class="info-item">
                  <span class="label">Website</span>
                  <a href={profileInfo.blog} target="_blank" rel="noopener noreferrer" class="value link">
                    {profileInfo.blog}
                  </a>
                </div>
              {/if}
              {#if profileInfo.email}
                <div class="info-item">
                  <span class="label">Email</span>
                  <a href="mailto:{profileInfo.email}" class="value link">
                    {profileInfo.email}
                  </a>
                </div>
              {/if}
              {#if profileInfo.twitter_username}
                <div class="info-item">
                  <span class="label">Twitter</span>
                  <a 
                    href="https://twitter.com/{profileInfo.twitter_username}" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    class="value link"
                  >
                    @{profileInfo.twitter_username}
                  </a>
                </div>
              {/if}
              {#if profileInfo.hireable}
                <div class="info-item">
                  <span class="label">Status</span>
                  <span class="value available">Available for hire</span>
                </div>
              {/if}
            </div>
          </div>
        {/if}

        <div class="final-score">
          <div class="score-label">Final Score</div>
          <div class="score-value">{score.final_score.toFixed(2)}%</div>
        </div>
        <ScoreBreakdown {score} />
        <UserStats {score} />
        <UserRepositories username={score.username} />
        <UserContributions username={score.username} />
      </div>
    {/if}
  </div>
</Layout>

<style>
  .dashboard {
    min-height: 100vh;
    padding: 2rem;
    background: var(--background);
  }

  .search-section {
    max-width: 600px;
    margin: 0 auto 4rem;
    text-align: center;
  }

  h1 {
    font-size: 2.5rem;
    margin-bottom: 2rem;
    background: linear-gradient(135deg, #ffffff, #a0a0a0);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .search-container {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
    position: relative;
    max-width: 500px;
    margin: 0 auto 1rem;
  }

  .search-info {
    text-align: center;
    margin-bottom: 1rem;
  }

  .remaining-searches {
    font-size: 0.875rem;
    color: var(--text-secondary);
    background: var(--card-bg);
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    border: 1px solid var(--border);
  }

  .autocomplete-wrapper {
    position: relative;
    width: 100%;
    max-width: 500px;
    margin: 0 auto;
  }

  input {
    flex: 1;
    padding: 1rem;
    border-radius: 0.5rem;
    border: 1px solid var(--border);
    background: var(--background);
    color: var(--text);
    font-size: 1rem;
  }

  button {
    padding: 1rem 2rem;
    border-radius: 0.5rem;
    border: none;
    background: var(--accent);
    color: white;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  button:hover {
    background: var(--accent-hover);
    transform: translateY(-2px);
  }

  button:disabled {
    background: var(--border);
    cursor: not-allowed;
    transform: none;
  }

  .error-message {
    color: #ef4444;
    margin-top: 1rem;
  }

  .results-section {
    max-width: 1000px;
    margin: 0 auto;
    background: var(--card-bg);
    border-radius: 1rem;
    padding: 2rem;
    box-shadow: var(--shadow-lg);
  }

  .score-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }

  .rating {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--accent);
  }

  .profile-info {
    margin-bottom: 2rem;
    padding-bottom: 2rem;
    border-bottom: 1px solid var(--border);
  }

  .name {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }

  .bio {
    color: var(--text-secondary);
    margin-bottom: 1.5rem;
  }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .info-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .label {
    font-size: 0.875rem;
    color: var(--text-secondary);
  }

  .value {
    font-weight: 500;
  }

  .value.link {
    color: var(--accent);
    text-decoration: none;
  }

  .value.link:hover {
    text-decoration: underline;
  }

  .value.available {
    color: #10b981;
  }

  .final-score {
    text-align: center;
    margin-bottom: 2rem;
  }

  .score-label {
    font-size: 1.25rem;
    color: var(--text-secondary);
    margin-bottom: 0.5rem;
  }

  .score-value {
    font-size: 3rem;
    font-weight: 700;
    color: var(--accent);
  }

  .limit-warning {
    color: #ef4444;
    margin-top: 1rem;
    padding: 1rem;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 0.5rem;
    text-align: center;
  }

  @media (max-width: 768px) {
    .dashboard {
      padding: 1rem;
    }

    h1 {
      font-size: 2rem;
    }

    .search-container {
      flex-direction: column;
    }

    button {
      width: 100%;
    }

    .results-section {
      padding: 1rem;
    }

    .info-grid {
      grid-template-columns: 1fr;
    }
  }
</style> 