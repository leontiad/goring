<script lang="ts">
  import { fade } from 'svelte/transition';

  const blogPost = {
    title: "Understanding GitHub Scoring: A Comprehensive Guide",
    date: "March 15, 2024",
    readTime: "8 min read",
    category: "Guide",
    image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=60",
    content: `
      <p>GitHub scoring has become an essential metric in the tech industry, providing valuable insights into a developer's contributions and expertise. In this comprehensive guide, we'll explore how GitHub scoring works, what the final percentage score means, and why it matters.</p>

      <h2>What is GitHub Scoring?</h2>
      <p>GitHub scoring is a sophisticated system that evaluates a developer's contributions, code quality, and community engagement on the GitHub platform. It takes into account various factors to provide a holistic view of a developer's capabilities and impact.</p>

      <h2>What Does the Final Percentage Score Mean?</h2>
      <p>The <strong>final percentage score</strong> is a comprehensive evaluation of a developer's overall GitHub profile quality, expressed as a percentage of the maximum possible score. Here's what it measures:</p>

      <h3>Score Range: 0-100%</h3>
      <ul>
        <li><strong>0%</strong> = No GitHub activity or very poor profile</li>
        <li><strong>100%</strong> = Exceptional developer with outstanding contributions</li>
      </ul>

      <h3>What the Score Measures</h3>
      <p>The final score is calculated from <strong>4 main weighted components</strong>:</p>

      <h4>1. Contribution Weight (35% of final score)</h4>
      <ul>
        <li>Commit frequency and recency</li>
        <li>Issue resolution rate</li>
        <li>Pull request acceptance rate</li>
        <li>Recent activity (last 6 months)</li>
      </ul>

      <h4>2. Repository Significance (30% of final score)</h4>
      <ul>
        <li>Total stars and forks across repositories</li>
        <li>Repository activity and maintenance</li>
        <li>Ecosystem impact (how much others use their code)</li>
      </ul>

      <h4>3. Code Quality (20% of final score)</h4>
      <ul>
        <li>Code review participation</li>
        <li>Documentation quality</li>
        <li>Commit message quality</li>
        <li>Following best practices</li>
      </ul>

      <h4>4. Community Engagement (15% of final score)</h4>
      <ul>
        <li>Discussion participation</li>
        <li>Project diversity (contributing to multiple projects)</li>
        <li>Maintainer roles and ownership</li>
      </ul>

      <h3>How It's Calculated</h3>
      <ol>
        <li>Each component is scored from 0-1 (0% to 100%)</li>
        <li>Components are weighted according to their importance</li>
        <li>Final score = (Contribution × 0.35) + (Repository × 0.30) + (Quality × 0.20) + (Community × 0.15)</li>
        <li>The result is multiplied by 100 to get the percentage</li>
      </ol>

      <h3>What the Percentages Mean</h3>
      <ul>
        <li><strong>90-100%</strong>: Outstanding Contributor</li>
        <li><strong>80-89%</strong>: Exceptional Developer</li>
        <li><strong>70-79%</strong>: Excellent Developer</li>
        <li><strong>60-69%</strong>: Very Good Developer</li>
        <li><strong>50-59%</strong>: Strong Developer</li>
        <li><strong>40-49%</strong>: Good Developer</li>
        <li><strong>30-39%</strong>: Promising Developer</li>
        <li><strong>20-29%</strong>: Developing Contributor</li>
        <li><strong>0-19%</strong>: Beginner</li>
      </ul>

      <h3>Real-World Context</h3>
      <p>A <strong>75% score</strong> means the developer is performing at 75% of what would be considered an "ideal" GitHub profile - someone with consistent contributions, high-quality code, active community engagement, and impactful repositories.</p>

      <p>The score is <strong>relative to the maximum possible performance</strong> across all measured GitHub activities, making it a comprehensive assessment of developer quality and engagement.</p>

      <h2>Key Metrics in GitHub Scoring</h2>
      <h3>1. Contribution Weight (35%)</h3>
      <ul>
        <li>Commit frequency and recency</li>
        <li>Issue resolution rate</li>
        <li>Pull request acceptance rate</li>
        <li>Code review participation</li>
      </ul>

      <h3>2. Repository Significance (30%)</h3>
      <ul>
        <li>Stars and forks</li>
        <li>Repository activity</li>
        <li>Ecosystem impact</li>
        <li>Project diversity</li>
      </ul>

      <h3>3. Code Quality (20%)</h3>
      <ul>
        <li>Documentation quality</li>
        <li>Code review participation</li>
        <li>Commit message quality</li>
        <li>Code organization</li>
      </ul>

      <h3>4. Community Engagement (15%)</h3>
      <ul>
        <li>Discussion participation</li>
        <li>Project diversity</li>
        <li>Maintainer roles</li>
        <li>Community contributions</li>
      </ul>

      <h2>Why GitHub Scoring Matters</h2>
      <p>GitHub scoring has become increasingly important for several reasons:</p>
      <ul>
        <li>It provides an objective measure of a developer's contributions</li>
        <li>Helps recruiters identify top talent</li>
        <li>Encourages better coding practices and community engagement</li>
        <li>Creates a more transparent and merit-based tech community</li>
      </ul>

      <h2>How to Improve Your GitHub Score</h2>
      <p>To improve your GitHub score, focus on:</p>
      <ul>
        <li>Regular and meaningful contributions</li>
        <li>High-quality code and documentation</li>
        <li>Active participation in code reviews</li>
        <li>Engagement with the open-source community</li>
        <li>Maintaining and growing your repositories</li>
      </ul>

      <h2>Conclusion</h2>
      <p>GitHub scoring is more than just a number—it's a reflection of your commitment to quality code and community engagement. By understanding and actively working on these metrics, you can improve your score and demonstrate your value as a developer.</p>

      <p>The final percentage score provides a clear, quantifiable measure of your GitHub profile's quality, helping you understand where you stand and what areas you can improve to become a more impactful developer in the open-source community.</p>
    `
  };
</script>

<div class="blog-post" in:fade>
  <article>
    <div class="header">
      <div class="meta">
        <span class="category">{blogPost.category}</span>
        <span class="date">{blogPost.date}</span>
        <span class="read-time">{blogPost.readTime}</span>
      </div>
      <h1>{blogPost.title}</h1>
    </div>

    <div class="featured-image">
      <img src={blogPost.image} alt={blogPost.title} />
    </div>

    <div class="content">
      {@html blogPost.content}
    </div>
  </article>
</div>

<style>
  .blog-post {
    max-width: 800px;
    margin: 0 auto;
    padding: var(--spacing-xl) 0;
  }

  .header {
    text-align: center;
    margin-bottom: var(--spacing-xl);
  }

  .meta {
    display: flex;
    justify-content: center;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-md);
    color: var(--text-secondary);
    font-size: 0.875rem;
  }

  .category {
    background: var(--accent);
    color: white;
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--radius-md);
    font-weight: 500;
  }

  h1 {
    font-size: 2.5rem;
    line-height: 1.2;
    color: var(--text);
    margin-bottom: var(--spacing-lg);
  }

  .featured-image {
    margin-bottom: var(--spacing-xl);
    border-radius: var(--radius-lg);
    overflow: hidden;
  }

  .featured-image img {
    width: 100%;
    height: auto;
    display: block;
  }

  .content {
    color: var(--text);
    line-height: 1.8;
    font-size: 1.125rem;
  }

  .content :global(h2) {
    font-size: 1.75rem;
    margin: var(--spacing-xl) 0 var(--spacing-md);
    color: var(--text);
  }

  .content :global(h3) {
    font-size: 1.5rem;
    margin: var(--spacing-lg) 0 var(--spacing-md);
    color: var(--text);
  }

  .content :global(h4) {
    font-size: 1.25rem;
    margin: var(--spacing-md) 0 var(--spacing-sm);
    color: var(--text);
    font-weight: 600;
  }

  .content :global(p) {
    margin-bottom: var(--spacing-lg);
    color: var(--text-secondary);
  }

  .content :global(ul) {
    margin-bottom: var(--spacing-lg);
    padding-left: var(--spacing-xl);
    color: var(--text-secondary);
  }

  .content :global(ol) {
    margin-bottom: var(--spacing-lg);
    padding-left: var(--spacing-xl);
    color: var(--text-secondary);
  }

  .content :global(li) {
    margin-bottom: var(--spacing-sm);
  }

  @media (max-width: 768px) {
    .blog-post {
      padding: var(--spacing-lg);
    }

    h1 {
      font-size: 2rem;
    }

    .content {
      font-size: 1rem;
    }

    .content :global(h2) {
      font-size: 1.5rem;
    }

    .content :global(h3) {
      font-size: 1.25rem;
    }
  }
</style> 