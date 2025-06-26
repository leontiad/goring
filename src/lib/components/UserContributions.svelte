<script lang="ts">
  import { onMount } from 'svelte';

  export let username: string;

  let contributions: any[] = [];
  let loading = false;
  let error: string | null = null;
  let expanded = false;

  async function fetchContributions() {
    if (!username) return;

    loading = true;
    error = null;

    try {
      // Fetch user events to see contributions
      const response = await fetch(`https://api.github.com/users/${username}/events?per_page=30`);
      
      if (response.ok) {
        const events = await response.json();
        
        // Filter and process events to get unique repositories
        const repoMap = new Map();
        
        events.forEach((event: any) => {
          if (event.repo && event.repo.name) {
            const repoName = event.repo.name;
            const repoUrl = event.repo.url;
            
            if (!repoMap.has(repoName)) {
              repoMap.set(repoName, {
                name: repoName,
                full_name: repoName,
                html_url: `https://github.com/${repoName}`,
                api_url: repoUrl,
                event_type: event.type,
                created_at: event.created_at,
                contributions: []
              });
            }
            
            const repo = repoMap.get(repoName);
            repo.contributions.push({
              type: event.type,
              created_at: event.created_at,
              payload: event.payload
            });
          }
        });
        
        // Convert to array and sort by most recent contribution
        contributions = Array.from(repoMap.values())
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 10);
        
        // Fetch additional repo details for each contribution
        for (let contribution of contributions) {
          try {
            const repoResponse = await fetch(contribution.api_url);
            if (repoResponse.ok) {
              const repoData = await repoResponse.json();
              contribution.description = repoData.description;
              contribution.language = repoData.language;
              contribution.stargazers_count = repoData.stargazers_count;
              contribution.forks_count = repoData.forks_count;
              contribution.watchers_count = repoData.watchers_count;
              contribution.open_issues_count = repoData.open_issues_count;
              contribution.license = repoData.license;
              contribution.updated_at = repoData.updated_at;
              contribution.fork = repoData.fork;
              contribution.private = repoData.private;
            }
          } catch (repoErr) {
            console.warn('Failed to fetch repo details for:', contribution.name);
          }
        }
        
      } else if (response.status === 403) {
        error = 'GitHub API rate limit exceeded. Please try again in a few minutes.';
      } else {
        const errorData = await response.json();
        error = errorData.message || 'Failed to fetch contributions';
      }
    } catch (err) {
      console.error('Error fetching contributions:', err);
      error = 'Failed to fetch contributions';
    } finally {
      loading = false;
    }
  }

  function toggleExpanded() {
    expanded = !expanded;
    if (expanded && contributions.length === 0) {
      fetchContributions();
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

  function getEventTypeLabel(type: string) {
    const labels: { [key: string]: string } = {
      'PushEvent': 'Push',
      'PullRequestEvent': 'Pull Request',
      'IssuesEvent': 'Issue',
      'CreateEvent': 'Create',
      'ForkEvent': 'Fork',
      'WatchEvent': 'Star',
      'CommitCommentEvent': 'Comment',
      'IssueCommentEvent': 'Issue Comment',
      'PullRequestReviewEvent': 'Review'
    };
    return labels[type] || type;
  }

  function getEventIcon(type: string) {
    const icons: { [key: string]: string } = {
      'PushEvent': '📝',
      'PullRequestEvent': '🔀',
      'IssuesEvent': '🐛',
      'CreateEvent': '✨',
      'ForkEvent': '🍴',
      'WatchEvent': '⭐',
      'CommitCommentEvent': '💬',
      'IssueCommentEvent': '💬',
      'PullRequestReviewEvent': '👀'
    };
    return icons[type] || '📋';
  }

  $: if (username && expanded && contributions.length === 0 && !loading) {
    fetchContributions();
  }
</script>

<div class="contributions-section">
  <div class="section-header" on:click={toggleExpanded} role="button" tabindex="0" on:keydown={(e) => e.key === 'Enter' && toggleExpanded()}>
    <h3>Recent Contributions</h3>
    <div class="expand-icon" class:expanded>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 11L3 6h10l-5 5z"/>
      </svg>
    </div>
  </div>

  {#if expanded}
    <div class="contributions-content">
      {#if loading}
        <div class="loading">Loading contributions...</div>
      {:else if error}
        <div class="error">{error}</div>
      {:else if contributions.length === 0}
        <div class="no-contributions">No recent contributions found</div>
      {:else}
        <div class="contributions-grid">
          {#each contributions as contribution}
            <div class="contribution-card">
              <div class="contribution-header">
                <h4 class="repo-name">
                  <a href={contribution.html_url} target="_blank" rel="noopener noreferrer">
                    {contribution.name}
                  </a>
                </h4>
                <div class="repo-badges">
                  {#if contribution.fork}
                    <span class="fork-badge">Fork</span>
                  {/if}
                  {#if contribution.private}
                    <span class="private-badge">Private</span>
                  {/if}
                </div>
              </div>
              
              {#if contribution.description}
                <p class="repo-description">{contribution.description}</p>
              {/if}
              
              <div class="contribution-activity">
                <div class="activity-header">Recent Activity:</div>
                <div class="activity-list">
                  {#each contribution.contributions.slice(0, 3) as activity}
                    <div class="activity-item">
                      <span class="activity-icon">{getEventIcon(activity.type)}</span>
                      <span class="activity-type">{getEventTypeLabel(activity.type)}</span>
                      <span class="activity-date">{formatDate(activity.created_at)}</span>
                    </div>
                  {/each}
                </div>
              </div>
              
              <div class="repo-stats">
                <div class="stat">
                  <span class="stat-icon">⭐</span>
                  <span class="stat-value">{formatNumber(contribution.stargazers_count || 0)}</span>
                </div>
                <div class="stat">
                  <span class="stat-icon">🔀</span>
                  <span class="stat-value">{formatNumber(contribution.forks_count || 0)}</span>
                </div>
                <div class="stat">
                  <span class="stat-icon">👀</span>
                  <span class="stat-value">{formatNumber(contribution.watchers_count || 0)}</span>
                </div>
                {#if contribution.language}
                  <div class="stat">
                    <span class="stat-icon">💻</span>
                    <span class="stat-value">{contribution.language}</span>
                  </div>
                {/if}
                {#if contribution.open_issues_count > 0}
                  <div class="stat">
                    <span class="stat-icon">🐛</span>
                    <span class="stat-value">{formatNumber(contribution.open_issues_count)}</span>
                  </div>
                {/if}
              </div>
              
              <div class="repo-footer">
                <span class="updated-date">Last activity: {formatDate(contribution.created_at)}</span>
                {#if contribution.license}
                  <span class="license">{contribution.license.name}</span>
                {/if}
              </div>
            </div>
          {/each}
        </div>
        
        <div class="view-more">
          <a href={`https://github.com/${username}`} target="_blank" rel="noopener noreferrer">
            View full activity on GitHub →
          </a>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .contributions-section {
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

  .contributions-content {
    padding: 1.5rem;
  }

  .loading, .error, .no-contributions {
    text-align: center;
    padding: 2rem;
    color: var(--text-secondary);
  }

  .error {
    color: #ef4444;
  }

  .contributions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 1rem;
  }

  .contribution-card {
    background: var(--background);
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    padding: 1rem;
    transition: all 0.2s ease;
  }

  .contribution-card:hover {
    border-color: var(--accent);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .contribution-header {
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

  .contribution-activity {
    margin: 1rem 0;
    padding: 0.75rem;
    background: var(--card-bg);
    border-radius: 0.375rem;
    border: 1px solid var(--border);
  }

  .activity-header {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text);
    margin-bottom: 0.5rem;
  }

  .activity-list {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .activity-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    color: var(--text-secondary);
  }

  .activity-icon {
    font-size: 0.875rem;
  }

  .activity-type {
    font-weight: 500;
    color: var(--text);
  }

  .activity-date {
    margin-left: auto;
    font-size: 0.7rem;
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
    .contributions-grid {
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

    .activity-item {
      flex-wrap: wrap;
    }

    .activity-date {
      margin-left: 0;
      width: 100%;
    }
  }
</style> 