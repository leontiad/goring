<script lang="ts">
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabaseClient';
    import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  
    onMount(async () => {
    try {
      console.log('[Callback] Page mounted');
      console.log('[Callback] Current URL:', window.location.href);
      console.log('[Callback] URL search params:', Object.fromEntries(new URLSearchParams(window.location.search)));

      // Get the code from the URL
      const code = new URLSearchParams(window.location.search).get('code');
      if (!code) {
        console.error('[Callback] No code found in URL');
        goto('/login?error=' + encodeURIComponent('No authorization code found'));
        return;
      }

      console.log('[Callback] Found code:', {
        codeLength: code.length,
        codePrefix: code.substring(0, 10) + '...'
      });

      // Exchange the code for a session
      console.log('[Callback] Exchanging code for session...');
      const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('[Callback] Auth error:', {
          message: error.message,
          status: error.status,
          name: error.name
        });
        goto('/login?error=' + encodeURIComponent(error.message));
        return;
      }

      if (!session) {
        console.error('[Callback] No session in response');
        goto('/login?error=' + encodeURIComponent('No session established'));
        return;
      }

      console.log('[Callback] Session established successfully:', {
        user: session.user?.email,
        expiresAt: session.expires_at,
        accessTokenLength: session.access_token.length,
        refreshTokenLength: session.refresh_token?.length
      });

      // Redirect to home page
      console.log('[Callback] Redirecting to home...');
      goto('/');
    } catch (e) {
      console.error('[Callback] Unexpected error:', {
        message: e instanceof Error ? e.message : 'Unknown error',
        stack: e instanceof Error ? e.stack : undefined
      });
      goto('/login?error=' + encodeURIComponent('Authentication failed'));
    }
  });
</script>

<div class="callback-container">
  <div class="loading-spinner"></div>
  <p>Processing authentication...</p>
</div>

<style>
  .callback-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    gap: 1rem;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid var(--accent);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style>