<script lang="ts">
  import { fade } from 'svelte/transition';
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { debounce } from '$lib/utils';

  export let username: string;
  export let onSelect: (username: string) => void;
  export let suggestions: { login: string; avatar_url: string }[] = [];
  export let isLoading = false;
  export let showDropdown = false;

  let dropdownRef: HTMLDivElement;

  // Close dropdown when clicking outside
  function handleClickOutside(event: MouseEvent) {
    if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
      showDropdown = false;
    }
  }

  onMount(() => {
    if (browser) {
      document.addEventListener('click', handleClickOutside);
    }
  });

  onDestroy(() => {
    if (browser) {
      document.removeEventListener('click', handleClickOutside);
    }
  });
</script>

{#if browser && showDropdown && (suggestions.length > 0 || isLoading)}
  <div 
    class="autocomplete-dropdown" 
    bind:this={dropdownRef}
    in:fade={{ duration: 150 }}
  >
    {#if isLoading}
      <div class="loading-item">
        <div class="spinner"></div>
        <span>Searching...</span>
      </div>
    {:else}
      {#each suggestions as suggestion}
        <button 
          class="suggestion-item"
          on:click={() => {
            onSelect(suggestion.login);
            showDropdown = false;
          }}
        >
          <img 
            src={suggestion.avatar_url} 
            alt={suggestion.login}
            width="24"
            height="24"
            class="avatar"
          />
          <span class="username">{suggestion.login}</span>
        </button>
      {/each}
    {/if}
  </div>
{/if}

<style>
  .autocomplete-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--background);
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    margin-top: 0.5rem;
    max-height: 300px;
    overflow-y: auto;
    z-index: 1000;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }

  .suggestion-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    width: 100%;
    text-align: left;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text);
    transition: background-color 0.2s ease;
  }

  .suggestion-item:hover {
    background: var(--background-secondary);
  }

  .avatar {
    border-radius: 50%;
  }

  .username {
    font-size: 0.875rem;
  }

  .loading-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    color: var(--text-secondary);
    font-size: 0.875rem;
  }

  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid var(--border);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style> 