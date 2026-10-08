from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import Person, SourceRecord, TimelineEvent
from app.schemas.person import (
    PersonCreate,
    PersonRecordCreate,
    PersonRecordLinkRequest,
    PersonRecordResponse,
    PersonResponse,
    TimelineEventResponse,
    UnresolvedPersonRecordCreate,
    UnresolvedPersonRecordResponse,
)
from app.services.record_resolution import find_record_candidates


router = APIRouter(tags=["Persons"])


@router.post("/persons", response_model=PersonResponse, status_code=status.HTTP_201_CREATED)
def create_person(person_data: PersonCreate, db: Session = Depends(get_db)):
    person = Person(**person_data.model_dump())
    db.add(person)
    db.commit()
    db.refresh(person)
    return person


@router.get("/persons/{person_id}", response_model=PersonResponse)
def get_person(person_id: int, db: Session = Depends(get_db)):
    person = db.query(Person).filter(Person.id == person_id).first()
    if person is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Person not found")
    return person


@router.post(
    "/person-records",
    response_model=PersonRecordResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_person_record(record_data: PersonRecordCreate, db: Session = Depends(get_db)):
    person = db.query(Person).filter(Person.id == record_data.person_id).first()
    if person is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Person not found")

    record = SourceRecord(**record_data.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.post(
    "/person-records/unresolved",
    response_model=UnresolvedPersonRecordResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_unresolved_person_record(
    record_data: UnresolvedPersonRecordCreate,
    db: Session = Depends(get_db),
):
    record = SourceRecord(person_id=None, **record_data.model_dump())
    try:
        db.add(record)
        db.flush()
        candidates = find_record_candidates(db, record_data)
        db.commit()
    except Exception:
        db.rollback()
        raise

    return {
        "record_id": record.id,
        "status": "NEEDS_REVIEW" if candidates else "UNRESOLVED",
        "candidates": candidates,
    }


@router.post(
    "/person-records/{record_id}/link",
    response_model=PersonRecordResponse,
)
def link_person_record(
    record_id: int,
    link_data: PersonRecordLinkRequest,
    db: Session = Depends(get_db),
):
    if not link_data.verification_confirmed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Human verification must be confirmed before linking",
        )

    record = db.query(SourceRecord).filter(SourceRecord.id == record_id).first()
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Source record not found")
    person = db.query(Person).filter(Person.id == link_data.person_id).first()
    if person is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Person not found")
    if record.person_id is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Source record is already linked to a person",
        )

    record.person_id = person.id
    db.commit()
    db.refresh(record)
    return record


@router.get(
    "/persons/{person_id}/timeline",
    response_model=list[TimelineEventResponse],
)
def get_person_timeline(person_id: int, db: Session = Depends(get_db)):
    person = db.query(Person).filter(Person.id == person_id).first()
    if person is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Person not found")
    return (
        db.query(TimelineEvent)
        .filter(TimelineEvent.person_id == person_id)
        .order_by(TimelineEvent.event_time.asc(), TimelineEvent.created_at.asc())
        .all()
    )
