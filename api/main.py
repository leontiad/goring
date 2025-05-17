from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import sys
import os

# Add the parent directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from github_score_model import GitHubScoreModel

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the GitHub scoring model
token = "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"  # Replace with your GitHub token
model = GitHubScoreModel(token=token)

class ScoreResponse(BaseModel):
    username: str
    final_score: float
    rating: str
    contribution_score: float
    repo_significance: float
    code_quality: float
    community_engagement: float
    detailed_components: dict

@app.get("/api/score/{username}")
async def get_score(username: str) -> ScoreResponse:
    try:
        score, details = model.calculate_final_score(username)
        return ScoreResponse(
            username=username,
            final_score=score,
            rating=model.rate_score(score),
            contribution_score=details["component_scores"]["contribution_weight"],
            repo_significance=details["component_scores"]["repo_significance"],
            code_quality=details["component_scores"]["code_quality"],
            community_engagement=details["component_scores"]["community_engagement"],
            detailed_components=details["detailed_components"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001) 