from datetime import datetime
from types import SimpleNamespace
from unittest.mock import patch

import pytest
from fastapi import HTTPException

from app.models.models import Evidence, Person, SourceRecord
from app.routes.persons import (
    create_person,
    create_person_record,
    create_unresolved_person_record,
    link_person_record,
)
from app.schemas.person import (
    PersonCreate,
    PersonRecordCreate,
    PersonRecordLinkRequest,
    UnresolvedPersonRecordCreate,
)
from app.services.record_resolution import find_record_candidates


class Query:
    def __init__(self, rows):
        self.rows, self.conditions = rows, []

    def filter(self, condition):
        self.conditions.append((condition.left.key, condition.right.value))
        return self

    def all(self):
        return [row for row in self.rows if all(getattr(row, key, None) == value for key, value in self.conditions)]

    def first(self):
        rows = self.all()
        return rows[0] if rows else None


class FakeDB:
    def __init__(self, people=None, records=None, evidence=None):
        self.rows = {Person: people or [], SourceRecord: records or [], Evidence: evidence or []}
        self.next_id, self.commits, self.rollbacks = 100, 0, 0

    def query(self, model):
        return Query(self.rows.setdefault(model, []))

    def add(self, row):
        if getattr(row, "id", None) is None:
            row.id = self.next_id
            self.next_id += 1
        self.rows.setdefault(type(row), []).append(row)

    def flush(self):
        pass

    def commit(self):
        self.commits += 1

    def refresh(self, row):
        pass

    def rollback(self):
        self.rollbacks += 1


def person(person_id, name, age=None, gender=None, description=None):
    return SimpleNamespace(id=person_id, name=name, age=age, gender=gender, physical_description=description)


def payload(**overrides):
    data = {
        "organization": "Rescue Team", "source_type": "rescue report",
        "raw_name": "Arun Kumar", "raw_age": 42,
        "raw_description": "Blue shirt, scar on right hand",
        "location": "Railway Station", "recorded_at": datetime(2026, 10, 8, 10, 0),
    }
    data.update(overrides)
    return UnresolvedPersonRecordCreate(**data)


def test_unresolved_record_has_strong_candidate_with_age_conflict_and_stays_unlinked():
    db = FakeDB(people=[person(7, "Arun Kumar", 43, "male", "Blue shirt")])
    response = create_unresolved_person_record(payload(), db)
    candidate = response["candidates"][0]
    assert response["status"] == "NEEDS_REVIEW"
    assert candidate["person_id"] == 7 and candidate["score"] >= 40
    assert any("age" in item.lower() for item in candidate["conflicting_evidence"])
    assert response["record_id"] == 100
    assert db.rows[SourceRecord][0].person_id is None


def test_no_candidate_returns_unresolved_and_persists_without_link():
    db = FakeDB(people=[person(3, "Mohan Patel", 71, "female", "Green coat")])
    response = create_unresolved_person_record(payload(raw_name="Zara N", raw_age=18, raw_description="Red jacket", location="Airport"), db)
    assert response == {"record_id": 100, "status": "UNRESOLVED", "candidates": []}
    assert db.rows[SourceRecord][0].person_id is None


def test_candidates_are_ranked_and_limited_to_three():
    db = FakeDB(people=[person(pid, f"Candidate {pid}") for pid in range(1, 6)])
    def fake_calculate(case, candidate, source_records, evidence):
        return {"score": candidate.id * 10 + 20, "supporting_evidence": [], "conflicting_evidence": [], "missing_evidence": [], "explanation": "Evidence summary", "status": "POTENTIAL_MATCH"}
    with patch("app.services.record_resolution.calculate_match", side_effect=fake_calculate):
        results = find_record_candidates(db, payload())
    assert [item["person_id"] for item in results] == [5, 4, 3]
    assert [item["score"] for item in results] == [70, 60, 50]


def test_link_requires_confirmation_and_preserves_source_data():
    record = SimpleNamespace(id=12, person_id=None, organization="Rescue Team", source_type="rescue", raw_name="Arun", raw_age=42, raw_description="Blue shirt", location="Station", recorded_at=None, created_at=datetime(2026, 10, 8))
    db = FakeDB(people=[person(7, "Arun Kumar")], records=[record])
    with pytest.raises(HTTPException) as error:
        link_person_record(12, PersonRecordLinkRequest(person_id=7, verification_confirmed=False), db)
    assert error.value.status_code == 400 and record.person_id is None
    linked = link_person_record(12, PersonRecordLinkRequest(person_id=7, verification_confirmed=True), db)
    assert linked.person_id == 7 and linked.raw_name == "Arun" and linked.organization == "Rescue Team"


def test_link_rejects_missing_ids_and_already_linked_record():
    db = FakeDB(people=[person(7, "Arun Kumar")])
    with pytest.raises(HTTPException) as missing_record:
        link_person_record(404, PersonRecordLinkRequest(person_id=7, verification_confirmed=True), db)
    assert missing_record.value.status_code == 404
    record = SimpleNamespace(id=12, person_id=None)
    db.rows[SourceRecord].append(record)
    with pytest.raises(HTTPException) as missing_person:
        link_person_record(12, PersonRecordLinkRequest(person_id=404, verification_confirmed=True), db)
    assert missing_person.value.status_code == 404
    record.person_id = 5
    with pytest.raises(HTTPException) as linked_already:
        link_person_record(12, PersonRecordLinkRequest(person_id=7, verification_confirmed=True), db)
    assert linked_already.value.status_code == 409


def test_existing_person_and_record_creation_still_work():
    db = FakeDB()
    saved = create_person(PersonCreate(name="Arun Kumar"), db)
    created_record = create_person_record(PersonRecordCreate(person_id=saved.id, organization="Shelter A", source_type="intake"), db)
    assert created_record.person_id == saved.id
    assert created_record.organization == "Shelter A"


def test_existing_and_new_record_endpoints_are_registered():
    from app.main import app
    paths = app.openapi()["paths"]
    assert "/api/person-records" in paths
    assert "/api/person-records/unresolved" in paths
    assert "/api/person-records/{record_id}/link" in paths

