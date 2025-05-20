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

## Deployment

The project is split into two parts:
1. Frontend (SvelteKit) - Deployed on Netlify
2. Backend (Rust) - Deployed on Shuttle.dev

### Frontend Deployment (Netlify)

1. Create a Netlify account and install the Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Link your project to Netlify:
   ```bash
   netlify link
   ```

3. Add environment variables in Netlify dashboard:
   ```
   VITE_API_URL=https://your-backend-url.shuttleapp.rs
   ```

4. Deploy:
   ```bash
   netlify deploy --prod
   ```

### Backend Deployment (Shuttle)

1. Create a Shuttle account and install the Shuttle CLI:
   ```bash
   cargo install cargo-shuttle
   ```

2. Login to Shuttle:
   ```bash
   cargo shuttle login
   ```

3. Initialize your project:
   ```bash
   cargo shuttle init
   ```

4. Add environment variables in Shuttle dashboard:
   ```
   GITHUB_TOKEN=your_github_token
   FRONTEND_URL=https://your-frontend-domain.netlify.app
   ```

5. Deploy:
   ```bash
   cargo shuttle deploy
   ```

### CI/CD Setup

1. Add the following secrets to your GitHub repository:
   - `NETLIFY_AUTH_TOKEN`
   - `NETLIFY_SITE_ID`
   - `SHUTTLE_TOKEN`

2. Push to main branch to trigger deployment:
   ```bash
   git push origin main
   ```

### Domain Setup

1. Purchase a domain from your preferred registrar
2. In Netlify dashboard:
   - Go to Site settings > Domain management
   - Add your custom domain
   - Follow the DNS configuration instructions

3. Set up environment variables:
   - Frontend: Update `VITE_API_URL` to point to your Shuttle backend
   - Backend: Update `FRONTEND_URL` to your Netlify frontend domain


