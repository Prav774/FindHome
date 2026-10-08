from datetime import datetime

from pydantic import BaseModel, ConfigDict


class MatchResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    case_id: int
    person_id: int
    score: float
    status: str
    explanation: str | None = None
    created_at: datetime


class MatchDetailResponse(MatchResponse):
    supporting_evidence: list[str]
    conflicting_evidence: list[str]
    missing_evidence: list[str]
    next_best_evidence: dict[str, str]
