import requests
import datetime
import numpy as np
from collections import Counter, defaultdict
import re
import time

class GitHubScorer:
    """
    A system that scores GitHub users based on their commit patterns and contribution quality.
    Uses the GitHub API to fetch user data and applies weighted scoring algorithms.
    """
    
    def __init__(self, token=None):
        """
        Initialize the scorer with an optional GitHub API token.
        
        Args:
            token (str, optional): GitHub personal access token for API authentication.
                                  Without a token, API rate limits will be very restrictive.
        """
        self.token = token
        self.headers = {}
        if token:
            self.headers = {"Authorization": f"token {token}"}
        
        # Define scoring weights - these can be adjusted based on priorities
        self.weights = {
            "commit_frequency": 0.15,          # Regular, consistent commits
            "commit_size": 0.10,               # Appropriate sized commits (not too large or small)
            "code_quality": 0.20,              # Based on commit message quality and patterns
            "project_diversity": 0.10,         # Contributing to different projects
            "issue_engagement": 0.10,          # Engaging with issues
            "pull_request_quality": 0.15,      # Quality of PRs (accepted vs rejected)
            "code_review_participation": 0.10, # Reviewing others' code
            "documentation": 0.10,             # Documenting code and contributing to docs
        }
        
        # Time decay factor - more recent activity counts more
        self.time_decay_factor = 0.9  # 90% weight for each 6-month period going back
    
    def _make_api_request(self, url, params=None):
        """Make a request to the GitHub API with rate limit handling."""
        if params is None:
            params = {}
            
        try:
            response = requests.get(url, headers=self.headers, params=params)
            
            # Handle rate limiting
            if response.status_code == 403 and 'X-RateLimit-Remaining' in response.headers:
                if int(response.headers['X-RateLimit-Remaining']) == 0:
                    reset_time = int(response.headers['X-RateLimit-Reset'])
                    sleep_time = max(0, reset_time - time.time()) + 1
                    print(f"Rate limit exceeded. Sleeping for {sleep_time} seconds.")
                    time.sleep(sleep_time)
                    return self._make_api_request(url, params)  # Retry
            
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            print(f"API request error: {e}")
            return None
    
    def get_user_info(self, username):
        """Get basic information about a GitHub user."""
        url = f"https://api.github.com/users/{username}"
        return self._make_api_request(url)
    
    def get_user_repos(self, username):
        """Get repositories owned by the user."""
        url = f"https://api.github.com/users/{username}/repos"
        params = {"per_page": 100, "sort": "updated"}
        return self._make_api_request(url, params)
    
    def get_user_commits(self, username, max_repos=10):
        """
        Get commit data for a user across their repositories.
        Limited to max_repos to avoid excessive API calls.
        """
        repos = self.get_user_repos(username)
        if not repos:
            return []
            
        # Sort by most recently updated and take the top max_repos
        repos = sorted(repos, key=lambda r: r.get('updated_at', ''), reverse=True)[:max_repos]
        
        all_commits = []
        for repo in repos:
            # Only analyze non-fork repositories to focus on original contributions
            if repo.get('fork', False):
                continue
                
            repo_name = repo['name']
            url = f"https://api.github.com/repos/{username}/{repo_name}/commits"
            params = {"author": username, "per_page": 100}
            
            commits = self._make_api_request(url, params)
            if commits:
                for commit in commits:
                    commit['repo_name'] = repo_name
                all_commits.extend(commits)
        
        return all_commits
    
    def get_pull_requests(self, username, max_repos=10):
        """Get pull requests created by the user."""
        repos = self.get_user_repos(username)
        if not repos:
            return []
            
        repos = sorted(repos, key=lambda r: r.get('updated_at', ''), reverse=True)[:max_repos]
        
        all_prs = []
        for repo in repos:
            if repo.get('fork', False):
                continue
                
            repo_name = repo['name']
            url = f"https://api.github.com/repos/{username}/{repo_name}/pulls"
            params = {"state": "all", "per_page": 100}
            
            prs = self._make_api_request(url, params)
            if prs:
                prs = [pr for pr in prs if pr.get('user', {}).get('login') == username]
                for pr in prs:
                    pr['repo_name'] = repo_name
                all_prs.extend(prs)
        
        return all_prs
    
    def get_issues(self, username, max_repos=10):
        """Get issues created or commented on by the user."""
        repos = self.get_user_repos(username)
        if not repos:
            return []
            
        repos = sorted(repos, key=lambda r: r.get('updated_at', ''), reverse=True)[:max_repos]
        
        all_issues = []
        for repo in repos:
            if repo.get('fork', False):
                continue
                
            repo_name = repo['name']
            url = f"https://api.github.com/repos/{username}/{repo_name}/issues"
            params = {"state": "all", "per_page": 100}
            
            issues = self._make_api_request(url, params)
            if issues:
                issues = [issue for issue in issues if issue.get('user', {}).get('login') == username]
                for issue in issues:
                    issue['repo_name'] = repo_name
                all_issues.extend(issues)
        
        return all_issues
    
    def _apply_time_decay(self, date_str, max_years=3):
        """
        Apply time decay to score based on how old an activity is.
        More recent activities get higher weight.
        
        Args:
            date_str: ISO format date string
            max_years: Maximum number of years to look back
        
        Returns:
            A decay factor between 0 and 1
        """
        try:
            activity_date = datetime.datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            now = datetime.datetime.now(datetime.timezone.utc)
            
            # Calculate how many 6-month periods ago this was
            days_ago = (now - activity_date).days
            periods_ago = days_ago / 182.5  # approximately 6 months
            
            # Apply exponential decay
            decay = self.time_decay_factor ** periods_ago
            
            # Cut off at max_years
            if days_ago > 365 * max_years:
                return 0.1  # Minimum value for very old contributions
                
            return decay
        except:
            return 0.5  # Default if date parsing fails
    
    def score_commit_frequency(self, commits):
        """
        Score based on commit frequency and consistency.
        Higher scores for regular, consistent contribution patterns.
        """
        if not commits:
            return 0
            
        # Extract commit dates and sort
        dates = [commit.get('commit', {}).get('author', {}).get('date') 
                for commit in commits if commit.get('commit', {}).get('author', {}).get('date')]
        
        if not dates:
            return 0
            
        # Convert to datetime objects
        dates = [datetime.datetime.fromisoformat(date.replace('Z', '+00:00')) for date in dates]
        dates.sort()
        
        # Calculate days between commits
        if len(dates) < 2:
            return 0.5  # Base score for just one commit
            
        intervals = [(dates[i+1] - dates[i]).days for i in range(len(dates)-1)]
        
        # Analyze consistency
        avg_interval = sum(intervals) / len(intervals)
        consistency = np.std(intervals) / (avg_interval + 1)  # Normalized standard deviation
        
        # Ideal: 1-3 days between commits on average
        frequency_score = min(1.0, 3.0 / (avg_interval + 1))
        
        # Penalize inconsistency
        consistency_score = max(0, 1 - min(1, consistency))
        
        # Combine scores with time decay for most recent commit
        recency = self._apply_time_decay(commits[0].get('commit', {}).get('author', {}).get('date', ''))
        
        # Calculate final score
        score = (0.6 * frequency_score + 0.4 * consistency_score) * recency
        
        return min(1.0, score)
    
    def score_commit_size(self, commits):
        """
        Score based on commit sizes.
        Rewards appropriate-sized commits (not too large or small).
        """
        if not commits:
            return 0
            
        # Ideally, we'd get detailed commit data with additions/deletions
        # For this prototype, we'll approximate with commit message length as a proxy
        
        message_lengths = []
        for commit in commits:
            message = commit.get('commit', {}).get('message', '')
            message_lengths.append(len(message))
            
        if not message_lengths:
            return 0
            
        # Calculate score based on message length distribution
        # Ideal: 10-100 chars (concise but descriptive)
        scores = []
        for length in message_lengths:
            if length < 5:
                # Too short - likely not descriptive
                score = 0.2
            elif 5 <= length < 10:
                # Short but potentially valid
                score = 0.5
            elif 10 <= length < 50:
                # Ideal range for most changes
                score = 1.0
            elif 50 <= length < 100:
                # Still good, might be more complex change
                score = 0.9
            elif 100 <= length < 500:
                # Getting verbose, but might be necessary
                score = 0.7
            else:
                # Too long, might indicate too large a commit
                score = 0.4
                
            scores.append(score)
            
        # Add time decay for recency
        for i, commit in enumerate(commits):
            date = commit.get('commit', {}).get('author', {}).get('date', '')
            scores[i] *= self._apply_time_decay(date)
            
        return sum(scores) / len(scores) if scores else 0
    
    def score_code_quality(self, commits):
        """
        Score code quality based on commit message analysis.
        Looks for patterns indicative of good practices.
        """
        if not commits:
            return 0
            
        quality_indicators = {
            'test': 0.2,         # Contains tests
            'fix': 0.1,          # Fixes issues
            'refactor': 0.15,    # Code improvement
            'doc': 0.1,          # Documentation
            'feat': 0.15,        # New features
            'perf': 0.15,        # Performance improvements
            'style': 0.05,       # Code style/formatting
            'chore': 0.05,       # Maintenance tasks
            'ci': 0.05           # CI/CD improvements
        }
        
        scores = []
        for commit in commits:
            message = commit.get('commit', {}).get('message', '').lower()
            
            # Base quality score
            quality = 0.5
            
            # Check for conventional commit format (type: description)
            conventional_pattern = re.match(r'^(\w+)(\(.+\))?: .+', message)
            if conventional_pattern:
                quality += 0.2  # Bonus for following conventions
                
            # Check for presence of quality indicators
            for indicator, value in quality_indicators.items():
                if indicator in message:
                    quality += value
                    
            # Check for issue references (#123)
            if re.search(r'#\d+', message):
                quality += 0.1
                
            # Penalize very short messages
            if len(message) < 10:
                quality -= 0.3
                
            # Apply time decay
            date = commit.get('commit', {}).get('author', {}).get('date', '')
            quality *= self._apply_time_decay(date)
            
            scores.append(min(1.0, quality))
            
        return sum(scores) / len(scores) if scores else 0
    
    def score_project_diversity(self, commits):
        """
        Score based on diversity of projects contributed to.
        Higher scores for meaningful contributions across different projects.
        """
        if not commits:
            return 0
            
        # Count commits per repository
        repo_counts = Counter(commit.get('repo_name') for commit in commits)
        
        # Calculate Gini-Simpson diversity index
        total_commits = len(commits)
        diversity = 1 - sum((count/total_commits)**2 for count in repo_counts.values())
        
        # Weight by number of repos (more repos is better, up to a point)
        num_repos = len(repo_counts)
        repo_factor = min(1.0, num_repos / 5)  # Max score at 5+ repos
        
        return diversity * repo_factor
    
    def score_issue_engagement(self, issues):
        """
        Score based on issue creation and engagement.
        Rewards thoughtful bug reports and feature requests.
        """
        if not issues:
            return 0
            
        total_score = 0
        for issue in issues:
            score = 0.5  # Base score
            
            # Score based on issue body quality
            body = issue.get('body', '')
            if body:
                # Longer, more detailed issues score higher (up to a point)
                length_score = min(0.3, len(body) / 1000)
                
                # Check for structured content
                has_code = '```' in body
                has_list = '- ' in body or '* ' in body
                has_headers = re.search(r'#+\s+\w+', body) is not None
                
                structure_score = 0.1 * sum([has_code, has_list, has_headers])
                
                score += length_score + structure_score
            
            # Apply time decay
            date = issue.get('created_at', '')
            if date:
                score *= self._apply_time_decay(date)
                
            total_score += min(1.0, score)
            
        return total_score / len(issues) if issues else 0
    
    def score_pull_request_quality(self, pull_requests):
        """
        Score based on PR quality.
        Higher scores for PRs that are accepted and don't require many revisions.
        """
        if not pull_requests:
            return 0
            
        total_score = 0
        for pr in pull_requests:
            score = 0.5  # Base score
            
            # Check state
            state = pr.get('state')
            merged = pr.get('merged')
            
            if merged:
                score += 0.3  # Merged PRs are valuable
            elif state == 'closed' and not merged:
                score -= 0.2  # Closed without merging may indicate rejection
                
            # Check for description quality
            body = pr.get('body', '')
            if body:
                # Similar to issue scoring
                length_score = min(0.2, len(body) / 800)
                score += length_score
                
            # Apply time decay
            date = pr.get('created_at', '')
            if date:
                score *= self._apply_time_decay(date)
                
            total_score += min(1.0, score)
            
        return total_score / len(pull_requests) if pull_requests else 0
    
    def score_code_review_participation(self, username, pull_requests):
        """
        Score based on code review participation.
        Approximated from PR comments in this prototype.
        """
        # In a real implementation, we would get review comments via API
        # For prototype, we'll return a placeholder
        return 0.5
    
    def score_documentation(self, commits):
        """
        Score documentation contributions.
        Looks for doc commits and README updates.
        """
        if not commits:
            return 0
            
        doc_scores = []
        for commit in commits:
            score = 0
            message = commit.get('commit', {}).get('message', '').lower()
            
            # Check for documentation-related keywords
            doc_keywords = ['doc', 'readme', 'comment', 'wiki', 'explain', 'tutorial']
            for keyword in doc_keywords:
                if keyword in message:
                    score += 0.2
                    break
            
            # Apply time decay
            date = commit.get('commit', {}).get('author', {}).get('date', '')
            score *= self._apply_time_decay(date)
            
            doc_scores.append(min(1.0, score))
        
        # Average across all commits
        return sum(doc_scores) / len(doc_scores) if doc_scores else 0
    
    def calculate_overall_score(self, username):
        """
        Calculate an overall GitHub score using weighted component scores.
        
        Args:
            username: GitHub username to score
            
        Returns:
            dict: Component scores and weighted overall score
        """
        # Get user data
        user_info = self.get_user_info(username)
        if not user_info:
            return {"error": "User not found or API limit reached"}
            
        commits = self.get_user_commits(username)
        pull_requests = self.get_pull_requests(username)
        issues = self.get_issues(username)
        
        # Calculate component scores
        scores = {
            "commit_frequency": self.score_commit_frequency(commits),
            "commit_size": self.score_commit_size(commits),
            "code_quality": self.score_code_quality(commits),
            "project_diversity": self.score_project_diversity(commits),
            "issue_engagement": self.score_issue_engagement(issues),
            "pull_request_quality": self.score_pull_request_quality(pull_requests),
            "code_review_participation": self.score_code_review_participation(username, pull_requests),
            "documentation": self.score_documentation(commits),
        }
        
        # Calculate weighted overall score
        weighted_score = sum(scores[key] * self.weights[key] for key in scores)
        
        # Account for quantity - should have minimum threshold of activity
        activity_count = len(commits) + len(pull_requests) + len(issues)
        activity_factor = min(1.0, activity_count / 50)  # Max at 50+ activities
        
        final_score = weighted_score * activity_factor
        
        # Format to 2 decimal places for cleaner output
        for key in scores:
            scores[key] = round(scores[key], 2)
            
        return {
            "username": username,
            "component_scores": scores,
            "weights": self.weights,
            "activity_count": activity_count,
            "activity_factor": round(activity_factor, 2),
            "weighted_score": round(weighted_score, 2),
            "final_score": round(final_score, 2)
        }


# Example usage
if __name__ == "__main__":
    # Create scorer (pass your GitHub token for higher rate limits)
    scorer = GitHubScorer(token="")
    
    # Calculate score for a GitHub user
    username = "leontiad"  # Example GitHub user
    print(f"Calculating GitHub score for {username}...")
    result = scorer.calculate_overall_score(username)
    
    # Print detailed results
    print("\nDetailed GitHub Score:")
    print(f"Username: {result['username']}")
    print(f"Final Score: {result['final_score']}/1.0")
    print("\nComponent Scores:")
    for component, score in result['component_scores'].items():
        weight = result['weights'][component]
        print(f"  {component}: {score} (weight: {weight}, weighted: {round(score * weight, 2)})")
    
    print(f"\nActivity Count: {result['activity_count']}")
    print(f"Activity Factor: {result['activity_factor']}")