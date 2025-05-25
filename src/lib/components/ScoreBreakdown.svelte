<script lang="ts">
  import type { GitHubScore } from '$lib/types';
  
  export let score: GitHubScore;
</script>

<div class="score-breakdown">
  <h2>Score Breakdown</h2>
  
  <div class="metrics-grid">
    <div class="metric-card">
      <h3>Contribution Score</h3>
      <div class="metric-value">{score.contribution_score.toFixed(2)}%</div>
      <div class="progress-bar">
        <div class="progress" style="width: {score.contribution_score}%"></div>
      </div>
    </div>
    
    <div class="metric-card">
      <h3>Repository Significance</h3>
      <div class="metric-value">{score.repository_significance.toFixed(2)}%</div>
      <div class="progress-bar">
        <div class="progress" style="width: {score.repository_significance}%"></div>
      </div>
    </div>
    
    <div class="metric-card">
      <h3>Code Quality</h3>
      <div class="metric-value">{score.code_quality.toFixed(2)}%</div>
      <div class="progress-bar">
        <div class="progress" style="width: {score.code_quality}%"></div>
      </div>
    </div>
    
    <div class="metric-card">
      <h3>Community Engagement</h3>
      <div class="metric-value">{score.community_engagement.toFixed(2)}%</div>
      <div class="progress-bar">
        <div class="progress" style="width: {score.community_engagement}%"></div>
      </div>
    </div>
  </div>
</div>

<style>
  .score-breakdown {
    background: var(--background);
    border-radius: 0.75rem;
    padding: 1.5rem;
    border: 1px solid var(--border);
    margin-top: 1.5rem;
  }

  h2 {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text);
    margin-bottom: 1rem;
  }

  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .metric-card {
    background: var(--background-secondary);
    border-radius: 0.5rem;
    padding: 1rem;
    border: 1px solid var(--border);
  }

  .metric-card h3 {
    color: var(--text-secondary);
    font-size: 0.875rem;
    font-weight: 500;
    margin-bottom: 0.25rem;
  }

  .metric-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text);
    margin-bottom: 0.5rem;
  }

  .progress-bar {
    height: 4px;
    background: var(--border);
    border-radius: 2px;
    overflow: hidden;
  }

  .progress {
    height: 100%;
    background: var(--accent);
    border-radius: 2px;
    transition: width 0.3s ease;
  }
</style> 