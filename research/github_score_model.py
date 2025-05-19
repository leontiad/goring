import requests
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import time
from sklearn.preprocessing import MinMaxScaler
from typing import Dict, List, Tuple, Optional
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class GitHubScoreModel:
    """
    A model to score GitHub accounts based on their contributions, repository 
    significance, and other quality factors.
    """
    
    def __init__(self, token: Optional[str] = None):
        """
        Initialize the GitHub scoring model.
        
        Args:
            token: GitHub API token for authenticated requests (recommended to avoid rate limits)
        """
        self.token = token
        self.headers = {'Authorization': f'token {token}'} if token else {}
        self.base_url = "https://api.github.com"
        
        # Define weights for different scoring components
        self.weights = {
            "contribution_weight": 0.35,
            "repo_significance": 0.30,
            "code_quality": 0.20,
            "community_engagement": 0.15
        }
        
        # Parameters for each scoring component
        self.contribution_params = {
            "commit_frequency": 0.35,
            "commit_recency": 0.25,
            "issue_resolution": 0.20,
            "pr_acceptance": 0.20
        }
        
        self.repo_significance_params = {
            "stars": 0.30,
            "forks": 0.25,
            "repo_activity": 0.25,
            "ecosystem_impact": 0.20
        }
        
        self.code_quality_params = {
            "code_review_participation": 0.30,
            "documentation": 0.30,
            "commit_quality": 0.40
        }
        
        self.community_params = {
            "discussions": 0.30,
            "project_diversity": 0.40,
            "maintainer_roles": 0.30
        }
        
        # Scalers for normalizing metrics
        self.scalers = {
            "commit_frequency": MinMaxScaler(),
            "stars": MinMaxScaler(),
            "forks": MinMaxScaler()
        }
    
    def _make_api_request(self, endpoint: str) -> Dict:
        """
        Make a request to the GitHub API.
        
        Args:
            endpoint: The API endpoint to request
            
        Returns:
            API response as dictionary
        """
        url = f"{self.base_url}/{endpoint}"
        response = requests.get(url, headers=self.headers)
        
        if response.status_code == 403 and 'rate limit exceeded' in response.text.lower():
            reset_time = int(response.headers.get('X-RateLimit-Reset', 0))
            current_time = time.time()
            sleep_time = reset_time - current_time + 5
            
            if sleep_time > 0:
                logging.warning(f"Rate limit exceeded. Sleeping for {sleep_time:.2f} seconds.")
                time.sleep(sleep_time)
                return self._make_api_request(endpoint)
        
        response.raise_for_status()
        return response.json()
    
    def get_user_data(self, username: str) -> Dict:
        """
        Get comprehensive user data from GitHub.
        
        Args:
            username: GitHub username
            
        Returns:
            Dictionary containing user data
        """
        logging.info(f"Fetching data for user: {username}")
        
        # Get basic user info
        user_data = self._make_api_request(f"users/{username}")
        
        # Get user repositories
        repos = []
        page = 1
        while True:
            repos_page = self._make_api_request(f"users/{username}/repos?page={page}&per_page=100")
            if not repos_page:
                break
            repos.extend(repos_page)
            page += 1
            if len(repos_page) < 100:
                break
        
        # Get user events (commits, PRs, issues)
        events = []
        page = 1
        while True and page <= 10:  # Limit to 10 pages to avoid excessive requests
            events_page = self._make_api_request(f"users/{username}/events?page={page}&per_page=100")
            if not events_page:
                break
            events.extend(events_page)
            page += 1
            if len(events_page) < 100:
                break
        
        # Get user's pull requests (partial data due to API limitations)
        pulls = []
        for repo in repos[:10]:  # Limit to first 10 repos to avoid excessive requests
            try:
                repo_pulls = self._make_api_request(f"repos/{repo['full_name']}/pulls?state=all&creator={username}")
                pulls.extend(repo_pulls)
            except:
                pass
        
        return {
            "user_info": user_data,
            "repositories": repos,
            "events": events,
            "pull_requests": pulls
        }
    
    def score_contribution_weight(self, user_data: Dict) -> Tuple[float, Dict]:
        """
        Score the user based on their contribution weight.
        
        Args:
            user_data: User data dictionary
            
        Returns:
            Contribution weight score and component scores
        """
        # Extract relevant data
        repos = user_data["repositories"]
        events = user_data["events"]
        pulls = user_data["pull_requests"]
        
        # Calculate commit frequency (last 6 months)
        now = datetime.now()
        six_months_ago = now - timedelta(days=180)
        
        commit_events = [e for e in events if e["type"] == "PushEvent"]
        recent_commits = [e for e in commit_events 
                         if datetime.strptime(e["created_at"], "%Y-%m-%dT%H:%M:%SZ") > six_months_ago]
        
        commit_frequency = len(recent_commits)
        
        # Calculate commit recency (weighted average of commit dates)
        if recent_commits:
            commit_dates = [datetime.strptime(e["created_at"], "%Y-%m-%dT%H:%M:%SZ") for e in recent_commits]
            days_ago = [(now - date).days for date in commit_dates]
            recency_score = 1.0 - min(1.0, sum(days_ago) / (len(days_ago) * 180))
        else:
            recency_score = 0.0
        
        # Calculate issue resolution rate
        issue_events = [e for e in events if e["type"] == "IssuesEvent" and 
                        e["payload"].get("action") == "closed"]
        issue_resolution = len(issue_events) / max(1, len([e for e in events if e["type"] == "IssuesEvent"]))
        
        # Calculate PR acceptance rate
        merged_prs = len([pr for pr in pulls if pr.get("merged_at")])
        pr_acceptance = merged_prs / max(1, len(pulls))
        
        # Calculate overall contribution weight score
        component_scores = {
            "commit_frequency": min(1.0, commit_frequency / 100),  # Normalize to 0-1
            "commit_recency": recency_score,
            "issue_resolution": min(1.0, issue_resolution),
            "pr_acceptance": min(1.0, pr_acceptance)
        }
        
        weighted_score = sum(self.contribution_params[key] * value 
                            for key, value in component_scores.items())
        
        return weighted_score, component_scores
    
    def score_repo_significance(self, user_data: Dict) -> Tuple[float, Dict]:
        """
        Score the user based on repository significance.
        
        Args:
            user_data: User data dictionary
            
        Returns:
            Repository significance score and component scores
        """
        repos = user_data["repositories"]
        
        if not repos:
            return 0.0, {
                "stars": 0.0,
                "forks": 0.0,
                "repo_activity": 0.0,
                "ecosystem_impact": 0.0
            }
        
        # Calculate repository popularity (stars, forks)
        total_stars = sum(repo["stargazers_count"] for repo in repos)
        total_forks = sum(repo["forks_count"] for repo in repos)
        
        # Normalize stars and forks with a logarithmic scale to avoid outlier dominance
        star_score = min(1.0, np.log1p(total_stars) / np.log1p(1000))
        fork_score = min(1.0, np.log1p(total_forks) / np.log1p(500))
        
        # Calculate repository activity (recent commits, issues, PRs)
        now = datetime.now()
        active_repos = 0
        
        for repo in repos:
            updated_at = datetime.strptime(repo["updated_at"], "%Y-%m-%dT%H:%M:%SZ")
            if (now - updated_at).days <= 180:  # Active in last 6 months
                active_repos += 1
        
        activity_score = min(1.0, active_repos / max(1, len(repos)))
        
        # Calculate ecosystem impact (used by others, dependencies)
        # This is a simplification - in a real implementation, we would check actual dependency usage
        ecosystem_score = min(1.0, (star_score + fork_score) / 2)
        
        # Calculate overall repository significance score
        component_scores = {
            "stars": star_score,
            "forks": fork_score,
            "repo_activity": activity_score,
            "ecosystem_impact": ecosystem_score
        }
        
        weighted_score = sum(self.repo_significance_params[key] * value 
                            for key, value in component_scores.items())
        
        return weighted_score, component_scores
    
    def score_code_quality(self, user_data: Dict) -> Tuple[float, Dict]:
        """
        Score the user based on code quality metrics.
        
        Args:
            user_data: User data dictionary
            
        Returns:
            Code quality score and component scores
        """
        repos = user_data["repositories"]
        events = user_data["events"]
        
        # Calculate code review participation
        review_events = [e for e in events if e["type"] == "PullRequestReviewEvent"]
        review_score = min(1.0, len(review_events) / 50)  # Normalize to 0-1
        
        # Calculate documentation score (presence of README, docs folder, comments in PRs)
        doc_repos = 0
        for repo in repos:
            # Check if repo has README (simplified - would need additional API calls)
            if repo.get("description") and len(repo.get("description", "")) > 50:
                doc_repos += 1
        
        doc_score = min(1.0, doc_repos / max(1, len(repos)))
        
        # Calculate commit quality (simplified - would ideally involve code analysis)
        # Here we use a heuristic based on commit message length and frequency
        commit_events = [e for e in events if e["type"] == "PushEvent"]
        
        commit_quality = 0.0
        if commit_events:
            # Check for non-empty commit messages (simplified)
            commit_quality = 0.7  # Default reasonable quality score
        
        # Calculate overall code quality score
        component_scores = {
            "code_review_participation": review_score,
            "documentation": doc_score,
            "commit_quality": commit_quality
        }
        
        weighted_score = sum(self.code_quality_params[key] * value 
                            for key, value in component_scores.items())
        
        return weighted_score, component_scores
    
    def score_community_engagement(self, user_data: Dict) -> Tuple[float, Dict]:
        """
        Score the user based on community engagement.
        
        Args:
            user_data: User data dictionary
            
        Returns:
            Community engagement score and component scores
        """
        user_info = user_data["user_info"]
        events = user_data["events"]
        repos = user_data["repositories"]
        
        # Calculate discussion participation
        discussion_events = [e for e in events if e["type"] in ["IssueCommentEvent", "CommitCommentEvent"]]
        discussion_score = min(1.0, len(discussion_events) / 50)
        
        # Calculate project diversity (number of different repos contributed to)
        contributed_repos = set()
        for event in events:
            if "repo" in event and "name" in event["repo"]:
                contributed_repos.add(event["repo"]["name"])
        
        diversity_score = min(1.0, len(contributed_repos) / 10)
        
        # Calculate maintainer roles (owner vs. contributor)
        owned_repos = len([repo for repo in repos if repo.get("owner", {}).get("login") == user_info["login"]])
        maintainer_score = min(1.0, owned_repos / 5)
        
        # Calculate overall community engagement score
        component_scores = {
            "discussions": discussion_score,
            "project_diversity": diversity_score,
            "maintainer_roles": maintainer_score
        }
        
        weighted_score = sum(self.community_params[key] * value 
                            for key, value in component_scores.items())
        
        return weighted_score, component_scores
    
    def calculate_final_score(self, username: str) -> Tuple[float, Dict]:
        """
        Calculate the final weighted score for a GitHub user.
        
        Args:
            username: GitHub username
            
        Returns:
            Final weighted score and detailed component scores
        """
        # Get user data
        user_data = self.get_user_data(username)
        
        # Calculate component scores
        contribution_score, contribution_components = self.score_contribution_weight(user_data)
        repo_score, repo_components = self.score_repo_significance(user_data)
        quality_score, quality_components = self.score_code_quality(user_data)
        community_score, community_components = self.score_community_engagement(user_data)
        
        # Calculate final weighted score
        component_scores = {
            "contribution_weight": contribution_score,
            "repo_significance": repo_score,
            "code_quality": quality_score,
            "community_engagement": community_score
        }
        
        final_score = sum(self.weights[key] * value for key, value in component_scores.items())
        
        # Detailed breakdown of scores
        detailed_scores = {
            "final_score": final_score,
            "component_scores": component_scores,
            "detailed_components": {
                "contribution_weight": contribution_components,
                "repo_significance": repo_components,
                "code_quality": quality_components,
                "community_engagement": community_components
            }
        }
        
        return final_score, detailed_scores

    def rate_score(self, score: float) -> str:
        """
        Convert numeric score to qualitative rating.
        
        Args:
            score: Final GitHub score (0-1)
            
        Returns:
            Qualitative rating
        """
        if score >= 0.9:
            return "Outstanding Contributor"
        elif score >= 0.8:
            return "Exceptional Developer"
        elif score >= 0.7:
            return "Excellent Developer"
        elif score >= 0.6:
            return "Very Good Developer"
        elif score >= 0.5:
            return "Strong Developer"
        elif score >= 0.4:
            return "Good Developer"
        elif score >= 0.3:
            return "Promising Developer"
        elif score >= 0.2:
            return "Developing Contributor"
        else:
            return "Beginner"

    def analyze_multiple_users(self, usernames: List[str]) -> pd.DataFrame:
        """
        Analyze and compare multiple GitHub users.
        
        Args:
            usernames: List of GitHub usernames to analyze
            
        Returns:
            DataFrame with comparison results
        """
        results = []
        
        for username in usernames:
            try:
                score, details = self.calculate_final_score(username)
                
                results.append({
                    "username": username,
                    "final_score": score,
                    "rating": self.rate_score(score),
                    "contribution_score": details["component_scores"]["contribution_weight"],
                    "repo_significance": details["component_scores"]["repo_significance"],
                    "code_quality": details["component_scores"]["code_quality"],
                    "community_engagement": details["component_scores"]["community_engagement"]
                })
            except Exception as e:
                logging.error(f"Error analyzing user {username}: {str(e)}")
        
        # Create DataFrame and sort by final score
        if results:
            df = pd.DataFrame(results)
            return df.sort_values("final_score", ascending=False).reset_index(drop=True)
        else:
            return pd.DataFrame()


# Example usage
if __name__ == "__main__":
    # Initialize the model (with GitHub token if available)
    # For higher rate limits, use a personal access token
    token = ""  # Replace with your GitHub token
    model = GitHubScoreModel(token=token)
    
    # Analyze a single user
    username = "leontiad"  # Example: Linus Torvalds
    try:
        score, details = model.calculate_final_score(username)
        print(f"Final score for {username}: {score:.4f}")
        print(f"Rating: {model.rate_score(score)}")
        print("\nComponent scores:")
        for component, score in details["component_scores"].items():
            print(f"- {component}: {score:.4f}")
    except Exception as e:
        print(f"Error analyzing user: {str(e)}")
    
    # Compare multiple users
    usernames = ["left-arm", "leontiad", "fridgebuyer"]
    try:
        comparison = model.analyze_multiple_users(usernames)
        print("\nUser comparison:")
        print(comparison)
    except Exception as e:
        print(f"Error comparing users: {str(e)}")
