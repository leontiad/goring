<script lang="ts">
  import { page } from '$app/stores';
  import { fade } from 'svelte/transition';
  import { onMount } from 'svelte';
  import { createClient } from '$lib/supabase/client';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import Footer from './Footer.svelte';
  import SubscriptionStatusPopup from './SubscriptionStatusPopup.svelte';

  let currentTheme = 'dark';
  let isMoreMenuOpen = false;
  let remainingSearches = 2;
  let showSubscriptionPopup = false;
  const supabase = createClient();

  onMount(() => {
    // Get theme from localStorage or default to dark
    currentTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    
    // Check remaining searches on mount
    checkRemainingSearches();
    
    // Listen for search count updates from dashboard
    window.addEventListener('updateSearchCount', (event: Event) => {
      const customEvent = event as CustomEvent;
      remainingSearches = customEvent.detail.remainingSearches;
    });
  });

  async function checkRemainingSearches() {
    if ($page.data.session?.user) {
      try {
        const response = await fetch('/api/search-limit');
        const data = await response.json();
        
        if (response.ok) {
          remainingSearches = data.remainingSearches;
        }
      } catch (err) {
        console.error('Error checking remaining searches:', err);
      }
    }
  }

  // Watch for user changes and check remaining searches
  $: if (browser && $page.data.session?.user) {
    checkRemainingSearches();
  }

  function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);
  }

  function toggleMoreMenu() {
    isMoreMenuOpen = !isMoreMenuOpen;
  }

  function showSubscriptionStatus() {
    showSubscriptionPopup = true;
  }

  function closeSubscriptionPopup() {
    showSubscriptionPopup = false;
  }

  function handleNavigation(route: string) {
    // Define public routes that don't require authentication
    const publicRoutes = ['/pricing', '/roadmap', '/blog'];
    
    if (publicRoutes.includes(route)) {
      // Public route - navigate normally
      goto(route);
    } else if ($page.data.session?.user) {
      // Protected route and user is authenticated, navigate normally
      goto(route);
    } else {
      // Protected route but user is not authenticated, dispatch event to show login modal
      window.dispatchEvent(new CustomEvent('showLoginModal'));
    }
  }

  async function signOut() {
    try {
      console.log('Starting sign out process...');
      
      // Immediately redirect to prevent any Supabase redirects
      const redirectPromise = new Promise<void>((resolve) => {
        setTimeout(() => {
          console.log('Forcing redirect to main page...');
          window.location.href = '/';
          resolve();
        }, 50);
      });
      
      // Sign out in the background
      const signOutPromise = supabase.auth.signOut({
        scope: 'local'
      });
      
      // Clear storage immediately
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear cookies
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      });
      
      // Wait for redirect to happen
      await redirectPromise;
      
      // Handle sign out result (if it completes before redirect)
      try {
        const { error } = await signOutPromise;
        if (error) {
          console.error('Sign out error:', error);
        } else {
          console.log('Sign out completed successfully');
        }
      } catch (err) {
        console.log('Sign out was interrupted by redirect (expected)');
      }
      
    } catch (err) {
      console.error('Sign out error:', err);
      // Fallback - force redirect
      window.location.href = '/';
    }
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
        <button 
          class="nav-link" 
          class:active={$page.url.pathname === '/dashboard'}
          on:click={() => handleNavigation('/dashboard')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
          Dashboard
        </button>
        <button 
          class="nav-link" 
          class:active={$page.url.pathname === '/compare'}
          on:click={() => handleNavigation('/compare')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
            <line x1="12" y1="22.08" x2="12" y2="12"></line>
          </svg>
          Compare
        </button>
        <button 
          class="nav-link" 
          class:active={$page.url.pathname === '/pricing'}
          on:click={() => handleNavigation('/pricing')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="1" x2="12" y2="23"></line>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
          Pricing
        </button>
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
          </div>
        </div>
      </nav>
    </div>
    
    <div class="header-actions">
      {#if $page.data.session?.user}
        <div class="user-info">
          <button class="email-button" on:click={showSubscriptionStatus}>
            <span class="welcome-text">Welcome, {$page.data.session.user.email}</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </button>
          <div class="search-limit-display">
            <span class="remaining-searches">{remainingSearches} searches left</span>
          </div>
          <button class="sign-out-btn" on:click={signOut}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16,17 21,12 16,7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Sign Out
          </button>
        </div>
      {/if}
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

<SubscriptionStatusPopup 
  show={showSubscriptionPopup} 
  userEmail={$page.data.session?.user?.email || ''} 
  on:close={closeSubscriptionPopup}
/>

<style>
  .layout {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    background: var(--background);
    border-bottom: 1px solid var(--border);
    position: sticky;
    top: 0;
    z-index: 100;
    backdrop-filter: blur(10px);
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 2rem;
  }

  .logo {
    text-decoration: none;
    color: var(--text);
    font-weight: 700;
    font-size: 1.25rem;
  }

  .logo-text {
    background: linear-gradient(135deg, var(--accent), var(--accent-hover));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .nav {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .nav-link {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    border-radius: 0.5rem;
    border: none;
    background: transparent;
    color: var(--text-secondary);
    text-decoration: none;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .nav-link:hover {
    color: var(--text);
    background: var(--background-secondary);
  }

  .nav-link.active {
    color: var(--accent);
    background: var(--background-secondary);
  }

  .nav-link svg {
    width: 20px;
    height: 20px;
  }

  .more-menu-container {
    position: relative;
  }

  .more-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    border-radius: 0.5rem;
    border: none;
    background: transparent;
    color: var(--text-secondary);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .more-button:hover {
    color: var(--text);
    background: var(--background-secondary);
  }

  .more-menu {
    position: absolute;
    top: 100%;
    left: 0;
    margin-top: 0.5rem;
    padding: 0.5rem;
    background: var(--background);
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    min-width: 150px;
    opacity: 0;
    visibility: hidden;
    transform: translateY(-10px);
    transition: all 0.2s ease;
  }

  .more-menu-container:hover .more-menu {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }

  .more-menu a {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    border-radius: 0.25rem;
    color: var(--text-secondary);
    text-decoration: none;
    font-size: 0.875rem;
    transition: all 0.2s ease;
  }

  .more-menu a:hover {
    color: var(--text);
    background: var(--background-secondary);
  }

  .more-menu a.active {
    color: var(--accent);
    background: var(--background-secondary);
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .email-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    border-radius: 0.5rem;
    border: none;
    background: transparent;
    color: var(--text-secondary);
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .email-button:hover {
    color: var(--text);
    background: var(--background-secondary);
  }

  .email-button svg {
    width: 16px;
    height: 16px;
    transition: transform 0.2s ease;
  }

  .email-button:hover svg {
    transform: translateY(1px);
  }

  .welcome-text {
    font-size: 0.875rem;
    color: var(--text-secondary);
  }

  .search-limit-display {
    display: flex;
    align-items: center;
  }

  .remaining-searches {
    font-size: 0.75rem;
    color: var(--text-secondary);
    background: var(--background-secondary);
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    border: 1px solid var(--border);
  }

  .sign-out-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    border-radius: 0.5rem;
    border: 1px solid var(--border);
    background: var(--background-secondary);
    color: var(--text-secondary);
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .sign-out-btn:hover {
    background: var(--background);
    color: var(--text);
    border-color: var(--accent);
  }

  .github-link {
    display: flex;
    align-items: center;
    padding: 0.5rem;
    border-radius: 0.5rem;
    color: var(--text-secondary);
    transition: all 0.2s ease;
  }

  .github-link:hover {
    color: var(--text);
    background: var(--background-secondary);
  }

  .theme-toggle {
    display: flex;
    align-items: center;
    padding: 0.5rem;
    border-radius: 0.5rem;
    border: none;
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .theme-toggle:hover {
    color: var(--text);
    background: var(--background-secondary);
  }

  main {
    flex: 1;
  }

  @media (max-width: 768px) {
    .header {
      padding: 1rem;
    }

    .header-left {
      gap: 1rem;
    }

    .nav {
      gap: 0.5rem;
    }

    .nav-link {
      padding: 0.5rem;
    }

    .nav-link span {
      display: none;
    }

    .welcome-text {
      display: none;
    }

    .user-info {
      gap: 0.5rem;
    }
  }

  @media (max-width: 480px) {
    .header-left h1 {
      display: none;
    }

    .nav {
      display: none;
    }

    .nav.open {
      display: flex;
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      flex-direction: column;
      background: var(--background);
      border-bottom: 1px solid var(--border);
      padding: 1rem;
      gap: 0.5rem;
    }
  }
</style> 