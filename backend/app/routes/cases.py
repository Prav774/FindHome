import re
import secrets

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import Case
from app.schemas.case import (
    CaseCreate,
    CasePublicCreateResponse,
    CasePublicSearchResponse,
    CaseResponse,
)


router = APIRouter(prefix="/cases", tags=["Cases"])


def _available_public_case_id(db: Session) -> str:
    for _ in range(100):
        public_case_id = "FH-{:04d}".format(secrets.randbelow(9999) + 1)
        exists = db.query(Case).filter(Case.public_case_id == public_case_id).first()
        if exists is None:
            return public_case_id
    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="Could not allocate a public case ID",
    )


@router.post("", response_model=CasePublicCreateResponse, status_code=status.HTTP_201_CREATED)
def create_case(case_data: CaseCreate, db: Session = Depends(get_db)):
    case = Case(
        **case_data.model_dump(),
        public_case_id=_available_public_case_id(db),
        status="SEARCHING",
    )
    db.add(case)
    db.commit()
    db.refresh(case)
    return {"case_id": case.public_case_id, "status": case.status}


@router.get("", response_model=list[CaseResponse])
def list_cases(db: Session = Depends(get_db)):
    return db.query(Case).order_by(Case.created_at.desc()).all()


@router.get("/search", response_model=CasePublicSearchResponse)
def search_case(
    q: str = Query(..., pattern=r"^FH-\d{4}$"),
    db: Session = Depends(get_db),
):
    case = db.query(Case).filter(Case.public_case_id == q).first()
    if case is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")
    return {
        "case_id": case.public_case_id,
        "name": case.name,
        "age": case.age,
        "gender": case.gender,
        "last_seen_location": case.last_seen_location,
        "clothing": case.clothing,
        "identifying_marks": case.identifying_marks,
        "status": case.status,
    }


@router.get("/{case_id}", response_model=CaseResponse)
def get_case(case_id: str, db: Session = Depends(get_db)):
    if re.fullmatch(r"FH-\d{4}", case_id):
        case = db.query(Case).filter(Case.public_case_id == case_id).first()
    elif case_id.isdigit():
        case = db.query(Case).filter(Case.id == int(case_id)).first()
    else:
        case = None

    if case is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")
    return case
