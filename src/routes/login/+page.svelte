<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient';
  import { goto } from '$app/navigation';
  import { fade } from 'svelte/transition';
  import { page } from '$app/stores';
  import { browser } from '$app/environment';
  import Layout from '$lib/components/Layout.svelte';

  let loading = false;
  let errorMessage: string | null = null;

  onMount(async () => {
    console.log('Login page mounted');
    console.log('Current URL:', window.location.href);
    console.log('URL search params:', Object.fromEntries(new URLSearchParams(window.location.search)));
    
    // Check for error in URL
    const error = $page.url.searchParams.get('error');
    if (error) {
      errorMessage = decodeURIComponent(error);
    }

    // Check if user is already logged in
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      console.log('User already logged in, redirecting to home');
      goto('/');
    }
  });

  async function handleGitHubLogin() {
    if (!browser) return;
    
    console.log('GitHub login button clicked');
    try {
      loading = true;
      errorMessage = null;
      
      const callbackUrl = `${window.location.origin}/auth/callback`;
      console.log('Callback URL:', callbackUrl);
      
      console.log('Initiating GitHub OAuth...');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: callbackUrl,
          scopes: 'read:user user:email',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });

      console.log('OAuth response:', { data, error });
      console.log('OAuth URL:', data?.url);
      
      if (error) {
        console.error('Auth error:', error);
        throw error;
      }

      if (!data?.url) {
        throw new Error('No redirect URL received from Supabase');
      }

      console.log('Redirecting to GitHub:', data.url);
      window.location.href = data.url;
    } catch (e) {
      console.error('Login error:', e);
      errorMessage = e instanceof Error ? e.message : 'An error occurred during login';
      loading = false;
    }
  }

  async function handleGoogleLogin() {
    if (!browser) return;
    
    console.log('Google login button clicked');
    try {
      loading = true;
      errorMessage = null;
      
      const callbackUrl = `${window.location.origin}/auth/callback`;
      console.log('Callback URL:', callbackUrl);
      
      console.log('Initiating Google OAuth...');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
          scopes: 'email profile',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });

      console.log('OAuth response:', { data, error });
      console.log('OAuth URL:', data?.url);
      
      if (error) {
        console.error('Auth error:', error);
        throw error;
      }

      if (!data?.url) {
        throw new Error('No redirect URL received from Supabase');
      }

      console.log('Redirecting to Google:', data.url);
      window.location.href = data.url;
    } catch (e) {
      console.error('Login error:', e);
      errorMessage = e instanceof Error ? e.message : 'An error occurred during login';
      loading = false;
    }
  }
</script>

<Layout>
  <div class="login-container" in:fade>
    <div class="login-card">
      <div class="header">
        <h1>Welcome to GitHub Score</h1>
        <p class="subtitle">Sign in to continue</p>
      </div>

      {#if errorMessage}
        <div class="error-message">
          {errorMessage}
        </div>
      {/if}

      <div class="login-buttons">
        <button 
          class="login-button github-button" 
          on:click={handleGitHubLogin}
          disabled={loading}
          type="button"
        >
          {#if loading}
            <svg class="spinner" viewBox="0 0 50 50">
              <circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle>
            </svg>
          {:else}
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
            </svg>
          {/if}
          {loading ? '...' : 'GitHub'}
        </button>

        <button 
          class="login-button google-button" 
          on:click={handleGoogleLogin}
          disabled={true}
          type="button"
          title="Google login is currently disabled"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google
        </button>
      </div>
    </div>
  </div>
</Layout>

<style>
  .login-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: calc(100vh - 200px); /* Account for header and footer */
    padding: var(--spacing-xl);
  }

  .login-card {
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: var(--spacing-xl);
    width: 100%;
    max-width: 400px;
    text-align: center;
  }

  .header {
    margin-bottom: var(--spacing-xl);
  }

  .header h1 {
    font-size: 2rem;
    margin-bottom: var(--spacing-md);
    color: var(--text);
  }

  .subtitle {
    color: var(--text-secondary);
    font-size: 1.125rem;
  }

  .login-buttons {
    display: flex;
    flex-direction: row;
    gap: var(--spacing-md);
    justify-content: center;
  }

  .login-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
    width: 140px;
    padding: var(--spacing-md) var(--spacing-md);
    border: none;
    border-radius: var(--radius-md);
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .github-button {
    background: var(--accent);
    color: white;
  }

  .google-button {
    background: white;
    color: #757575;
    border: 1px solid #ddd;
    position: relative;
    overflow: hidden;
  }

  .login-button:hover:not(:disabled) {
    transform: translateY(-2px);
  }

  .github-button:hover:not(:disabled) {
    background: var(--accent-hover);
  }

  .google-button:hover:not(:disabled) {
    background: #f8f8f8;
  }

  .login-button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .error-message {
    background: rgba(255, 0, 0, 0.1);
    color: #ff4444;
    padding: var(--spacing-md);
    border-radius: var(--radius-md);
    margin-bottom: var(--spacing-lg);
  }

  .spinner {
    animation: rotate 2s linear infinite;
    width: 24px;
    height: 24px;
  }

  .spinner .path {
    stroke: currentColor;
    stroke-linecap: round;
    animation: dash 1.5s ease-in-out infinite;
  }

  @keyframes rotate {
    100% {
      transform: rotate(360deg);
    }
  }

  @keyframes dash {
    0% {
      stroke-dasharray: 1, 150;
      stroke-dashoffset: 0;
    }
    50% {
      stroke-dasharray: 90, 150;
      stroke-dashoffset: -35;
    }
    100% {
      stroke-dasharray: 90, 150;
      stroke-dashoffset: -124;
    }
  }

  .google-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .google-button:disabled::after {
    content: '×';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 24px;
    color: #ff4444;
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .google-button:disabled:hover::after {
    opacity: 1;
  }
</style> 