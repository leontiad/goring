<script lang="ts">
  import '../app.css';
  import { createClient } from '$lib/supabase/client';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import type { LayoutData } from './$types';

  export let data: LayoutData;

  const supabase = createClient();

  onMount(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        goto('/dashboard');
      } else if (event === 'SIGNED_OUT') {
        goto('/login');
      }
    });

    return () => subscription.unsubscribe();
  });

  async function signOut() {
    await supabase.auth.signOut();
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