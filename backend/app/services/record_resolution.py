"""Rank possible Person matches for an unlinked SourceRecord observation."""

from types import SimpleNamespace

from app.models.models import Evidence, Person, SourceRecord
from app.services.matching import calculate_match


MINIMUM_CANDIDATE_SCORE = 40
MAX_CANDIDATES = 3


def find_record_candidates(db, record_data, limit=MAX_CANDIDATES):
    """Return high-scoring candidates without assigning the record to a Person."""
    values = record_data.model_dump() if hasattr(record_data, "model_dump") else dict(record_data)
    description_parts = []
    if values.get("raw_description"):
        description_parts.append(values["raw_description"])
    if values.get("raw_age") is not None:
        description_parts.append("Age: {}".format(values["raw_age"]))

    comparison_case = SimpleNamespace(
        name=values.get("raw_name"),
        description=". ".join(description_parts) or None,
        last_seen_location=values.get("location"),
    )
    candidates = []

    for person in db.query(Person).all():
        source_records = (
            db.query(SourceRecord)
            .filter(SourceRecord.person_id == person.id)
            .all()
        )
        evidence = db.query(Evidence).filter(Evidence.person_id == person.id).all()
        result = calculate_match(comparison_case, person, source_records, evidence)
        if result["score"] < MINIMUM_CANDIDATE_SCORE:
            continue
        candidates.append({
            "person_id": person.id,
            "score": result["score"],
            "supporting_evidence": result["supporting_evidence"],
            "conflicting_evidence": result["conflicting_evidence"],
            "missing_evidence": result["missing_evidence"],
            "explanation": result["explanation"],
        })

    candidates.sort(key=lambda candidate: (-candidate["score"], candidate["person_id"]))
    return candidates[:max(0, limit)]
