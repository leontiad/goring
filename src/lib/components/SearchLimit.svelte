<script lang="ts">
    import { onMount } from 'svelte';
    import type { User } from '@supabase/supabase-js';

    export let user: User | null = null;

    let remainingSearches = 2;
    let limit = 2;
    let loading = false;
    let error = '';
    let showLimitReached = false;

    async function checkSearchLimit() {
        if (!user) return;
        
        try {
            loading = true;
            error = '';
            
            const response = await fetch('/api/search-limit');
            const data = await response.json();
            
            if (response.ok) {
                remainingSearches = data.remainingSearches;
                limit = data.limit;
                showLimitReached = remainingSearches === 0;
            } else {
                // If database functions don't exist yet, assume user can search
                remainingSearches = 2;
                showLimitReached = false;
            }
        } catch (err) {
            console.error('Error checking search limit:', err);
            // If there's an error, assume user can search
            remainingSearches = 2;
            showLimitReached = false;
        } finally {
            loading = false;
        }
    }

    onMount(() => {
        if (user) {
            checkSearchLimit();
        }
    });

    // Watch for user changes
    $: if (user) {
        checkSearchLimit();
    }
</script>

{#if user && showLimitReached}
    <div class="search-limit-container">
        <div class="search-info">
            <div class="remaining">
                <span class="count exhausted">0</span>
                <span class="label">searches remaining</span>
            </div>
            <div class="limit-info">
                Limit: {limit} per 24 hours
            </div>
            <div class="limit-reached">
                You've reached your daily search limit. Try again tomorrow!
            </div>
        </div>
    </div>
{/if}

<style>
    .search-limit-container {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 20px;
        color: white;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .search-info {
        text-align: center;
    }

    .remaining {
        display: flex;
        align-items: baseline;
        justify-content: center;
        gap: 8px;
        margin-bottom: 8px;
    }

    .count {
        font-size: 2.5rem;
        font-weight: bold;
        line-height: 1;
    }

    .count.exhausted {
        color: #ff6b6b;
    }

    .label {
        font-size: 1rem;
        opacity: 0.9;
    }

    .limit-info {
        font-size: 0.9rem;
        opacity: 0.8;
        margin-bottom: 8px;
    }

    .limit-reached {
        background: rgba(255, 107, 107, 0.2);
        border: 1px solid rgba(255, 107, 107, 0.3);
        border-radius: 8px;
        padding: 12px;
        margin-top: 12px;
        font-size: 0.9rem;
        font-weight: 500;
    }
</style> 