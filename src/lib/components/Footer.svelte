<script lang="ts">
  import { page } from '$app/stores';
</script>

<footer class="footer">
  <div class="footer-content">
    <div class="footer-section">
      <h3>Product</h3>
      <a href="/dashboard">Dashboard</a>
      <a href="/compare">Compare</a>
      <a href="/trending">Trending</a>
      <a href="/pricing">Pricing</a>
    </div>

    <div class="footer-section">
      <h3>Resources</h3>
      <a href="/roadmap">Roadmap</a>
      <a href="/blog">Blog</a>
      <a href="/jobs">Jobs</a>
    </div>

    <div class="footer-section">
      <h3>Help & Support</h3>
      <a href="https://github.com/leontiad/goring" target="_blank" rel="noopener">GitHub Issues</a>
      <a href="https://discord.gg/your-server" target="_blank" rel="noopener">Discord</a>
      <a href="/faq">FAQ</a>
    </div>

    <div class="footer-section">
      <h3>Legal</h3>
      <a href="/privacy">Privacy Policy</a>
      <a href="/terms">Terms of Service</a>
      <a href="/license">License</a>
    </div>
  </div>

  <div class="footer-bottom">
    <div class="copyright">
      Devs can't cheat
    </div>
    <div class="copyright">
      © {new Date().getFullYear()} Goring. All rights reserved.
    </div>
  </div>
</footer>

<style>
  .footer {
    background: var(--background-secondary);
    border-top: 1px solid var(--border);
    padding: var(--spacing-xl) 0;
    margin-top: auto;
  }

  .footer-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 var(--spacing-xl);
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-xl);
  }

  .footer-section {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .footer-section h3 {
    color: var(--text);
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: var(--spacing-sm);
  }

  .footer-section a {
    color: var(--text-secondary);
    text-decoration: none;
    font-size: 0.875rem;
    transition: color 0.2s ease;
  }

  .footer-section a:hover {
    color: var(--accent);
  }

  .footer-bottom {
    max-width: 1200px;
    margin: var(--spacing-xl) auto 0;
    padding: var(--spacing-xl) var(--spacing-xl) 0;
    border-top: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .copyright {
    color: var(--text-secondary);
    font-size: 0.875rem;
    text-align: center;
  }

  @media (max-width: 768px) {
    .footer-content {
      grid-template-columns: repeat(2, 1fr);
      padding: 0 var(--spacing-md);
    }

    .footer-bottom {
      padding: var(--spacing-lg) var(--spacing-md) 0;
    }
  }

  @media (max-width: 480px) {
    .footer-content {
      grid-template-columns: 1fr;
    }
  }
</style> 