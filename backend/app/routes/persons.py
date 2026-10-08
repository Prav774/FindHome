from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import Person, SourceRecord, TimelineEvent
from app.schemas.person import (
    PersonCreate,
    PersonRecordCreate,
    PersonRecordResponse,
    PersonResponse,
    TimelineEventResponse,
)


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
