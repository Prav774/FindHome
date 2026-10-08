"""Development helper for creating clearly labeled demo records."""

from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import Case, Person, SourceRecord, TimelineEvent
from app.schemas.demo import DemoSeedResponse


router = APIRouter(prefix="/demo", tags=["Demo"])


@router.post("/seed", response_model=DemoSeedResponse, status_code=status.HTTP_201_CREATED)
def seed_demo_data(db: Session = Depends(get_db)):
    now = datetime.utcnow()
    case = Case(
        name="Arun Kumar",
        description="DEMO DATA. Age: 42. Wearing blue shirt.",
        last_seen_location="Railway Station",
        status="SEARCHING",
    )
    person = Person(
        name="Unknown male",
        age=None,
        gender="male",
        physical_description=None,
        status="UNKNOWN",
    )

    try:
        db.add(case)
        db.add(person)
        db.flush()

        records = [
            SourceRecord(
                person_id=person.id,
                organization="Rescue Team",
                source_type="DEMO rescue report",
                raw_name="Unknown male",
                raw_age=None,
                raw_description="DEMO DATA. Unknown male; estimated age 40–45; blue shirt; scar on right hand.",
                location="Railway Station",
                recorded_at=now - timedelta(hours=3),
            ),
            SourceRecord(
                person_id=person.id,
                organization="Shelter A",
                source_type="DEMO shelter report",
                raw_name="Arun K",
                raw_age=43,
                raw_description="DEMO DATA. Arun K; age 43; wearing blue shirt.",
                location="Shelter A",
                recorded_at=now - timedelta(hours=2),
            ),
            SourceRecord(
                person_id=person.id,
                organization="Hospital B",
                source_type="DEMO hospital report",
                raw_name="A Kumar",
                raw_age=43,
                raw_description="DEMO DATA. A Kumar; age 43; male.",
                location="Hospital B",
                recorded_at=now - timedelta(hours=1),
            ),
        ]
        for record in records:
            db.add(record)

        timeline_events = [
            TimelineEvent(
                person_id=person.id,
                event_type="DEMO_RESCUE_REPORT",
                location="Railway Station",
                description="DEMO DATA. Rescue Team records an unknown male at the Railway Station.",
                event_time=now - timedelta(hours=3),
                source="Rescue Team",
            ),
            TimelineEvent(
                person_id=person.id,
                event_type="DEMO_SHELTER_ARRIVAL",
                location="Shelter A",
                description="DEMO DATA. Shelter A records an arrival reported by the Rescue Team.",
                event_time=now - timedelta(hours=2),
                source="Shelter A",
            ),
            TimelineEvent(
                person_id=person.id,
                event_type="DEMO_HOSPITAL_REPORT",
                location="Hospital B",
                description="DEMO DATA. Hospital B records a report for the unresolved person.",
                event_time=now - timedelta(hours=1),
                source="Hospital B",
            ),
        ]
        for event in timeline_events:
            db.add(event)

        db.commit()
    except Exception:
        db.rollback()
        raise

    return {"demo_data": True, "case_id": case.id, "person_id": person.id}
