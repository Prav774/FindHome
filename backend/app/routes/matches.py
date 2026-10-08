from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import Case, Evidence, Match, Person, SourceRecord
from app.schemas.match import MatchDetailResponse, MatchResponse
from app.services.match_service import generate_matches_for_case
from app.services.matching import calculate_match
from app.services.verification import recommend_next_evidence


router = APIRouter(tags=["Matching"])


@router.post("/cases/{case_id}/generate-matches", response_model=list[MatchResponse])
def generate_case_matches(case_id: int, db: Session = Depends(get_db)):
    try:
        return generate_matches_for_case(db, case_id)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error


@router.get("/matches/{match_id}", response_model=MatchDetailResponse)
def get_match_detail(match_id: int, db: Session = Depends(get_db)):
    match = db.query(Match).filter(Match.id == match_id).first()
    if match is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")

    case = db.query(Case).filter(Case.id == match.case_id).first()
    person = db.query(Person).filter(Person.id == match.person_id).first()
    if case is None or person is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match case or person not found")

    source_records = db.query(SourceRecord).filter(SourceRecord.person_id == person.id).all()
    evidence = db.query(Evidence).filter(Evidence.person_id == person.id).all()
    calculated = calculate_match(case, person, source_records, evidence)
    return {
        "id": match.id,
        "case_id": match.case_id,
        "person_id": match.person_id,
        "score": calculated["score"],
        "status": match.status,
        "explanation": calculated["explanation"],
        "created_at": match.created_at,
        "supporting_evidence": calculated["supporting_evidence"],
        "conflicting_evidence": calculated["conflicting_evidence"],
        "missing_evidence": calculated["missing_evidence"],
        "next_best_evidence": recommend_next_evidence(
            case,
            person,
            calculated["supporting_evidence"],
            calculated["conflicting_evidence"] + calculated["missing_evidence"],
        ),
    }


@router.get("/cases/{case_id}/matches", response_model=list[MatchResponse])
def list_case_matches(case_id: int, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == case_id).first()
    if case is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")
    return db.query(Match).filter(Match.case_id == case_id).order_by(Match.score.desc()).all()


def _update_match_status(match_id: int, match_status: str, db: Session) -> Match:
    match = db.query(Match).filter(Match.id == match_id).first()
    if match is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")
    match.status = match_status
    db.commit()
    db.refresh(match)
    return match


@router.post("/matches/{match_id}/verify", response_model=MatchResponse)
def verify_match(match_id: int, db: Session = Depends(get_db)):
    return _update_match_status(match_id, "VERIFIED", db)


@router.post("/matches/{match_id}/reject", response_model=MatchResponse)
def reject_match(match_id: int, db: Session = Depends(get_db)):
    return _update_match_status(match_id, "REJECTED", db)


@router.post("/matches/{match_id}/request-info", response_model=MatchResponse)
def request_match_information(match_id: int, db: Session = Depends(get_db)):
    return _update_match_status(match_id, "NEEDS_MORE_INFO", db)
