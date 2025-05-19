use sqlx::{sqlite::SqlitePool, Row};
use chrono::{DateTime, Utc, Duration};
use crate::db::models::{CachedUser, CachedScore};
use std::path::Path;
use std::fs;
use std::env;
use std::io::Error as IoError;

pub struct Database {
    pool: SqlitePool,
}

impl Database {
    pub async fn new() -> Result<Self, sqlx::Error> {
        // Try to use temp directory first
        let db_path = if let Ok(temp_dir) = env::var("TMPDIR") {
            Path::new(&temp_dir).join("github_cache.db")
        } else {
            // Fallback to current directory
            env::current_dir()
                .map_err(|e| sqlx::Error::Configuration(Box::new(e)))?
                .join("data")
                .join("github_cache.db")
        };

        // Create parent directory if it doesn't exist
        if let Some(parent) = db_path.parent() {
            if !parent.exists() {
                println!("Creating directory at: {}", parent.display());
                fs::create_dir_all(parent)
                    .map_err(|e| sqlx::Error::Configuration(Box::new(e)))?;
            }
        }

        let db_url = format!("sqlite:{}", db_path.display());
        println!("Connecting to database at: {}", db_url);

        // Try to create the database file if it doesn't exist
        if !db_path.exists() {
            println!("Creating new database file");
            fs::File::create(&db_path)
                .map_err(|e| sqlx::Error::Configuration(Box::new(e)))?;
        }

        // Set permissions to read/write
        let mut perms = fs::metadata(&db_path)
            .map_err(|e| sqlx::Error::Configuration(Box::new(e)))?
            .permissions();
        perms.set_readonly(false);
        fs::set_permissions(&db_path, perms)
            .map_err(|e| sqlx::Error::Configuration(Box::new(e)))?;

        // Create a new database connection
        let pool = SqlitePool::connect(&db_url).await?;
        
        // Create tables if they don't exist
        println!("Creating database tables...");
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS cached_users (
                username TEXT PRIMARY KEY,
                user_data TEXT NOT NULL,
                repositories TEXT NOT NULL,
                events TEXT NOT NULL,
                pull_requests TEXT NOT NULL,
                last_updated TEXT NOT NULL
            );
            
            CREATE TABLE IF NOT EXISTS cached_scores (
                username TEXT PRIMARY KEY,
                score TEXT NOT NULL,
                rating TEXT NOT NULL,
                stats TEXT NOT NULL,
                activity TEXT NOT NULL,
                languages TEXT NOT NULL,
                last_updated TEXT NOT NULL
            );
            "#,
        )
        .execute(&pool)
        .await?;

        println!("Database initialized successfully");
        Ok(Self { pool })
    }

    pub async fn get_cached_user(&self, username: &str) -> Result<Option<CachedUser>, sqlx::Error> {
        let row = sqlx::query(
            r#"
            SELECT * FROM cached_users 
            WHERE username = ? AND last_updated > ?
            "#,
        )
        .bind(username)
        .bind((Utc::now() - Duration::hours(24)).to_rfc3339())
        .fetch_optional(&self.pool)
        .await?;

        if let Some(row) = row {
            Ok(Some(CachedUser {
                username: row.get("username"),
                user_data: serde_json::from_str(row.get("user_data")).unwrap(),
                repositories: serde_json::from_str(row.get("repositories")).unwrap(),
                events: serde_json::from_str(row.get("events")).unwrap(),
                pull_requests: serde_json::from_str(row.get("pull_requests")).unwrap(),
                last_updated: DateTime::parse_from_rfc3339(row.get("last_updated"))
                    .unwrap()
                    .with_timezone(&Utc),
            }))
        } else {
            Ok(None)
        }
    }

    pub async fn cache_user(&self, user: &CachedUser) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            INSERT OR REPLACE INTO cached_users 
            (username, user_data, repositories, events, pull_requests, last_updated)
            VALUES (?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&user.username)
        .bind(serde_json::to_string(&user.user_data).unwrap())
        .bind(serde_json::to_string(&user.repositories).unwrap())
        .bind(serde_json::to_string(&user.events).unwrap())
        .bind(serde_json::to_string(&user.pull_requests).unwrap())
        .bind(user.last_updated.to_rfc3339())
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn get_cached_score(&self, username: &str) -> Result<Option<CachedScore>, sqlx::Error> {
        let row = sqlx::query(
            r#"
            SELECT * FROM cached_scores 
            WHERE username = ? AND last_updated > ?
            "#,
        )
        .bind(username)
        .bind((Utc::now() - Duration::hours(24)).to_rfc3339())
        .fetch_optional(&self.pool)
        .await?;

        if let Some(row) = row {
            Ok(Some(CachedScore {
                username: row.get("username"),
                score: serde_json::from_str(row.get("score")).unwrap(),
                rating: row.get("rating"),
                stats: serde_json::from_str(row.get("stats")).unwrap(),
                activity: serde_json::from_str(row.get("activity")).unwrap(),
                languages: serde_json::from_str(row.get("languages")).unwrap(),
                last_updated: DateTime::parse_from_rfc3339(row.get("last_updated"))
                    .unwrap()
                    .with_timezone(&Utc),
            }))
        } else {
            Ok(None)
        }
    }

    pub async fn cache_score(&self, score: &CachedScore) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            INSERT OR REPLACE INTO cached_scores 
            (username, score, rating, stats, activity, languages, last_updated)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&score.username)
        .bind(serde_json::to_string(&score.score).unwrap())
        .bind(&score.rating)
        .bind(serde_json::to_string(&score.stats).unwrap())
        .bind(serde_json::to_string(&score.activity).unwrap())
        .bind(serde_json::to_string(&score.languages).unwrap())
        .bind(score.last_updated.to_rfc3339())
        .execute(&self.pool)
        .await?;

        Ok(())
    }
} 