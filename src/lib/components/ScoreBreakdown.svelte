<script lang="ts">
  import type { GitHubScore } from '$lib/types';
  
  export let score: GitHubScore;
</script>

<div class="score-breakdown">
  <h2>Score Breakdown</h2>
  
  <div class="metrics-grid">
    <div class="metric-card">
      <h3>Contribution Score</h3>
      <div class="metric-value">{score.contribution_score}%</div>
      <div class="progress-bar">
        <div class="progress" style="width: {score.contribution_score}%"></div>
      </div>
    </div>
    
    <div class="metric-card">
      <h3>Repository Significance</h3>
      <div class="metric-value">{score.repository_significance}%</div>
      <div class="progress-bar">
        <div class="progress" style="width: {score.repository_significance}%"></div>
      </div>
    </div>
    
    <div class="metric-card">
      <h3>Code Quality</h3>
      <div class="metric-value">{score.code_quality}%</div>
      <div class="progress-bar">
        <div class="progress" style="width: {score.code_quality}%"></div>
      </div>
    </div>
    
    <div class="metric-card">
      <h3>Community Engagement</h3>
      <div class="metric-value">{score.community_engagement}%</div>
      <div class="progress-bar">
        <div class="progress" style="width: {score.community_engagement}%"></div>
      </div>
    </div>
  </div>
</div>

<style>
  .score-breakdown {
    background: linear-gradient(135deg, #111111, #1a1a1a);
    border-radius: 1rem;
    padding: 2rem;
    border: 1px solid #2a2a2a;
    margin-top: 2rem;
  }

  h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #ffffff;
    margin-bottom: 1.5rem;
  }

  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
  }

  .metric-card {
    background: #1a1a1a;
    border-radius: 0.75rem;
    padding: 1.5rem;
    border: 1px solid #2a2a2a;
  }

  .metric-card h3 {
    color: #a0a0a0;
    font-size: 1rem;
    font-weight: 500;
    margin-bottom: 0.5rem;
  }

  .metric-value {
    font-size: 2rem;
    font-weight: 700;
    color: #ffffff;
    margin-bottom: 1rem;
  }

  .progress-bar {
    height: 6px;
    background: #2a2a2a;
    border-radius: 3px;
    overflow: hidden;
  }

  .progress {
    height: 100%;
    background: linear-gradient(90deg, #3a3a3a, #4a4a4a);
    border-radius: 3px;
    transition: width 0.3s ease;
  }
</style> 