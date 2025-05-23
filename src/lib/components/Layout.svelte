<script lang="ts">
  import { page } from '$app/stores';
  import { fade } from 'svelte/transition';
  import { onMount } from 'svelte';
  import Footer from './Footer.svelte';

  let currentTheme = 'dark';
  let isMoreMenuOpen = false;

  onMount(() => {
    // Get theme from localStorage or default to dark
    currentTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
  });

  function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);
  }

  function toggleMoreMenu() {
    isMoreMenuOpen = !isMoreMenuOpen;
  }

  // Close more menu when clicking outside
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.more-menu') && !target.closest('.more-button')) {
      isMoreMenuOpen = false;
    }
  }
</script>

<svelte:window on:click={handleClickOutside} />

<div class="layout">
  <header class="header">
    <div class="header-left">
      <a href="/" class="logo">
        <span class="logo-text">GitHub Score</span>
      </a>
      <nav class="nav">
        <a href="/" class:active={$page.url.pathname === '/'}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
          Dashboard
        </a>
        <a href="/compare" class:active={$page.url.pathname === '/compare'}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
            <line x1="12" y1="22.08" x2="12" y2="12"></line>
          </svg>
          Compare
        </a>
        <a href="/pricing" class:active={$page.url.pathname === '/pricing'}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="1" x2="12" y2="23"></line>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
          Pricing
        </a>
        <div class="more-menu-container">
          <button class="more-button">
            More
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
          <div class="more-menu">
            <a href="/roadmap" class:active={$page.url.pathname === '/roadmap'}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 20V10"></path>
                <path d="M18 20V4"></path>
                <path d="M6 20v-4"></path>
              </svg>
              Roadmap
            </a>
            <a href="/blog" class:active={$page.url.pathname === '/blog'}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
              </svg>
              Blog
            </a>
            <a href="/jobs" class:active={$page.url.pathname === '/jobs'}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
              </svg>
              Jobs
            </a>
          </div>
        </div>
      </nav>
    </div>
    
    <div class="header-actions">
      <a href="https://github.com/leontiad/goring" target="_blank" rel="noopener noreferrer" class="github-link">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
        </svg>
      </a>
      <button class="theme-toggle" on:click={toggleTheme}>
        {#if currentTheme === 'dark'}
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
        {:else}
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        {/if}
      </button>
    </div>
  </header>

  <main class="main">
    <div class="content" in:fade={{ duration: 200 }}>
      <slot />
    </div>
  </main>

  <Footer />
</div>

<style>
  .layout {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: var(--background);
    color: var(--text);
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-md) var(--spacing-xl);
    border-bottom: 1px solid var(--border);
    background: var(--background);
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: var(--spacing-xl);
  }

  .header-left h1 {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text);
  }

  .nav {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }

  .nav a {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-md);
    color: var(--text-secondary);
    border-radius: var(--radius-md);
    transition: all 0.2s ease;
    font-size: 0.875rem;
  }

  .nav a:hover {
    background: var(--card-hover);
    color: var(--text);
  }

  .nav a.active {
    background: var(--accent);
    color: white;
  }

  .more-menu-container {
    position: relative;
  }

  .more-button {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-md);
    color: var(--text-secondary);
    background: none;
    border: none;
    border-radius: var(--radius-md);
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .more-button:hover {
    background: var(--card-hover);
    color: var(--text);
  }

  .more-menu {
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    margin-top: var(--spacing-sm);
    background: var(--background-secondary);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: var(--spacing-sm);
    min-width: 180px;
    box-shadow: var(--shadow-lg);
    z-index: 100;
    opacity: 0;
    visibility: hidden;
    transition: all 0.2s ease;
  }

  .more-menu-container:hover .more-menu {
    opacity: 1;
    visibility: visible;
  }

  .more-menu a {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-md);
    color: var(--text-secondary);
    border-radius: var(--radius-sm);
    transition: all 0.2s ease;
    font-size: 0.875rem;
    white-space: nowrap;
  }

  .more-menu a:hover {
    background: var(--card-hover);
    color: var(--text);
  }

  .more-menu a.active {
    background: var(--accent);
    color: white;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }

  .theme-toggle {
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    padding: var(--spacing-xs);
    border-radius: var(--radius-md);
    transition: all 0.2s ease;
  }

  .theme-toggle:hover {
    color: var(--text);
    background: var(--background-secondary);
  }

  .main {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .content {
    flex: 1;
    padding: var(--spacing-xl);
    overflow-y: auto;
  }

  @media (max-width: 768px) {
    .header {
      padding: 0 var(--spacing-md);
    }

    .header-left {
      gap: var(--spacing-md);
    }

    .header-left h1 {
      font-size: 1.25rem;
    }

    .nav {
      display: none;
    }

    .nav.open {
      display: flex;
      position: absolute;
      top: 64px;
      left: 0;
      right: 0;
      background: var(--background-secondary);
      padding: var(--spacing-md);
      flex-direction: column;
      border-bottom: 1px solid var(--border);
    }

    .more-menu {
      position: static;
      margin-top: var(--spacing-sm);
      box-shadow: none;
      border: none;
      padding: 0;
    }
  }

  .logo {
    text-decoration: none;
    color: var(--text);
    font-weight: 600;
    font-size: 1.25rem;
    transition: color 0.2s ease;
  }

  .logo:hover {
    color: var(--accent);
  }

  .github-link {
    color: var(--text-secondary);
    transition: color 0.2s ease;
  }

  .github-link:hover {
    color: var(--text);
  }
</style> 