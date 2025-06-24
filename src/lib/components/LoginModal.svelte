<script lang="ts">
  import { createClient } from '$lib/supabase/client';
  import { onMount } from 'svelte';

  export let show = false;
  export let onClose: () => void;
  export let redirectTo: string = '/dashboard';

  let loginLoading = false;
  let loginError: string | null = null;
  
  const supabase = createClient();

  onMount(() => {
    // Check for error in URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const urlError = urlParams.get('error');
    if (urlError) {
      loginError = decodeURIComponent(urlError);
      show = true;
      // Clear the error from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  });

  async function signInWithGoogle() {
    try {
      loginLoading = true;
      loginError = null;
      
      console.log('Starting Google OAuth sign in...');
      const { data: oauthData, error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`
        }
      });

      if (signInError) {
        console.error('Sign in error:', signInError);
        loginError = signInError.message;
      } else {
        console.log('OAuth initiated successfully');
      }
    } catch (err) {
      console.error('Sign in error:', err);
      loginError = 'An unexpected error occurred';
    } finally {
      loginLoading = false;
    }
  }

  function closeModal() {
    onClose();
    loginError = null;
  }
</script>

{#if show}
  <div class="modal-overlay" on:click={closeModal}>
    <div class="login-modal" on:click|stopPropagation>
      <div class="login-header">
        <h2>Sign in to continue</h2>
        <button class="close-btn" on:click={closeModal}>×</button>
      </div>
      
      <div class="login-content">
        <p>Use your Google account to access the dashboard</p>

        {#if loginError}
          <div class="error-message">
            {loginError}
          </div>
        {/if}

        <button 
          class="google-signin-btn" 
          on:click={signInWithGoogle}
          disabled={loginLoading}
        >
          {#if loginLoading}
            <div class="spinner"></div>
          {:else}
            <svg class="google-icon" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          {/if}
          {loginLoading ? 'Signing in...' : 'Continue with Google'}
        </button>

        <div class="terms">
          <p>By continuing, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(4px);
  }

  .login-modal {
    background: white;
    border-radius: 16px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
    max-width: 400px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
  }

  .login-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px 24px 0 24px;
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 16px;
  }

  .login-header h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: #1f2937;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 24px;
    color: #6b7280;
    cursor: pointer;
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.2s ease;
  }

  .close-btn:hover {
    background: #f3f4f6;
    color: #374151;
    transform: none;
  }

  .login-content {
    padding: 24px;
  }

  .login-content > p {
    margin: 0 0 24px 0;
    color: #6b7280;
    font-size: 14px;
    text-align: center;
  }

  .google-signin-btn {
    width: 100%;
    padding: 12px 24px;
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 500;
    color: #374151;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-bottom: 24px;
  }

  .google-signin-btn:hover:not(:disabled) {
    border-color: #cbd5e0;
    background: #f7fafc;
    transform: none;
  }

  .google-signin-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .google-icon {
    width: 20px;
    height: 20px;
  }

  .spinner {
    width: 20px;
    height: 20px;
    border: 2px solid #e2e8f0;
    border-top: 2px solid #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .terms p {
    margin: 0;
    font-size: 12px;
    color: #9ca3af;
    line-height: 1.4;
    text-align: center;
  }

  .error-message {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #dc2626;
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 16px;
    font-size: 14px;
  }

  @media (max-width: 480px) {
    .login-modal {
      width: 95%;
      margin: 20px;
    }
    
    .login-header,
    .login-content {
      padding: 20px;
    }
  }
</style> 