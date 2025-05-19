# GitHub Score API

A comprehensive API for analyzing and scoring GitHub users based on their contributions, repository significance, and community engagement.

## Project Structure

```
.
├── src/
│   ├── api/
│   │   └── main.rs           # Main API server implementation
│   ├── db/
│   │   ├── models.rs         # Database models for caching
│   │   ├── db.rs            # Database connection and operations
│   │   └── mod.rs           # Database module exports
│   ├── scoring/
│   │   ├── github_score.rs   # GitHub scoring algorithm implementation
│   │   └── mod.rs           # Scoring module exports
│   └── lib.rs               # Library exports and shared types
├── data/                    # SQLite database storage
│   └── github_cache.db      # Cached GitHub data
├── Cargo.toml              # Rust dependencies and project configuration
└── README.md              # Project documentation
```

## Features

- Comprehensive GitHub user analysis
- Caching system for improved performance
- Rate limit handling
- Detailed scoring breakdown
- RESTful API endpoints

## API Endpoints

- `POST /api/score` - Calculate GitHub user score
- `GET /api/health` - Health check endpoint

## Database Schema

### Cached Users Table
- username (TEXT, PRIMARY KEY)
- user_data (TEXT)
- repositories (TEXT)
- events (TEXT)
- pull_requests (TEXT)
- last_updated (TEXT)

### Cached Scores Table
- username (TEXT, PRIMARY KEY)
- score (TEXT)
- rating (TEXT)
- stats (TEXT)
- activity (TEXT)
- languages (TEXT)
- last_updated (TEXT)

## Setup

1. Clone the repository
2. Set up your GitHub token:
   ```bash
   export GITHUB_TOKEN=your_token_here
   ```
3. Run the server:
   ```bash
   cargo run
   ```

## Dependencies

- sqlx - SQL toolkit and ORM
- reqwest - HTTP client
- serde - Serialization/deserialization
- tokio - Async runtime
- chrono - Date and time handling

## Development

The project uses SQLite for caching GitHub API responses. The database file is stored in the `data` directory and is automatically created when the server starts.

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/github-score.git
cd github-score
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run check` - Run type checking

## Backend Server

```
cargo run
```


