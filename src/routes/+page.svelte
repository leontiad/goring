<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { createClient } from '$lib/supabase/client';
  import type { GitHubScore } from '$lib/types';
  import ScoreBreakdown from '$lib/components/ScoreBreakdown.svelte';
  import Layout from '$lib/components/Layout.svelte';
  import UserStats from '$lib/components/UserStats.svelte';
  import { endpoints } from '$lib/config';
  import { page } from '$app/stores';
  import { debounce } from '$lib/utils';
  import type { PageData } from './$types';
  import LoginModal from '$lib/components/LoginModal.svelte';

  export let data: PageData;

  let username = '';
  let usernames = '';
  let loading = false;
  let error: string | null = null;
  let score: GitHubScore | null = null;
  let comparisonScores: GitHubScore[] = [];
  let rating: string | null = null;
  let suggestions: { login: string; avatar_url: string }[] = [];
  let showDropdown = false;

  // Login modal state
  let showLoginModal = false;
  
  const supabase = createClient();

  interface GitHubProfile {
    company: string | null;
    blog: string | null;
    location: string | null;
    email: string | null;
    hireable: boolean | null;
    bio: string | null;
    twitter_username: string | null;
    name: string | null;
  }

  let profileInfo: GitHubProfile | null = null;
  
  onMount(() => {
    console.log('Home page mounted');
    console.log('Session:', $page.data.session);
    
    // Check for error in URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const urlError = urlParams.get('error');
    if (urlError) {
      showLoginModal = true;
      // Clear the error from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Listen for login modal requests from navigation
    window.addEventListener('showLoginModal', () => {
      showLoginModal = true;
    });
  });

  function handleTryItNow() {
    if (data.session) {
      goto('/dashboard');
    } else {
      showLoginModal = true;
    }
  }

  async function searchUsers(query: string) {
    if (query.length < 2) {
      suggestions = [];
      return;
    }

    try {
      const response = await fetch(`https://api.github.com/search/users?q=${query}&per_page=5`);
      if (response.ok) {
        const data = await response.json();
        suggestions = data.items;
      }
    } catch (error) {
      console.error('Failed to fetch user suggestions:', error);
    }
  }

  const debouncedSearch = debounce(searchUsers, 300);

  function handleInput(event: Event) {
    const input = event.target as HTMLInputElement;
    username = input.value;
    showDropdown = true;
    debouncedSearch(username);
  }

  function handleSelect(selectedUsername: string) {
    username = selectedUsername;
    showDropdown = false;
    handleSubmit();
  }

  async function handleSubmit() {
    if (!username) return;

    loading = true;
    error = null;
    showDropdown = false;

    try {
      const response = await fetch(`https://goring-hg3o.shuttle.app/api/score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username })
      });

      if (response.ok) {
        const data = await response.json();
        score = {
          username: username,
          rating: data.rating,
          final_score: data.score.final_score * 100,
          contribution_score: data.score.component_scores.contribution_weight * 100,
          repository_significance: data.score.component_scores.repo_significance * 100,
          code_quality: data.score.component_scores.code_quality * 100,
          community_engagement: data.score.component_scores.community_engagement * 100
        };

        try {
          const profileResponse = await fetch(`https://api.github.com/users/${username}`);
          if (profileResponse.ok) {
            profileInfo = await profileResponse.json();
          } else if (profileResponse.status === 403) {
            console.warn('GitHub API rate limit exceeded');
            profileInfo = null;
          } else {
            console.warn('Failed to fetch GitHub profile');
            profileInfo = null;
          }
        } catch (profileError) {
          console.error('Error fetching GitHub profile:', profileError);
          profileInfo = null;
        }
      } else {
        const errorData = await response.json();
        error = errorData.error || 'Failed to fetch score';
        score = null;
        profileInfo = null;
      }
    } catch (err) {
      error = 'An error occurred while fetching the score';
      score = null;
      profileInfo = null;
    } finally {
      loading = false;
    }
  }
  
  async function compareUsers() {
    if (!usernames) return;
    
    loading = true;
    error = '';
    comparisonScores = [];
    
    try {
      const usernamesList = usernames.split(',').map(u => u.trim()).filter(Boolean);
      const scores = await Promise.all(
        usernamesList.map(async (username) => {
          const response = await fetch(`${endpoints.score}/${username}`);
          if (!response.ok) {
            throw new Error(`Failed to fetch score for ${username}`);
          }
          return response.json();
        })
      );
      comparisonScores = scores;
    } catch (e: unknown) {
      error = e instanceof Error ? e.message : 'An unknown error occurred';
    } finally {
      loading = false;
    }
  }

  function closeLoginModal() {
    showLoginModal = false;
  }
</script>

<Layout>
  <div class="page">
    <section id="hero" class="hero-section">
      <div class="hero-content">
        <h1>GitHub Score</h1>
        <p class="subtitle">The intelligent way to evaluate developer profiles</p>
        <div class="cta-buttons">
          <button on:click={handleTryItNow} class="primary-button">Try It Now</button>
          <a href="/pricing" class="secondary-button">View Pricing</a>
        </div>
      </div>
    </section>

    <section id="problem" class="problem-section">
      <div class="section-content">
        <h2>The Problem</h2>
        <div class="problem-cards">
          <div class="problem-card">
            <div class="icon">⏰</div>
            <h3>Wasted Time</h3>
            <p>Recruiters spend hours manually analyzing GitHub profiles, often missing key indicators of developer quality.</p>
          </div>
          <div class="problem-card">
            <div class="icon">📊</div>
            <h3>Inconsistent Evaluation</h3>
            <p>Different recruiters evaluate profiles differently, leading to biased and inconsistent hiring decisions.</p>
          </div>
          <div class="problem-card">
            <div class="icon">🎯</div>
            <h3>Irrelevant Interviews</h3>
            <p>Developers waste time in interviews that don't match their actual skill level or experience.</p>
          </div>
        </div>
      </div>
    </section>

    <section id="solution" class="solution-section">
      <div class="section-content">
        <h2>The Solution</h2>
        <div class="solution-grid">
          <div class="visual-card">
            <h4>Code Quality</h4>
            <p>Analyzes code complexity, documentation, and best practices to assess technical proficiency.</p>
          </div>
          <div class="visual-card">
            <h4>Repository Impact</h4>
            <p>Evaluates project significance through stars, forks, and community engagement.</p>
          </div>
          <div class="visual-card">
            <h4>Contribution Patterns</h4>
            <p>Examines commit frequency, PR quality, and issue resolution efficiency.</p>
          </div>
          <div class="visual-card">
            <h4>Community Engagement</h4>
            <p>Measures collaboration through discussions, reviews, and open source contributions.</p>
          </div>
        </div>
      </div>
    </section>

    <section id="features" class="features-section">
      <div class="section-content">
        <h2>Key Features</h2>
        <div class="features-grid">
          <div class="feature-card">
            <div class="icon">🔍</div>
            <h3>Comprehensive Analysis</h3>
            <p>Deep dive into code quality, contribution patterns, and community impact.</p>
          </div>
          <div class="feature-card">
            <div class="icon">⚡</div>
            <h3>Instant Results</h3>
            <p>Get detailed scores and insights in seconds, not hours.</p>
          </div>
          <div class="feature-card">
            <div class="icon">📈</div>
            <h3>Comparative Analysis</h3>
            <p>Compare multiple profiles side by side to make informed decisions.</p>
          </div>
          <div class="feature-card">
            <div class="icon">🔄</div>
            <h3>Real-time Updates</h3>
            <p>Scores update automatically as developers contribute to GitHub.</p>
          </div>
        </div>
      </div>
    </section>

    {#if score}
      <section class="score-section">
        <div class="score-header">
          <h2>{score.username}</h2>
          <div class="rating">{score.rating}</div>
        </div>

        {#if profileInfo}
          <div class="profile-info">
            {#if profileInfo.name}
              <div class="name">{profileInfo.name}</div>
            {/if}
            {#if profileInfo.bio}
              <div class="bio">{profileInfo.bio}</div>
            {/if}
            <div class="info-grid">
              {#if profileInfo.company}
                <div class="info-item">
                  <span class="label">Company</span>
                  <span class="value">{profileInfo.company}</span>
                </div>
              {/if}
              {#if profileInfo.location}
                <div class="info-item">
                  <span class="label">Location</span>
                  <span class="value">{profileInfo.location}</span>
                </div>
              {/if}
              {#if profileInfo.blog}
                <div class="info-item">
                  <span class="label">Website</span>
                  <a href={profileInfo.blog} target="_blank" rel="noopener noreferrer" class="value link">
                    {profileInfo.blog}
                  </a>
                </div>
              {/if}
              {#if profileInfo.email}
                <div class="info-item">
                  <span class="label">Email</span>
                  <a href="mailto:{profileInfo.email}" class="value link">
                    {profileInfo.email}
                  </a>
                </div>
              {/if}
              {#if profileInfo.twitter_username}
                <div class="info-item">
                  <span class="label">Twitter</span>
                  <a 
                    href="https://twitter.com/{profileInfo.twitter_username}" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    class="value link"
                  >
                    @{profileInfo.twitter_username}
                  </a>
                </div>
              {/if}
              {#if profileInfo.hireable}
                <div class="info-item">
                  <span class="label">Status</span>
                  <span class="value available">Available for hire</span>
                </div>
              {/if}
            </div>
          </div>
        {/if}

        <div class="final-score">
          <div class="score-label">Final Score</div>
          <div class="score-value">{score.final_score.toFixed(2)}%</div>
        </div>
        <ScoreBreakdown {score} />
        <UserStats {score} />
      </section>
    {/if}
  </div>

  <!-- Login Modal -->
  <LoginModal show={showLoginModal} onClose={closeLoginModal} redirectTo="/dashboard" />
</Layout>

<style>
  .page {
    overflow-x: hidden;
  }

  section {
    min-height: 80vh;
    padding: 4rem 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    position: relative;
    overflow: hidden;
  }

  .hero {
    min-height: 100vh;
    padding: 6rem 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    position: relative;
    overflow: hidden;
  }

  .problem {
    min-height: 100vh;
    padding: 6rem 2rem;
    background: var(--background);
  }

  .solution {
    min-height: 100vh;
    padding: 6rem 2rem;
    background: var(--background);
  }

  .features {
    min-height: 100vh;
    padding: 6rem 2rem;
    background: var(--background);
  }

  .section-content {
    max-width: 1200px;
    width: 100%;
    margin: 0 auto;
  }

  .hero-section {
    background: linear-gradient(135deg, var(--background) 0%, var(--background-secondary) 100%);
    text-align: center;
    min-height: 80vh;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .hero-content {
    max-width: 800px;
    margin: 0 auto;
  }

  h1 {
    font-size: 4rem;
    font-weight: 700;
    background: linear-gradient(135deg, #ffffff, #a0a0a0);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 1.5rem;
  }

  .subtitle {
    font-size: 1.5rem;
    color: var(--text-secondary);
    margin-bottom: 2rem;
  }

  .cta-buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
  }

  .primary-button, .secondary-button {
    padding: 1rem 2rem;
    border-radius: 0.5rem;
    font-size: 1rem;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.2s ease;
  }

  .primary-button {
    background: var(--accent);
    color: white;
    border: none;
    cursor: pointer;
  }

  .primary-button:hover {
    background: var(--accent-hover);
    transform: translateY(-2px);
  }

  .secondary-button {
    background: transparent;
    color: var(--text);
    border: 1px solid var(--border);
  }

  .secondary-button:hover {
    background: var(--background-secondary);
    transform: translateY(-2px);
  }

  .problem-section {
    background: var(--background);
    min-height: 80vh;
  }

  .problem-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
    margin-top: 2rem;
  }

  .problem-card {
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: 1rem;
    padding: 2rem;
    transition: all 0.2s ease;
  }

  .problem-card:hover {
    transform: translateY(-5px);
    box-shadow: var(--shadow-lg);
  }

  .icon {
    font-size: 2.5rem;
    margin-bottom: 1rem;
  }

  .solution-section {
    background: var(--background);
    min-height: 80vh;
  }

  .solution-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 2rem;
    margin-top: 2rem;
    max-width: 1000px;
    margin: 2rem auto 0;
  }

  .visual-card {
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: 1rem;
    padding: 2rem;
    text-align: left;
    transition: all 0.2s ease;
  }

  .visual-card:hover {
    transform: translateY(-5px);
    box-shadow: var(--shadow-lg);
  }

  .visual-card h4 {
    color: var(--accent);
    margin-bottom: 1rem;
    font-size: 1.25rem;
  }

  .visual-card p {
    color: var(--text-secondary);
    font-size: 1rem;
    line-height: 1.6;
  }

  .features-section {
    background: var(--background);
    min-height: 80vh;
  }

  .features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-top: 2rem;
  }

  .feature-card {
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: 1rem;
    padding: 2rem;
    text-align: center;
    transition: all 0.2s ease;
  }

  .feature-card:hover {
    transform: translateY(-5px);
    box-shadow: var(--shadow-lg);
  }

  @media (max-width: 768px) {
    section {
      padding: 2rem 1rem;
    }

    .hero-section {
      min-height: 70vh;
    }

    h1 {
      font-size: 2.5rem;
    }

    .subtitle {
      font-size: 1.25rem;
    }

    .solution-grid {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }
  }

  .search-container {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
    position: relative;
  }

  input {
    flex: 1;
    padding: 1rem;
    border-radius: 0.5rem;
    border: 1px solid var(--border);
    background: var(--background);
    color: var(--text);
    font-size: 1rem;
  }

  input:focus {
    outline: none;
    border-color: var(--accent);
  }

  button {
    padding: 1rem 2rem;
    border-radius: 0.5rem;
    border: none;
    background: var(--accent);
    color: white;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  button:hover {
    background: var(--accent-hover);
    transform: translateY(-2px);
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .error-message {
    color: #ef4444;
    margin-top: 1rem;
  }

  /* Login Modal Styles */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(4px);
  }

  .login-modal {
    background: white;
    border-radius: 16px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
    max-width: 400px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
  }

  .login-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px 24px 0 24px;
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 16px;
  }

  .login-header h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: #1f2937;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 24px;
    color: #6b7280;
    cursor: pointer;
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.2s ease;
  }

  .close-btn:hover {
    background: #f3f4f6;
    color: #374151;
    transform: none;
  }

  .login-content {
    padding: 24px;
  }

  .login-content > p {
    margin: 0 0 24px 0;
    color: #6b7280;
    font-size: 14px;
    text-align: center;
  }

  .google-signin-btn {
    width: 100%;
    padding: 12px 24px;
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 500;
    color: #374151;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-bottom: 24px;
  }

  .google-signin-btn:hover:not(:disabled) {
    border-color: #cbd5e0;
    background: #f7fafc;
    transform: none;
  }

  .google-signin-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .google-icon {
    width: 20px;
    height: 20px;
  }

  .spinner {
    width: 20px;
    height: 20px;
    border: 2px solid #e2e8f0;
    border-top: 2px solid #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .terms p {
    margin: 0;
    font-size: 12px;
    color: #9ca3af;
    line-height: 1.4;
    text-align: center;
  }

  @media (max-width: 480px) {
    .login-modal {
      width: 95%;
      margin: 20px;
    }
    
    .login-header,
    .login-content {
      padding: 20px;
    }
  }
</style>