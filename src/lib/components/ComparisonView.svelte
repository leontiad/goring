<script lang="ts">
  import type { GitHubScore } from '$lib/types';

  export let scores: GitHubScore[];
</script>

<div class="comparison-grid">
  {#each scores as score}
    <div class="user-card">
      <div class="user-header">
        <h2>{score.username}</h2>
        <div class="rating">{score.rating}</div>
      </div>
      <div class="final-score">
        <div class="score-label">Final Score</div>
        <div class="score-value">{score.final_score.toFixed(2)}%</div>
      </div>
      <div class="component-scores">
        <div class="component-score">
          <div class="score-label">Contribution Score</div>
          <div class="score-value">{score.contribution_score.toFixed(2)}%</div>
        </div>
        <div class="component-score">
          <div class="score-label">Repository Significance</div>
          <div class="score-value">{score.repository_significance.toFixed(2)}%</div>
        </div>
        <div class="component-score">
          <div class="score-label">Code Quality</div>
          <div class="score-value">{score.code_quality.toFixed(2)}%</div>
        </div>
        <div class="component-score">
          <div class="score-label">Community Engagement</div>
          <div class="score-value">{score.community_engagement.toFixed(2)}%</div>
        </div>
      </div>
    </div>
  {/each}
</div>

<style>
  .comparison-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    margin-top: 2rem;
  }

  .user-card {
    background: var(--background);
    border: 1px solid var(--border);
    border-radius: 1rem;
    padding: 1.5rem;
  }

  .user-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.5rem;
  }

  .user-header h2 {
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
    font-size: 2rem;
    font-weight: 700;
    color: var(--text);
  }

  .component-scores {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .component-score {
    background: var(--background-secondary);
    border-radius: 0.5rem;
    padding: 1rem;
    border: 1px solid var(--border);
  }

  .component-score .score-value {
    font-size: 1.5rem;
  }
</style> 