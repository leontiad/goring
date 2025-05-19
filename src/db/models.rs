use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize)]
pub struct CachedUser {
    pub username: String,
    pub user_data: serde_json::Value,
    pub repositories: Vec<serde_json::Value>,
    pub events: Vec<serde_json::Value>,
    pub pull_requests: Vec<serde_json::Value>,
    pub last_updated: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CachedScore {
    pub username: String,
    pub score: serde_json::Value,
    pub rating: String,
    pub stats: serde_json::Value,
    pub activity: serde_json::Value,
    pub languages: serde_json::Value,
    pub last_updated: DateTime<Utc>,
} 