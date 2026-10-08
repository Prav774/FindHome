"""Load records, calculate candidate match scores, and persist Match rows."""

from app.models.models import Case, Evidence, Match, Person, SourceRecord
from app.services.matching import calculate_match


def generate_matches_for_case(db, case_id):
    case = db.query(Case).filter(Case.id == case_id).first()
    if case is None:
        raise ValueError("Case not found")

    existing_matches = db.query(Match).filter(Match.case_id == case_id).all()
    matches_by_person = {match.person_id: match for match in existing_matches}
    generated = []

    for person in db.query(Person).all():
        source_records = db.query(SourceRecord).filter(SourceRecord.person_id == person.id).all()
        evidence = db.query(Evidence).filter(Evidence.person_id == person.id).all()
        result = calculate_match(case, person, source_records, evidence)
        if result["score"] < 40:
            continue

        match = matches_by_person.get(person.id)
        if match is None:
            match = Match(
                case_id=case_id,
                person_id=person.id,
                score=result["score"],
                explanation=result["explanation"],
                status="POTENTIAL_MATCH",
            )
            db.add(match)
            matches_by_person[person.id] = match
        else:
            match.score = result["score"]
            match.explanation = result["explanation"]

        generated.append(match)

    db.commit()
    return sorted(generated, key=lambda match: (-match.score, match.person_id))
