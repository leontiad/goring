<script lang="ts">
  import { fade } from 'svelte/transition';

  const blogPosts = [
    {
      title: "Understanding GitHub Scoring: A Comprehensive Guide",
      excerpt: "Learn how GitHub scoring works and why it's becoming increasingly important in the tech industry. We break down the key metrics and explain how they contribute to a developer's overall score.",
      date: "March 15, 2024",
      readTime: "5 min read",
      category: "Guide",
      image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=60"
    }
  ];
</script>

<div class="blog" in:fade>
  <div class="header">
    <h1>Blog</h1>
    <p class="subtitle">Insights, guides, and updates about GitHub scoring and developer analytics</p>
  </div>

  <div class="blog-grid">
    {#each blogPosts as post}
      <article class="blog-card">
        <div class="card-image">
          <img src={post.image} alt={post.title} />
          <span class="category">{post.category}</span>
        </div>
        <div class="card-content">
          <div class="meta">
            <span class="date">{post.date}</span>
            <span class="read-time">{post.readTime}</span>
          </div>
          <h2>{post.title}</h2>
          <p>{post.excerpt}</p>
          <a href="/blog/understanding-github-scoring" class="read-more">Read more →</a>
        </div>
      </article>
    {/each}
  </div>
</div>

<style>
  .blog {
    max-width: 1200px;
    margin: 0 auto;
    padding: var(--spacing-xl) 0;
  }

  .header {
    text-align: center;
    margin-bottom: var(--spacing-xl);
  }

  .header h1 {
    font-size: 2.5rem;
    margin-bottom: var(--spacing-md);
    color: var(--text);
  }

  .subtitle {
    color: var(--text-secondary);
    font-size: 1.125rem;
    max-width: 600px;
    margin: 0 auto;
  }

  .blog-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--spacing-xl);
    max-width: 800px;
    margin: 0 auto;
  }

  .blog-card {
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    overflow: hidden;
    transition: all 0.2s ease;
  }

  .blog-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
    border-color: var(--accent);
  }

  .card-image {
    position: relative;
    height: 300px;
    overflow: hidden;
  }

  .card-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.2s ease;
  }

  .blog-card:hover .card-image img {
    transform: scale(1.05);
  }

  .category {
    position: absolute;
    top: var(--spacing-md);
    right: var(--spacing-md);
    background: var(--accent);
    color: white;
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--radius-md);
    font-size: 0.875rem;
    font-weight: 500;
  }

  .card-content {
    padding: var(--spacing-xl);
  }

  .meta {
    display: flex;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-sm);
    color: var(--text-secondary);
    font-size: 0.875rem;
  }

  .card-content h2 {
    font-size: 1.75rem;
    margin-bottom: var(--spacing-md);
    color: var(--text);
    line-height: 1.4;
  }

  .card-content p {
    color: var(--text-secondary);
    margin-bottom: var(--spacing-lg);
    line-height: 1.6;
    font-size: 1.125rem;
  }

  .read-more {
    color: var(--accent);
    text-decoration: none;
    font-weight: 500;
    transition: color 0.2s ease;
    font-size: 1.125rem;
  }

  .read-more:hover {
    color: var(--accent-hover);
  }

  @media (max-width: 768px) {
    .blog {
      padding: var(--spacing-lg);
    }

    .header h1 {
      font-size: 2rem;
    }

    .subtitle {
      font-size: 1rem;
    }

    .card-content {
      padding: var(--spacing-lg);
    }

    .card-content h2 {
      font-size: 1.5rem;
    }

    .card-content p {
      font-size: 1rem;
    }

    .read-more {
      font-size: 1rem;
    }
  }
</style> 