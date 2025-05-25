<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import type { GitHubScore } from '$lib/types';
  import ScoreBreakdown from '$lib/components/ScoreBreakdown.svelte';
  import ComparisonView from '$lib/components/ComparisonView.svelte';
  import Layout from '$lib/components/Layout.svelte';
  import UserStats from '$lib/components/UserStats.svelte';
  import { endpoints } from '$lib/config';
  import { page } from '$app/stores';
  import UsernameAutocomplete from '$lib/components/UsernameAutocomplete.svelte';
  import { debounce } from '$lib/utils';

  let username = '';
  let usernames = '';
  let loading = false;
  let error: string | null = null;
  let score: GitHubScore | null = null;
  let comparisonScores: GitHubScore[] = [];
  let rating: string | null = null;
  let componentScores: any = null;
  let detailedComponents: any = null;
  let suggestions: { login: string; avatar_url: string }[] = [];
  let showDropdown = false;
  let searchTimeout: NodeJS.Timeout;
  
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

  interface GitHubProfile {
    company: string | null;
    blog: string | null;
    location: string | null;
    email: string | null;
    hireable: boolean | null;
    bio: string | null;
    twitter_username: string | null;
    name: string | null;
  }

  let profileInfo: GitHubProfile | null = null;
  
  onMount(() => {
    console.log('Home page mounted');
    console.log('Session:', $page.data.session);
  });

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
    username = input.value;
    showDropdown = true;
    debouncedSearch(username);
  }

  function handleSelect(selectedUsername: string) {
    username = selectedUsername;
    showDropdown = false;
    handleSubmit();
  }

  async function handleSubmit() {
    if (!username) return;

    loading = true;
    error = null;
    showDropdown = false;

    try {
      const response = await fetch(`https://goring-hg3o.shuttle.app/api/score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username })
      });

      if (response.ok) {
        const data = await response.json();
        score = {
          username: username,
          rating: data.rating,
          final_score: data.score.final_score * 100,
          contribution_score: data.score.component_scores.contribution_weight * 100,
          repository_significance: data.score.component_scores.repo_significance * 100,
          code_quality: data.score.component_scores.code_quality * 100,
          community_engagement: data.score.component_scores.community_engagement * 100
        };

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
        const errorData = await response.json();
        error = errorData.error || 'Failed to fetch score';
        score = null;
        profileInfo = null;
      }
    } catch (err) {
      error = 'An error occurred while fetching the score';
      score = null;
      profileInfo = null;
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
          placeholder="Enter GitHub username"
          bind:value={username}
          on:input={handleInput}
          disabled={loading}
        />
        <button on:click={handleSubmit} disabled={loading || !username}>
          {loading ? 'Loading...' : 'Get Score'}
        </button>
      </div>
      <UsernameAutocomplete
        {username}
        suggestions={suggestions}
        isLoading={loading}
        {showDropdown}
        onSelect={handleSelect}
      />
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

  .profile-info {
    background: var(--background-secondary);
    border-radius: 0.5rem;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    border: 1px solid var(--border);
  }

  .name {
    color: var(--text);
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 1rem;
  }

  .bio {
    color: var(--text);
    font-size: 1rem;
    line-height: 1.5;
    margin-bottom: 1.5rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid var(--border);
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
    color: var(--text-secondary);
    font-size: 0.875rem;
  }

  .value {
    color: var(--text);
    font-size: 1rem;
  }

  .link {
    color: var(--accent);
    text-decoration: none;
    transition: color 0.2s ease;
  }

  .link:hover {
    color: var(--accent-hover);
    text-decoration: underline;
  }

  .available {
    color: var(--success);
    font-weight: 500;
  }
</style>