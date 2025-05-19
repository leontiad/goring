<script lang="ts">
  import { page } from '$app/stores';
</script>

<footer class="footer">
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

  .footer-bottom {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 var(--spacing-xl);
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
    .footer-bottom {
      padding: 0 var(--spacing-md);
    }
  }
</style> 