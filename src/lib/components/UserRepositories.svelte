<script lang="ts">
  import { onMount } from 'svelte';

  export let username: string;

  let repositories: any[] = [];
  let loading = false;
  let error: string | null = null;
  let expanded = false;
  let activeTab = 'owned'; // 'owned' or 'contributed'

  async function fetchRepositories() {
    if (!username) return;

    loading = true;
    error = null;

    try {
      let apiUrl: string;
      
      if (activeTab === 'owned') {
        // Fetch repositories owned by the user
        apiUrl = `https://api.github.com/users/${username}/repos?sort=updated&per_page=10`;
      } else {
        // Fetch repositories the user has contributed to (using search API)
        apiUrl = `https://api.github.com/search/repositories?q=user:${username}&sort=updated&per_page=10`;
      }

      const response = await fetch(apiUrl);
      
      if (response.ok) {
        const data = await response.json();
        // Handle both direct API response and search API response
        repositories = data.items || data || [];
      } else if (response.status === 403) {
        error = 'GitHub API rate limit exceeded. Please try again in a few minutes.';
      } else {
        const errorData = await response.json();
        error = errorData.message || 'Failed to fetch repositories';
      }
    } catch (err) {
      console.error('Error fetching repositories:', err);
      error = 'Failed to fetch repositories';
    } finally {
      loading = false;
    }
  }

  function toggleExpanded() {
    expanded = !expanded;
    if (expanded && repositories.length === 0) {
      fetchRepositories();
    }
  }

  function switchTab(tab: string) {
    activeTab = tab;
    repositories = []; // Clear current repositories
    if (expanded) {
      fetchRepositories();
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString();
  }

  function formatNumber(num: number) {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  }

  $: if (username && expanded && repositories.length === 0 && !loading) {
    fetchRepositories();
  }
</script>

<div class="repositories-section">
  <div class="section-header" on:click={toggleExpanded} role="button" tabindex="0" on:keydown={(e) => e.key === 'Enter' && toggleExpanded()}>
    <h3>Repositories</h3>
    <div class="expand-icon" class:expanded>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 11L3 6h10l-5 5z"/>
      </svg>
    </div>
  </div>

  {#if expanded}
    <div class="repositories-content">
      <div class="tab-navigation">
        <button 
          class="tab-button" 
          class:active={activeTab === 'owned'}
          on:click={() => switchTab('owned')}
        >
          Owned
        </button>
        <button 
          class="tab-button" 
          class:active={activeTab === 'contributed'}
          on:click={() => switchTab('contributed')}
        >
          Contributed
        </button>
      </div>

      {#if loading}
        <div class="loading">Loading repositories...</div>
      {:else if error}
        <div class="error">{error}</div>
      {:else if repositories.length === 0}
        <div class="no-repos">No repositories found</div>
      {:else}
        <div class="repositories-grid">
          {#each repositories as repo}
            <div class="repo-card">
              <div class="repo-header">
                <h4 class="repo-name">
                  <a href={repo.html_url} target="_blank" rel="noopener noreferrer">
                    {repo.name}
                  </a>
                </h4>
                <div class="repo-badges">
                  {#if repo.fork}
                    <span class="fork-badge">Fork</span>
                  {/if}
                  {#if repo.private}
                    <span class="private-badge">Private</span>
                  {/if}
                </div>
              </div>
              
              {#if repo.description}
                <p class="repo-description">{repo.description}</p>
              {/if}
              
              <div class="repo-stats">
                <div class="stat">
                  <span class="stat-icon">⭐</span>
                  <span class="stat-value">{formatNumber(repo.stargazers_count)}</span>
                </div>
                <div class="stat">
                  <span class="stat-icon">🔀</span>
                  <span class="stat-value">{formatNumber(repo.forks_count)}</span>
                </div>
                <div class="stat">
                  <span class="stat-icon">👀</span>
                  <span class="stat-value">{formatNumber(repo.watchers_count)}</span>
                </div>
                {#if repo.language}
                  <div class="stat">
                    <span class="stat-icon">💻</span>
                    <span class="stat-value">{repo.language}</span>
                  </div>
                {/if}
                {#if repo.open_issues_count > 0}
                  <div class="stat">
                    <span class="stat-icon">🐛</span>
                    <span class="stat-value">{formatNumber(repo.open_issues_count)}</span>
                  </div>
                {/if}
              </div>
              
              <div class="repo-footer">
                <span class="updated-date">Updated {formatDate(repo.updated_at)}</span>
                {#if repo.license}
                  <span class="license">{repo.license.name}</span>
                {/if}
              </div>
            </div>
          {/each}
        </div>
        
        {#if repositories.length === 10}
          <div class="view-more">
            <a href={`https://github.com/${username}?tab=repositories`} target="_blank" rel="noopener noreferrer">
              View all repositories on GitHub →
            </a>
          </div>
        {/if}
      {/if}
    </div>
  {/if}
</div>

<style>
  .repositories-section {
    margin-top: 2rem;
    background: var(--card-bg);
    border-radius: 0.75rem;
    border: 1px solid var(--border);
    overflow: hidden;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    cursor: pointer;
    transition: background-color 0.2s ease;
    border-bottom: 1px solid var(--border);
  }

  .section-header:hover {
    background: var(--background);
  }

  .section-header h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text);
  }

  .expand-icon {
    transition: transform 0.2s ease;
    color: var(--text-secondary);
  }

  .expand-icon.expanded {
    transform: rotate(180deg);
  }

  .repositories-content {
    padding: 1.5rem;
  }

  .tab-navigation {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
    border-bottom: 1px solid var(--border);
  }

  .tab-button {
    background: none;
    border: none;
    padding: 0.75rem 1.5rem;
    color: var(--text-secondary);
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: all 0.2s ease;
    font-weight: 500;
  }

  .tab-button:hover {
    color: var(--text);
  }

  .tab-button.active {
    color: var(--accent);
    border-bottom-color: var(--accent);
  }

  .loading, .error, .no-repos {
    text-align: center;
    padding: 2rem;
    color: var(--text-secondary);
  }

  .error {
    color: #ef4444;
  }

  .repositories-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1rem;
  }

  .repo-card {
    background: var(--background);
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    padding: 1rem;
    transition: all 0.2s ease;
  }

  .repo-card:hover {
    border-color: var(--accent);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .repo-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.5rem;
  }

  .repo-name {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    flex: 1;
  }

  .repo-name a {
    color: var(--accent);
    text-decoration: none;
  }

  .repo-name a:hover {
    text-decoration: underline;
  }

  .repo-badges {
    display: flex;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  .fork-badge, .private-badge {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-weight: 500;
  }

  .fork-badge {
    background: var(--border);
    color: var(--text-secondary);
  }

  .private-badge {
    background: #fbbf24;
    color: #92400e;
  }

  .repo-description {
    color: var(--text-secondary);
    font-size: 0.875rem;
    margin: 0.5rem 0;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .repo-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin: 1rem 0;
  }

  .stat {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.875rem;
    color: var(--text-secondary);
  }

  .stat-icon {
    font-size: 1rem;
  }

  .stat-value {
    font-weight: 500;
  }

  .repo-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.75rem;
    color: var(--text-secondary);
    margin-top: 1rem;
    padding-top: 0.75rem;
    border-top: 1px solid var(--border);
  }

  .license {
    background: var(--border);
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
  }

  .view-more {
    text-align: center;
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--border);
  }

  .view-more a {
    color: var(--accent);
    text-decoration: none;
    font-weight: 500;
  }

  .view-more a:hover {
    text-decoration: underline;
  }

  @media (max-width: 768px) {
    .repositories-grid {
      grid-template-columns: 1fr;
    }

    .repo-stats {
      gap: 0.75rem;
    }

    .repo-footer {
      flex-direction: column;
      gap: 0.5rem;
      align-items: flex-start;
    }

    .tab-navigation {
      flex-direction: column;
      gap: 0;
    }

    .tab-button {
      border-bottom: 1px solid var(--border);
      border-radius: 0;
    }

    .tab-button.active {
      border-bottom-color: var(--accent);
    }
  }
</style> 