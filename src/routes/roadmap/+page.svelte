<script lang="ts">
  interface RoadmapItem {
    title: string;
    description: string;
    category: 'Backend' | 'Developer' | 'UI' | 'Integration' | 'AI' | 'Default';
    priority?: boolean;
  }

  interface RoadmapSection {
    month: string;
    items: RoadmapItem[];
  }

  const roadmapSections: RoadmapSection[] = [
    {
      month: 'May',
      items: [
        {
          title: 'Settable permissions within object storage by folders',
          description: 'Currently the workspace object storage is all or nothing. You can either see the object explorer or not, and you can either write and read everywhere or not. This would be a settable setting such that the layout within the buckets can follow the standard u/ and f/ layouts and that list, read and write permissions would be inherited from the folder permissions.',
          category: 'Backend'
        }
      ]
    }
    
  ];

  const categoryColors = {
    Backend: 'var(--accent)',
    Developer: 'var(--success)',
    UI: 'var(--warning)',
    Integration: '#8B5CF6',
    AI: '#EC4899',
    Default: 'var(--text-secondary)'
  };
</script>

<div class="roadmap">
  <div class="header">
    <h1>Roadmap</h1>
    <p class="subtitle">This roadmap sets out the main features we want to release. To see the latest releases, check our Changelog and to see all feature requests, visit our GitHub.</p>
  </div>

  <div class="timeline">
    {#each roadmapSections as section}
      <div class="month-section">
        <h2>{section.month}</h2>
        <div class="items">
          {#each section.items as item}
            <div class="item">
              <div class="item-header">
                <h3>{item.title}</h3>
                {#if item.priority}
                  <span class="priority">★</span>
                {/if}
              </div>
              <p class="description">{item.description}</p>
              <div class="category" style="--category-color: {categoryColors[item.category]}">
                {item.category}
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .roadmap {
    max-width: 800px;
    margin: 0 auto;
    padding: var(--spacing-xl) 0;
  }

  .header {
    text-align: center;
    margin-bottom: var(--spacing-xl);
  }

  .header h1 {
    font-size: 2.5rem;
    margin-bottom: var(--spacing-md);
  }

  .subtitle {
    color: var(--text-secondary);
    font-size: 1.125rem;
    max-width: 600px;
    margin: 0 auto;
  }

  .timeline {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xl);
  }

  .month-section h2 {
    font-size: 1.5rem;
    margin-bottom: var(--spacing-lg);
    color: var(--text);
  }

  .items {
    display: grid;
    gap: var(--spacing-lg);
  }

  .item {
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: var(--spacing-lg);
    transition: all 0.2s ease;
  }

  .item:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  .item-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-sm);
  }

  .item-header h3 {
    font-size: 1.25rem;
    margin: 0;
    color: var(--text);
  }

  .priority {
    color: var(--warning);
    font-size: 1.25rem;
  }

  .description {
    color: var(--text-secondary);
    margin-bottom: var(--spacing-md);
    line-height: 1.6;
  }

  .category {
    display: inline-block;
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--radius-sm);
    font-size: 0.875rem;
    font-weight: 500;
    background: color-mix(in srgb, var(--category-color) 10%, transparent);
    color: var(--category-color);
  }

  @media (max-width: 768px) {
    .roadmap {
      padding: var(--spacing-lg);
    }

    .header h1 {
      font-size: 2rem;
    }

    .subtitle {
      font-size: 1rem;
    }
  }
</style> 