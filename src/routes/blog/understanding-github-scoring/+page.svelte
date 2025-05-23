<script lang="ts">
  import { fade } from 'svelte/transition';

  const blogPost = {
    title: "Understanding GitHub Scoring: A Comprehensive Guide",
    date: "March 15, 2024",
    readTime: "5 min read",
    category: "Guide",
    image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=60",
    content: `
      <p>GitHub scoring has become an essential metric in the tech industry, providing valuable insights into a developer's contributions and expertise. In this comprehensive guide, we'll explore how GitHub scoring works and why it matters.</p>

      <h2>What is GitHub Scoring?</h2>
      <p>GitHub scoring is a sophisticated system that evaluates a developer's contributions, code quality, and community engagement on the GitHub platform. It takes into account various factors to provide a holistic view of a developer's capabilities and impact.</p>

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

  .content :global(p) {
    margin-bottom: var(--spacing-lg);
    color: var(--text-secondary);
  }

  .content :global(ul) {
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