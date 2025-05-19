<script lang="ts">
  import { onMount } from 'svelte';
  import type { GitHubScore } from '$lib/types';

  export let score: GitHubScore;

  interface Language {
    name: string;
    percentage: number;
  }

  let stats = {
    total_repositories: 0,
    total_stars: 0,
    total_forks: 0,
    total_contributions: 0
  };

  let activity = {
    commits_last_month: 0,
    pull_requests_last_month: 0,
    issues_last_month: 0,
    activity_trend: []
  };

  let languages: Language[] = [];

  onMount(async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: score.username })
      });

      if (response.ok) {
        const data = await response.json();
        stats = data.stats;
        activity = data.activity;
        languages = Object.entries(data.languages.languages).map(([name, percentage]) => ({
          name,
          percentage: percentage as number
        }));
      }
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
    }
  });
</script>

<div class="stats-container">
  <div class="stats-grid">
    <div class="stat-card">
      <h3>Total Repositories</h3>
      <div class="stat-value">{stats.total_repositories}</div>
    </div>
    <div class="stat-card">
      <h3>Total Stars</h3>
      <div class="stat-value">{stats.total_stars}</div>
    </div>
    <div class="stat-card">
      <h3>Total Forks</h3>
      <div class="stat-value">{stats.total_forks}</div>
    </div>
    <div class="stat-card">
      <h3>Total Contributions</h3>
      <div class="stat-value">{stats.total_contributions}</div>
    </div>
  </div>

  <div class="charts-grid">
    <div class="chart-card">
      <h3>Language Distribution</h3>
      <div class="languages">
        {#each languages as language}
          <div class="language">
            <div class="language-info">
              <span class="language-name">{language.name}</span>
              <span class="language-percentage">{language.percentage.toFixed(1)}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress" style="width: {language.percentage}%"></div>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <div class="chart-card">
      <h3>Activity Overview</h3>
      <div class="activity-stats">
        <div class="activity-stat">
          <span class="stat-label">Commits (Last Month)</span>
          <span class="stat-value">{activity.commits_last_month}</span>
        </div>
        <div class="activity-stat">
          <span class="stat-label">Pull Requests (Last Month)</span>
          <span class="stat-value">{activity.pull_requests_last_month}</span>
        </div>
        <div class="activity-stat">
          <span class="stat-label">Issues (Last Month)</span>
          <span class="stat-value">{activity.issues_last_month}</span>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .stats-container {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xl);
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: var(--spacing-lg);
  }

  .stat-card {
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: var(--spacing-lg);
    transition: all 0.2s ease;
  }

  .stat-card:hover {
    background: var(--card-hover);
    transform: translateY(-2px);
  }

  .stat-card h3 {
    color: var(--text-secondary);
    font-size: 0.875rem;
    font-weight: 500;
    margin-bottom: var(--spacing-sm);
  }

  .stat-value {
    font-size: 2rem;
    font-weight: 600;
    color: var(--text);
    margin-bottom: var(--spacing-sm);
  }

  .stat-trend {
    font-size: 0.875rem;
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
  }

  .stat-trend.positive {
    color: var(--success);
  }

  .stat-trend.negative {
    color: var(--error);
  }

  .charts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: var(--spacing-lg);
  }

  @media (max-width: 768px) {
    .charts-grid {
      grid-template-columns: 1fr;
    }
  }

  .chart-card {
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: var(--spacing-lg);
  }

  .chart-card h3 {
    color: var(--text);
    font-size: 1.125rem;
    font-weight: 600;
    margin-bottom: var(--spacing-lg);
  }

  .languages {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .language {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .language-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .language-name {
    color: var(--text);
    font-size: 0.875rem;
  }

  .language-percentage {
    color: var(--text-secondary);
    font-size: 0.875rem;
  }

  .progress-bar {
    height: 6px;
    background: var(--background-secondary);
    border-radius: var(--radius-sm);
    overflow: hidden;
  }

  .progress {
    height: 100%;
    background: var(--accent);
    border-radius: var(--radius-sm);
    transition: width 0.3s ease;
  }

  .chart-container {
    height: 300px;
    margin-bottom: var(--spacing-lg);
  }

  .chart-legend {
    display: flex;
    gap: var(--spacing-lg);
    justify-content: center;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .legend-color {
    width: 12px;
    height: 12px;
    border-radius: var(--radius-sm);
  }

  .legend-item span {
    color: var(--text-secondary);
    font-size: 0.875rem;
  }

  .activity-stats {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .activity-stat {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-sm) 0;
    border-bottom: 1px solid var(--border);
  }

  .activity-stat:last-child {
    border-bottom: none;
  }

  .stat-label {
    color: var(--text-secondary);
    font-size: 0.875rem;
  }

  .stat-value {
    font-weight: 600;
    color: var(--text);
  }
</style> 