<script lang="ts">
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabaseClient';
    import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  
    onMount(async () => {
    console.log('Callback page mounted');
    console.log('Current URL:', window.location.href);
    console.log('URL search params:', Object.fromEntries(new URLSearchParams(window.location.search)));

    try {
      // Get the code from the URL
      const code = new URLSearchParams(window.location.search).get('code');
      if (!code) {
        throw new Error('No auth code received');
      }

      console.log('Exchanging code for session...');
      // Let Supabase handle the PKCE flow
      const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Auth error:', error);
        goto('/login?error=' + encodeURIComponent(error.message));
        return;
      }

      if (!session) {
        console.error('No session in response');
        goto('/login?error=' + encodeURIComponent('No session established'));
        return;
      }

      console.log('Session established successfully');
      console.log('Session details:', {
        user: session.user?.email,
        expires_at: session.expires_at,
        access_token_length: session.access_token.length,
        refresh_token_length: session.refresh_token?.length
      });

      // Wait a moment to ensure the session is properly set
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Redirect to home page
      goto('/');
    } catch (e) {
      console.error('Unexpected error:', e);
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