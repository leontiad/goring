<script lang="ts">
  import type { GitHubScore } from '$lib/types';
  import ScoreBreakdown from './ScoreBreakdown.svelte';
  
  export let user1: GitHubScore;
  export let user2: GitHubScore;
</script>

<div class="comparison-view">
  <div class="comparison-header">
    <div class="user-info">
      <h2>{user1.username}</h2>
      <div class="rating">{user1.rating}</div>
    </div>
    <div class="vs">VS</div>
    <div class="user-info">
      <h2>{user2.username}</h2>
      <div class="rating">{user2.rating}</div>
    </div>
  </div>

  <div class="comparison-grid">
    <div class="comparison-column">
      <div class="final-score">
        <div class="score-label">Final Score</div>
        <div class="score-value">{user1.final_score}%</div>
      </div>
      <ScoreBreakdown score={user1} />
    </div>

    <div class="comparison-column">
      <div class="final-score">
        <div class="score-label">Final Score</div>
        <div class="score-value">{user2.final_score}%</div>
      </div>
      <ScoreBreakdown score={user2} />
    </div>
  </div>
</div>

<style>
  .comparison-view {
    background: linear-gradient(135deg, #111111, #1a1a1a);
    border-radius: 1rem;
    padding: 2rem;
    border: 1px solid #2a2a2a;
    margin-top: 2rem;
  }

  .comparison-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 2rem;
  }

  .user-info {
    text-align: center;
  }

  .user-info h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #ffffff;
    margin-bottom: 0.5rem;
  }

  .rating {
    font-size: 1.25rem;
    color: #a0a0a0;
  }

  .vs {
    font-size: 1.5rem;
    font-weight: 700;
    color: #4a4a4a;
    padding: 0 2rem;
  }

  .comparison-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
  }

  .comparison-column {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .final-score {
    background: #1a1a1a;
    border-radius: 0.75rem;
    padding: 1.5rem;
    border: 1px solid #2a2a2a;
    text-align: center;
  }

  .score-label {
    color: #a0a0a0;
    font-size: 1rem;
    margin-bottom: 0.5rem;
  }

  .score-value {
    font-size: 3rem;
    font-weight: 700;
    color: #ffffff;
  }
</style> 