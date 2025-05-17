<script lang="ts">
  import { onMount } from 'svelte';
  import type { GitHubScore } from '$lib/types';

  export let score: GitHubScore;

  let chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Commits',
        data: [65, 59, 80, 81, 56, 55],
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1
      },
      {
        label: 'Issues',
        data: [28, 48, 40, 19, 86, 27],
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 1
      },
      {
        label: 'Pull Requests',
        data: [45, 25, 16, 36, 67, 18],
        backgroundColor: 'rgba(245, 158, 11, 0.5)',
        borderColor: 'rgb(245, 158, 11)',
        borderWidth: 1
      }
    ]
  };

  let languages = [
    { name: 'JavaScript', percentage: 45 },
    { name: 'Python', percentage: 30 },
    { name: 'TypeScript', percentage: 15 },
    { name: 'Go', percentage: 10 }
  ];

  onMount(() => {
    // Initialize charts when charting library is integrated
  });
</script>

<div class="stats-container">
  <div class="stats-grid">
    <div class="stat-card">
      <h3>Total Repositories</h3>
      <div class="stat-value">42</div>
      <div class="stat-trend positive">+12% from last month</div>
    </div>
    <div class="stat-card">
      <h3>Total Stars</h3>
      <div class="stat-value">1.2k</div>
      <div class="stat-trend positive">+8% from last month</div>
    </div>
    <div class="stat-card">
      <h3>Total Forks</h3>
      <div class="stat-value">856</div>
      <div class="stat-trend positive">+15% from last month</div>
    </div>
    <div class="stat-card">
      <h3>Total Contributions</h3>
      <div class="stat-value">2.4k</div>
      <div class="stat-trend positive">+20% from last month</div>
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
              <span class="language-percentage">{language.percentage}%</span>
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
      <div class="chart-container">
        <!-- Chart will be rendered here -->
      </div>
      <div class="chart-legend">
        <div class="legend-item">
          <div class="legend-color" style="background: rgb(59, 130, 246)"></div>
          <span>Commits</span>
        </div>
        <div class="legend-item">
          <div class="legend-color" style="background: rgb(16, 185, 129)"></div>
          <span>Issues</span>
        </div>
        <div class="legend-item">
          <div class="legend-color" style="background: rgb(245, 158, 11)"></div>
          <span>Pull Requests</span>
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
</style> 