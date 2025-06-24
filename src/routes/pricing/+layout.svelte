<script>
  import Layout from '$lib/components/Layout.svelte';
  import LoginModal from '$lib/components/LoginModal.svelte';
  import { onMount } from 'svelte';

  let showLoginModal = false;

  onMount(() => {
    // Listen for login modal requests from navigation
    window.addEventListener('showLoginModal', () => {
      showLoginModal = true;
    });
  });

  function closeLoginModal() {
    showLoginModal = false;
  }
</script>
 
<Layout>
  <slot />
</Layout>

<LoginModal show={showLoginModal} onClose={closeLoginModal} redirectTo="/pricing" /> 