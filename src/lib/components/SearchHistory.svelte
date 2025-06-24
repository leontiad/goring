<script lang="ts">
    import { onMount } from 'svelte';
    import type { User } from '@supabase/supabase-js';

    export let user: User | null = null;

    let searchHistory: Array<{ username: string; search_date: string }> = [];
    let loading = false;
    let hasHistory = false;

    async function loadSearchHistory() {
        if (!user) return;
        
        try {
            loading = true;
            
            const response = await fetch('/api/search-history');
            const data = await response.json();
            
            if (response.ok && data.history && data.history.length > 0) {
                searchHistory = data.history;
                hasHistory = true;
            } else {
                // If database functions don't exist yet or no history, don't show anything
                hasHistory = false;
            }
        } catch (err) {
            console.error('Error loading search history:', err);
            // Don't show error, just don't display history
            hasHistory = false;
        } finally {
            loading = false;
        }
    }

    function formatDate(dateString: string) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    onMount(() => {
        if (user) {
            loadSearchHistory();
        }
    });

    // Watch for user changes
    $: if (user) {
        loadSearchHistory();
    }
</script>

{#if user && hasHistory}
    <div class="search-history-container">
        <h3>Recent Searches</h3>
        <div class="history-list">
            {#each searchHistory as search}
                <div class="history-item">
                    <div class="username">{search.username}</div>
                    <div class="date">{formatDate(search.search_date)}</div>
                </div>
            {/each}
        </div>
    </div>
{/if}

<style>
    .search-history-container {
        background: var(--card-bg);
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 20px;
        box-shadow: var(--shadow-lg);
    }

    h3 {
        margin: 0 0 16px 0;
        color: var(--text);
        font-size: 1.25rem;
        font-weight: 600;
    }

    .history-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .history-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        background: var(--background);
        border-radius: 8px;
        border: 1px solid var(--border);
    }

    .username {
        font-weight: 600;
        color: var(--text);
        font-size: 1rem;
    }

    .date {
        font-size: 0.875rem;
        color: var(--text-secondary);
    }
</style> 