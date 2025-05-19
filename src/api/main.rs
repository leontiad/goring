use axum::{
    routing::post,
    Router,
    Json,
    extract::State,
    http::StatusCode,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tower_http::cors::{CorsLayer, Any};
use github_score_api::scoring::{GitHubScorer, GitHubUser, DetailedScores};
use reqwest;
use serde_json::Value;
use tokio::net::TcpListener;
use std::collections::HashMap;
use std::env;
use github_score_api::db::{Database, models::{CachedUser, CachedScore}};
use chrono::Utc;

#[derive(Clone)]
struct AppState {
    scorer: Arc<GitHubScorer>,
    client: Arc<reqwest::Client>,
    db: Arc<Database>,
}

#[derive(Debug, Deserialize)]
struct ScoreRequest {
    username: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct ScoreResponse {
    score: DetailedScores,
    rating: String,
    stats: UserStats,
    activity: ActivityData,
    languages: LanguageDistribution,
}

#[derive(Debug, Serialize, Deserialize)]
struct UserStats {
    total_repositories: usize,
    total_stars: usize,
    total_forks: usize,
    total_contributions: usize,
}

#[derive(Debug, Serialize, Deserialize)]
struct ActivityData {
    commits_last_month: usize,
    pull_requests_last_month: usize,
    issues_last_month: usize,
    activity_trend: Vec<ActivityPoint>,
}

#[derive(Debug, Serialize, Deserialize)]
struct ActivityPoint {
    date: String,
    commits: usize,
    pull_requests: usize,
    issues: usize,
}

#[derive(Debug, Serialize, Deserialize)]
struct LanguageDistribution {
    languages: HashMap<String, f64>,
}

#[derive(Debug, Serialize)]
struct GitHubError {
    message: String,
}

#[derive(Debug, Deserialize)]
struct GitHubRateLimitError {
    message: String,
    #[allow(dead_code)]
    documentation_url: Option<String>,
}

async fn handle_github_response<T: for<'de> serde::Deserialize<'de>>(
    response: reqwest::Response,
) -> Result<T, (StatusCode, Json<GitHubError>)> {
    let status = response.status();
    let text = response.text().await.map_err(|e| (
        StatusCode::INTERNAL_SERVER_ERROR,
        Json(GitHubError { message: format!("Failed to read response: {}", e) })
    ))?;

    if !status.is_success() {
        // Try to parse as GitHub error response
        if let Ok(error) = serde_json::from_str::<GitHubRateLimitError>(&text) {
            return Err((
                StatusCode::from_u16(status.as_u16()).unwrap_or(StatusCode::INTERNAL_SERVER_ERROR),
                Json(GitHubError { 
                    message: format!("GitHub API error: {}", error.message) 
                })
            ));
        }
        return Err((
            StatusCode::from_u16(status.as_u16()).unwrap_or(StatusCode::INTERNAL_SERVER_ERROR),
            Json(GitHubError { 
                message: format!("GitHub API error: {}", text) 
            })
        ));
    }

    serde_json::from_str(&text).map_err(|e| (
        StatusCode::INTERNAL_SERVER_ERROR,
        Json(GitHubError { 
            message: format!("Failed to parse response: {}", e) 
        })
    ))
}

#[tokio::main]
async fn main() {
    // Initialize database
    let db = Database::new().await.expect("Failed to initialize database");
    
    // Get GitHub token from environment variable
    let github_token = env::var("GITHUB_TOKEN").unwrap_or_else(|_| {
        println!("Warning: GITHUB_TOKEN not set. Using unauthenticated requests (rate limited).");
        String::new()
    });

    let mut headers = reqwest::header::HeaderMap::new();
    headers.insert(
        reqwest::header::USER_AGENT,
        "github-score-api".parse().unwrap()
    );

    if !github_token.is_empty() {
        headers.insert(
            reqwest::header::AUTHORIZATION,
            format!("Bearer {}", github_token).parse().unwrap()
        );
    }

    let state = AppState {
        scorer: Arc::new(GitHubScorer::new()),
        client: Arc::new(reqwest::Client::builder()
            .default_headers(headers)
            .build()
            .unwrap()),
        db: Arc::new(db),
    };

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/api/score", post(score_user))
        .layer(cors)
        .with_state(state);

    println!("Server running on http://localhost:3001");
    
    let listener = TcpListener::bind("0.0.0.0:3001").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn score_user(
    State(state): State<AppState>,
    Json(payload): Json<ScoreRequest>,
) -> Result<Json<ScoreResponse>, (StatusCode, Json<GitHubError>)> {
    println!("Received request for username: {}", payload.username);

    // Check cache first
    match state.db.get_cached_score(&payload.username).await {
        Ok(Some(cached_score)) => {
            println!("Found cached score for user: {} (last updated: {})", 
                payload.username, 
                cached_score.last_updated
            );
            return Ok(Json(ScoreResponse {
                score: serde_json::from_value(cached_score.score)
                    .map_err(|e| (
                        StatusCode::INTERNAL_SERVER_ERROR,
                        Json(GitHubError { message: format!("Failed to parse cached score: {}", e) })
                    ))?,
                rating: cached_score.rating,
                stats: serde_json::from_value(cached_score.stats)
                    .map_err(|e| (
                        StatusCode::INTERNAL_SERVER_ERROR,
                        Json(GitHubError { message: format!("Failed to parse cached stats: {}", e) })
                    ))?,
                activity: serde_json::from_value(cached_score.activity)
                    .map_err(|e| (
                        StatusCode::INTERNAL_SERVER_ERROR,
                        Json(GitHubError { message: format!("Failed to parse cached activity: {}", e) })
                    ))?,
                languages: serde_json::from_value(cached_score.languages)
                    .map_err(|e| (
                        StatusCode::INTERNAL_SERVER_ERROR,
                        Json(GitHubError { message: format!("Failed to parse cached languages: {}", e) })
                    ))?,
            }));
        }
        Ok(None) => {
            println!("No cached score found for user: {}", payload.username);
        }
        Err(e) => {
            println!("Error checking cache for user {}: {}", payload.username, e);
        }
    }

    // Check if we have cached user data
    let (_user_data, all_repos, events, pulls) = match state.db.get_cached_user(&payload.username).await {
        Ok(Some(cached_user)) => {
            println!("Found cached user data for: {} (last updated: {})", 
                payload.username, 
                cached_user.last_updated
            );
            (
                cached_user.user_data,
                cached_user.repositories,
                cached_user.events,
                cached_user.pull_requests,
            )
        }
        Ok(None) => {
            println!("No cached user data found for: {}", payload.username);
            // Fetch fresh data from GitHub
            let user_url = format!("https://api.github.com/users/{}", payload.username);
            println!("Fetching user data from: {}", user_url);
            
            let user_response = state.client
                .get(&user_url)
                .send()
                .await
                .map_err(|e| {
                    println!("Error fetching user data: {}", e);
                    (
                        StatusCode::INTERNAL_SERVER_ERROR,
                        Json(GitHubError { message: format!("Failed to fetch user data: {}", e) })
                    )
                })?;

            println!("User response status: {}", user_response.status());

            let user_data: Value = handle_github_response(user_response).await?;
            println!("Successfully fetched user data");

            // Fetch repositories with pagination
            let mut all_repos = Vec::new();
            let mut page = 1;
            loop {
                let repos_url = format!("https://api.github.com/users/{}/repos?per_page=100&page={}", payload.username, page);
                println!("Fetching repositories from: {}", repos_url);
                
                let repos_response = state.client
                    .get(&repos_url)
                    .send()
                    .await
                    .map_err(|e| {
                        println!("Error fetching repositories: {}", e);
                        (
                            StatusCode::INTERNAL_SERVER_ERROR,
                            Json(GitHubError { message: format!("Failed to fetch repositories: {}", e) })
                        )
                    })?;

                println!("Repos response status: {}", repos_response.status());

                let repos: Vec<Value> = handle_github_response(repos_response).await?;
                println!("Successfully fetched {} repositories from page {}", repos.len(), page);
                
                if repos.is_empty() {
                    break;
                }
                
                all_repos.extend(repos);
                page += 1;
            }
            println!("Total repositories fetched: {}", all_repos.len());

            // Fetch events
            let events_url = format!("https://api.github.com/users/{}/events?per_page=100", payload.username);
            println!("Fetching events from: {}", events_url);
            
            let events_response = state.client
                .get(&events_url)
                .send()
                .await
                .map_err(|e| {
                    println!("Error fetching events: {}", e);
                    (
                        StatusCode::INTERNAL_SERVER_ERROR,
                        Json(GitHubError { message: format!("Failed to fetch events: {}", e) })
                    )
                })?;

            println!("Events response status: {}", events_response.status());

            let events: Vec<Value> = handle_github_response(events_response).await?;
            println!("Successfully fetched {} events", events.len());

            // Fetch pull requests for first 10 repos
            let mut pulls = Vec::new();
            for repo in all_repos.iter().take(10) {
                if let Some(full_name) = repo["full_name"].as_str() {
                    let pr_url = format!(
                        "https://api.github.com/repos/{}/pulls?state=all&creator={}",
                        full_name, payload.username
                    );
                    println!("Fetching PRs from: {}", pr_url);
                    
                    if let Ok(pr_response) = state.client
                        .get(&pr_url)
                        .send()
                        .await 
                    {
                        println!("PR response status: {}", pr_response.status());
                        if let Ok(prs_json) = handle_github_response::<Vec<Value>>(pr_response).await {
                            let pr_count = prs_json.len();
                            pulls.extend(prs_json);
                            println!("Successfully fetched {} PRs from {}", pr_count, full_name);
                        }
                    }
                }
            }

            // Cache the user data
            let cached_user = CachedUser {
                username: payload.username.clone(),
                user_data: user_data.clone(),
                repositories: all_repos.clone(),
                events: events.clone(),
                pull_requests: pulls.clone(),
                last_updated: Utc::now(),
            };
            
            if let Err(e) = state.db.cache_user(&cached_user).await {
                println!("Failed to cache user data: {}", e);
            } else {
                println!("Successfully cached user data for: {}", payload.username);
            }

            (user_data, all_repos, events, pulls)
        }
        Err(e) => {
            println!("Error checking user cache: {}", e);
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(GitHubError { message: format!("Database error: {}", e) })
            ));
        }
    };

    // Calculate repository statistics
    let total_stars: usize = all_repos.iter()
        .map(|repo| repo["stargazers_count"].as_u64().unwrap_or(0) as usize)
        .sum();
    
    let total_forks: usize = all_repos.iter()
        .map(|repo| repo["forks_count"].as_u64().unwrap_or(0) as usize)
        .sum();

    // Calculate activity statistics
    let commits_last_month = events.iter()
        .filter(|e| e["type"] == "PushEvent")
        .count();

    let pull_requests_last_month = events.iter()
        .filter(|e| e["type"] == "PullRequestEvent")
        .count();

    let issues_last_month = events.iter()
        .filter(|e| e["type"] == "IssuesEvent")
        .count();

    // Calculate language distribution
    let mut languages = HashMap::new();
    for repo in &all_repos {
        if let Some(lang) = repo["language"].as_str() {
            *languages.entry(lang.to_string()).or_insert(0.0) += 1.0;
        }
    }
    
    // Normalize language percentages
    let total = languages.values().sum::<f64>();
    if total > 0.0 {
        for value in languages.values_mut() {
            *value = (*value / total) * 100.0;
        }
    }

    // Convert the GitHub API responses to our internal types
    let user = GitHubUser {
        login: payload.username.clone(),
        repositories: all_repos.clone().into_iter()
            .filter_map(|r| serde_json::from_value(r).ok())
            .collect(),
        events: events.clone().into_iter()
            .filter_map(|e| serde_json::from_value(e).ok())
            .collect(),
        pull_requests: pulls.into_iter()
            .filter_map(|p| serde_json::from_value(p).ok())
            .collect(),
    };

    println!("Calculating score for user: {}", user.login);

    // Calculate score
    let score = state.scorer.calculate_score(&user)
        .map_err(|e| {
            println!("Error calculating score: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(GitHubError { message: format!("Failed to calculate score: {}", e) })
            )
        })?;
    
    let rating = state.scorer.rate_score(score.final_score);
    println!("Score calculated successfully. Rating: {}", rating);

    // Prepare activity trend data (last 7 days)
    let mut activity_trend = Vec::new();
    for i in 0..7 {
        let date = chrono::Utc::now() - chrono::Duration::days(i);
        let date_str = date.format("%Y-%m-%d").to_string();
        
        let day_events = events.iter()
            .filter(|e| e["created_at"].as_str().unwrap_or("").starts_with(&date_str))
            .collect::<Vec<_>>();

        activity_trend.push(ActivityPoint {
            date: date_str,
            commits: day_events.iter()
                .filter(|e| e["type"] == "PushEvent")
                .count(),
            pull_requests: day_events.iter()
                .filter(|e| e["type"] == "PullRequestEvent")
                .count(),
            issues: day_events.iter()
                .filter(|e| e["type"] == "IssuesEvent")
                .count(),
        });
    }

    let response = ScoreResponse {
        score: score.clone(),
        rating: rating.to_string(),
        stats: UserStats {
            total_repositories: all_repos.len(),
            total_stars,
            total_forks,
            total_contributions: events.len(),
        },
        activity: ActivityData {
            commits_last_month,
            pull_requests_last_month,
            issues_last_month,
            activity_trend,
        },
        languages: LanguageDistribution {
            languages,
        },
    };

    // Cache the score
    let cached_score = CachedScore {
        username: payload.username.clone(),
        score: serde_json::to_value(&score).unwrap(),
        rating: rating.to_string(),
        stats: serde_json::to_value(&response.stats).unwrap(),
        activity: serde_json::to_value(&response.activity).unwrap(),
        languages: serde_json::to_value(&response.languages).unwrap(),
        last_updated: Utc::now(),
    };

    if let Err(e) = state.db.cache_score(&cached_score).await {
        println!("Failed to cache score: {}", e);
    } else {
        println!("Successfully cached score for: {}", payload.username);
    }

    Ok(Json(response))
} 