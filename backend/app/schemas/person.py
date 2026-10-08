from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict


class PersonCreate(BaseModel):
    name: str | None = None
    age: int | None = None
    gender: str | None = None
    physical_description: str | None = None
    status: str = "UNKNOWN"


class PersonResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str | None = None
    age: int | None = None
    gender: str | None = None
    physical_description: str | None = None
    status: str
    created_at: datetime


class PersonRecordCreate(BaseModel):
    person_id: int
    organization: str
    source_type: str
    raw_name: str | None = None
    raw_age: int | None = None
    raw_description: str | None = None
    location: str | None = None
    recorded_at: datetime | None = None


class UnresolvedPersonRecordCreate(BaseModel):
    organization: str
    source_type: str
    raw_name: str | None = None
    raw_age: int | None = None
    raw_description: str | None = None
    location: str | None = None
    recorded_at: datetime | None = None


class PersonRecordLinkRequest(BaseModel):
    person_id: int
    verification_confirmed: bool


class UnresolvedCandidateResponse(BaseModel):
    person_id: int
    score: float
    supporting_evidence: list[str]
    conflicting_evidence: list[str]
    missing_evidence: list[str]
    explanation: str


class UnresolvedPersonRecordResponse(BaseModel):
    record_id: int
    status: Literal["NEEDS_REVIEW", "UNRESOLVED"]
    candidates: list[UnresolvedCandidateResponse]


class PersonRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    person_id: int | None = None
    organization: str
    source_type: str
    raw_name: str | None = None
    raw_age: int | None = None
    raw_description: str | None = None
    location: str | None = None
    recorded_at: datetime | None = None
    created_at: datetime


class TimelineEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    person_id: int
    event_type: str
    location: str | None = None
    description: str | None = None
    event_time: datetime | None = None
    source: str | None = None
    created_at: datetime
