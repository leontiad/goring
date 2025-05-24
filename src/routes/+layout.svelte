<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import '../app.css';

  onMount(() => {
    if (!browser) return;

    console.log('Layout mounted, checking initial session...');
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session ? 'present' : 'missing');
      if (session) {
        console.log('Session details:', {
          access_token: session.access_token.substring(0, 10) + '...',
          expires_at: new Date(session.expires_at! * 1000).toISOString(),
          user: session.user.email
        });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', {
        event,
        hasSession: !!session,
        path: window.location.pathname,
        search: window.location.search
      });
      
      if (session) {
        console.log('Session details on change:', {
          access_token: session.access_token.substring(0, 10) + '...',
          expires_at: new Date(session.expires_at! * 1000).toISOString(),
          user: session.user.email
        });
      }
      
      if (event === 'SIGNED_IN') {
        console.log('User signed in, redirecting to home');
        goto('/');
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out, redirecting to login');
        goto('/login');
      }
    });

    return () => {
      console.log('Unsubscribing from auth state changes');
      subscription.unsubscribe();
    };
  });
</script>

<slot />

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  }
</style> 