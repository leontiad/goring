use chrono::{DateTime, Duration, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum ScoringError {
    #[error("API request failed: {0}")]
    ApiError(String),
    #[error("Invalid data: {0}")]
    InvalidData(String),
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GitHubUser {
    pub login: String,
    pub repositories: Vec<Repository>,
    pub events: Vec<Event>,
    pub pull_requests: Vec<PullRequest>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Repository {
    pub name: String,
    pub full_name: String,
    pub stargazers_count: u32,
    pub forks_count: u32,
    pub updated_at: DateTime<Utc>,
    pub owner: User,
    pub description: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct User {
    pub login: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Event {
    pub r#type: String,
    pub created_at: DateTime<Utc>,
    pub repo: Option<Repo>,
    pub payload: Option<EventPayload>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Repo {
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EventPayload {
    pub action: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PullRequest {
    pub merged_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ScoreComponents {
    pub contribution_weight: f64,
    pub repo_significance: f64,
    pub code_quality: f64,
    pub community_engagement: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DetailedScores {
    pub final_score: f64,
    pub component_scores: ScoreComponents,
    pub detailed_components: HashMap<String, HashMap<String, f64>>,
}

pub struct GitHubScorer {
    weights: HashMap<String, f64>,
    contribution_params: HashMap<String, f64>,
    repo_significance_params: HashMap<String, f64>,
    code_quality_params: HashMap<String, f64>,
    community_params: HashMap<String, f64>,
    token: Option<String>,
}

impl Default for GitHubScorer {
    fn default() -> Self {
        let mut weights = HashMap::new();
        weights.insert("contribution_weight".to_string(), 0.35);
        weights.insert("repo_significance".to_string(), 0.30);
        weights.insert("code_quality".to_string(), 0.20);
        weights.insert("community_engagement".to_string(), 0.15);

        let mut contribution_params = HashMap::new();
        contribution_params.insert("commit_frequency".to_string(), 0.35);
        contribution_params.insert("commit_recency".to_string(), 0.25);
        contribution_params.insert("issue_resolution".to_string(), 0.20);
        contribution_params.insert("pr_acceptance".to_string(), 0.20);

        let mut repo_significance_params = HashMap::new();
        repo_significance_params.insert("stars".to_string(), 0.30);
        repo_significance_params.insert("forks".to_string(), 0.25);
        repo_significance_params.insert("repo_activity".to_string(), 0.25);
        repo_significance_params.insert("ecosystem_impact".to_string(), 0.20);

        let mut code_quality_params = HashMap::new();
        code_quality_params.insert("code_review_participation".to_string(), 0.30);
        code_quality_params.insert("documentation".to_string(), 0.30);
        code_quality_params.insert("commit_quality".to_string(), 0.40);

        let mut community_params = HashMap::new();
        community_params.insert("discussions".to_string(), 0.30);
        community_params.insert("project_diversity".to_string(), 0.40);
        community_params.insert("maintainer_roles".to_string(), 0.30);

        Self {
            weights,
            contribution_params,
            repo_significance_params,
            code_quality_params,
            community_params,
            token: None,
        }
    }
}

impl GitHubScorer {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn with_token(token: String) -> Self {
        let mut scorer = Self::default();
        scorer.token = Some(token);
        scorer
    }

    pub fn calculate_score(&self, user: &GitHubUser) -> Result<DetailedScores, ScoringError> {
        let contribution_score = self.score_contribution_weight(user)?;
        let repo_score = self.score_repo_significance(user)?;
        let quality_score = self.score_code_quality(user)?;
        let community_score = self.score_community_engagement(user)?;

        let component_scores = ScoreComponents {
            contribution_weight: contribution_score.0,
            repo_significance: repo_score.0,
            code_quality: quality_score.0,
            community_engagement: community_score.0,
        };

        let mut detailed_components = HashMap::new();
        detailed_components.insert("contribution_weight".to_string(), contribution_score.1);
        detailed_components.insert("repo_significance".to_string(), repo_score.1);
        detailed_components.insert("code_quality".to_string(), quality_score.1);
        detailed_components.insert("community_engagement".to_string(), community_score.1);

        let final_score = self.weights.iter().fold(0.0, |acc, (key, weight)| {
            acc + weight * match key.as_str() {
                "contribution_weight" => contribution_score.0,
                "repo_significance" => repo_score.0,
                "code_quality" => quality_score.0,
                "community_engagement" => community_score.0,
                _ => 0.0,
            }
        });

        Ok(DetailedScores {
            final_score,
            component_scores,
            detailed_components,
        })
    }

    fn score_contribution_weight(&self, user: &GitHubUser) -> Result<(f64, HashMap<String, f64>), ScoringError> {
        let now = Utc::now();
        let six_months_ago = now - Duration::days(180);

        let commit_events: Vec<&Event> = user.events
            .iter()
            .filter(|e| e.r#type == "PushEvent")
            .collect();

        let recent_commits: Vec<&Event> = commit_events
            .iter()
            .filter(|e| e.created_at > six_months_ago)
            .copied()
            .collect();

        let commit_frequency = (recent_commits.len() as f64 / 100.0).min(1.0);

        let recency_score = if !recent_commits.is_empty() {
            let days_ago: Vec<i64> = recent_commits
                .iter()
                .map(|e| (now - e.created_at).num_days())
                .collect();
            let avg_days = days_ago.iter().sum::<i64>() as f64 / days_ago.len() as f64;
            1.0 - (avg_days / 180.0).min(1.0)
        } else {
            0.0
        };

        let issue_events: Vec<&Event> = user.events
            .iter()
            .filter(|e| e.r#type == "IssuesEvent" && 
                e.payload.as_ref().map_or(false, |p| p.action.as_deref() == Some("closed")))
            .collect();

        let total_issues = user.events
            .iter()
            .filter(|e| e.r#type == "IssuesEvent")
            .count();

        let issue_resolution = if total_issues > 0 {
            issue_events.len() as f64 / total_issues as f64
        } else {
            0.0
        };

        let merged_prs = user.pull_requests
            .iter()
            .filter(|pr| pr.merged_at.is_some())
            .count();

        let pr_acceptance = if !user.pull_requests.is_empty() {
            merged_prs as f64 / user.pull_requests.len() as f64
        } else {
            0.0
        };

        let mut component_scores = HashMap::new();
        component_scores.insert("commit_frequency".to_string(), commit_frequency);
        component_scores.insert("commit_recency".to_string(), recency_score);
        component_scores.insert("issue_resolution".to_string(), issue_resolution.min(1.0));
        component_scores.insert("pr_acceptance".to_string(), pr_acceptance.min(1.0));

        let weighted_score = self.contribution_params.iter().fold(0.0, |acc, (key, weight)| {
            acc + weight * component_scores.get(key).unwrap_or(&0.0)
        });

        Ok((weighted_score, component_scores))
    }

    fn score_repo_significance(&self, user: &GitHubUser) -> Result<(f64, HashMap<String, f64>), ScoringError> {
        if user.repositories.is_empty() {
            return Ok((0.0, HashMap::new()));
        }

        let total_stars: u32 = user.repositories.iter().map(|r| r.stargazers_count).sum();
        let total_forks: u32 = user.repositories.iter().map(|r| r.forks_count).sum();

        let star_score = (total_stars as f64).ln_1p() / 1000.0_f64.ln_1p();
        let fork_score = (total_forks as f64).ln_1p() / 500.0_f64.ln_1p();

        let now = Utc::now();
        let active_repos = user.repositories
            .iter()
            .filter(|r| (now - r.updated_at).num_days() <= 180)
            .count();

        let activity_score = active_repos as f64 / user.repositories.len() as f64;
        let ecosystem_score = (star_score + fork_score) / 2.0;

        let mut component_scores = HashMap::new();
        component_scores.insert("stars".to_string(), star_score.min(1.0));
        component_scores.insert("forks".to_string(), fork_score.min(1.0));
        component_scores.insert("repo_activity".to_string(), activity_score.min(1.0));
        component_scores.insert("ecosystem_impact".to_string(), ecosystem_score.min(1.0));

        let weighted_score = self.repo_significance_params.iter().fold(0.0, |acc, (key, weight)| {
            acc + weight * component_scores.get(key).unwrap_or(&0.0)
        });

        Ok((weighted_score, component_scores))
    }

    fn score_code_quality(&self, user: &GitHubUser) -> Result<(f64, HashMap<String, f64>), ScoringError> {
        let review_events = user.events
            .iter()
            .filter(|e| e.r#type == "PullRequestReviewEvent")
            .count();

        let review_score = (review_events as f64 / 50.0).min(1.0);

        let doc_repos = user.repositories
            .iter()
            .filter(|r| r.description.as_ref().map_or(false, |d| d.len() > 50))
            .count();

        let doc_score = if !user.repositories.is_empty() {
            doc_repos as f64 / user.repositories.len() as f64
        } else {
            0.0
        };

        let commit_quality = 0.7; // Default reasonable quality score

        let mut component_scores = HashMap::new();
        component_scores.insert("code_review_participation".to_string(), review_score);
        component_scores.insert("documentation".to_string(), doc_score.min(1.0));
        component_scores.insert("commit_quality".to_string(), commit_quality);

        let weighted_score = self.code_quality_params.iter().fold(0.0, |acc, (key, weight)| {
            acc + weight * component_scores.get(key).unwrap_or(&0.0)
        });

        Ok((weighted_score, component_scores))
    }

    fn 
    score_community_engagement(&self, user: &GitHubUser) -> Result<(f64, HashMap<String, f64>), ScoringError> {
        let discussion_events = user.events
            .iter()
            .filter(|e| e.r#type == "IssueCommentEvent" || e.r#type == "CommitCommentEvent")
            .count();

        let discussion_score = (discussion_events as f64 / 50.0).min(1.0);

        let contributed_repos: std::collections::HashSet<_> = user.events
            .iter()
            .filter_map(|e| e.repo.as_ref().map(|r| r.name.clone()))
            .collect();

        let diversity_score = (contributed_repos.len() as f64 / 10.0).min(1.0);

        let owned_repos = user.repositories
            .iter()
            .filter(|r| r.owner.login == user.login)
            .count();

        let maintainer_score = (owned_repos as f64 / 5.0).min(1.0);

        let mut component_scores = HashMap::new();
        component_scores.insert("discussions".to_string(), discussion_score);
        component_scores.insert("project_diversity".to_string(), diversity_score);
        component_scores.insert("maintainer_roles".to_string(), maintainer_score);

        let weighted_score = self.community_params.iter().fold(0.0, |acc, (key, weight)| {
            acc + weight * component_scores.get(key).unwrap_or(&0.0)
        });

        Ok((weighted_score, component_scores))
    }

    pub fn rate_score(&self, score: f64) -> &'static str {
        match score {
            s if s >= 0.9 => "Outstanding Contributor",
            s if s >= 0.8 => "Exceptional Developer",
            s if s >= 0.7 => "Excellent Developer",
            s if s >= 0.6 => "Very Good Developer",
            s if s >= 0.5 => "Strong Developer",
            s if s >= 0.4 => "Good Developer",
            s if s >= 0.3 => "Promising Developer",
            s if s >= 0.2 => "Developing Contributor",
            _ => "Beginner",
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::TimeZone;

    #[test]
    fn test_score_rating() {
        let scorer = GitHubScorer::new();
        assert_eq!(scorer.rate_score(0.95), "Outstanding Contributor");
        assert_eq!(scorer.rate_score(0.85), "Exceptional Developer");
        assert_eq!(scorer.rate_score(0.75), "Excellent Developer");
        assert_eq!(scorer.rate_score(0.15), "Beginner");
    }

    #[test]
    fn test_empty_user_score() {
        let scorer = GitHubScorer::new();
        let empty_user = GitHubUser {
            login: "test".to_string(),
            repositories: vec![],
            events: vec![],
            pull_requests: vec![],
        };

        let score = scorer.calculate_score(&empty_user).unwrap();
        assert!(score.final_score < 0.1);
    }
} 