from datetime import datetime

from pydantic import BaseModel, ConfigDict


class CaseCreate(BaseModel):
    name: str
    age: int | None = None
    gender: str | None = None
    description: str | None = None
    last_seen_location: str | None = None
    clothing: str | None = None
    identifying_marks: str | None = None


class CaseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None = None
    last_seen_location: str | None = None
    status: str
    created_at: datetime
    updated_at: datetime | None = None


class CasePublicCreateResponse(BaseModel):
    case_id: str
    status: str


class CasePublicSearchResponse(BaseModel):
    case_id: str
    name: str
    age: int | None = None
    gender: str | None = None
    last_seen_location: str | None = None
    clothing: str | None = None
    identifying_marks: str | None = None
    status: str
