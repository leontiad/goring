<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import '../app.css';

  onMount(async () => {
    if (!browser) return;
    
    console.log('Layout mounted, checking initial session...');
    
    // Check if we're on the callback route
    const isCallbackRoute = window.location.pathname.startsWith('/auth/callback');
    if (isCallbackRoute) {
      console.log('On callback route, skipping initial session check');
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      console.log('Initial session found:', {
        user: session.user?.email,
        expires_at: session.expires_at
      });
    } else {
      console.log('No initial session found');
    }
  });

  if (browser) {
    supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', { 
        event, 
        hasSession: !!session, 
        path: window.location.pathname, 
        search: window.location.search 
      });
      
      // Check if we're on the callback route
      const isCallbackRoute = window.location.pathname.startsWith('/auth/callback');
      if (isCallbackRoute) {
        console.log('On callback route, skipping auth state change handling');
        return;
      }

      if (event === 'SIGNED_IN' && session) {
        console.log('Session details on change:', {
          access_token: session.access_token.substring(0, 10) + '...',
          expires_at: session.expires_at,
          user: session.user?.email
        });
        console.log('User signed in, redirecting to home');
        goto('/');
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out, redirecting to login');
        goto('/login');
      }
    });
  }
</script>

<slot />

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  }
</style> 