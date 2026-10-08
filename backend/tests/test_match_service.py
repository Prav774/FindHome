import unittest
from unittest.mock import patch

from app.models.models import Case, Evidence, Match, Person, SourceRecord
from app.services.match_service import generate_matches_for_case


class FakeQuery:
    def __init__(self, model, rows):
        self.model, self.rows, self.conditions = model, rows, []

    def filter(self, condition):
        self.conditions.append((condition.left.key, condition.right.value))
        return self

    def all(self):
        return [row for row in self.rows.get(self.model, []) if all(getattr(row, key) == value for key, value in self.conditions)]

    def first(self):
        rows = self.all()
        return rows[0] if rows else None


class FakeDB:
    def __init__(self, rows):
        self.rows, self.added, self.commits = rows, [], 0

    def query(self, model):
        return FakeQuery(model, self.rows)

    def add(self, row):
        self.added.append(row)
        self.rows.setdefault(type(row), []).append(row)

    def commit(self):
        self.commits += 1


def entity(**kwargs):
    return type("Entity", (), kwargs)()


def setup_db(existing_matches=None):
    case_row = entity(id=1, name="Family", description="Age: 20", last_seen_location="Station")
    person = entity(id=8, name="Similar", age=20, gender=None, physical_description="Blue shirt")
    db = FakeDB({Case: [case_row], Person: [person], SourceRecord: [], Evidence: [], Match: existing_matches or []})
    return db, case_row, person


class MatchServiceTests(unittest.TestCase):
    def test_missing_case_raises_value_error(self):
        db = FakeDB({Case: [], Person: [], SourceRecord: [], Evidence: [], Match: []})
        with self.assertRaises(ValueError):
            generate_matches_for_case(db, 44)

    @patch("app.services.match_service.calculate_match")
    def test_only_scores_at_least_40_are_persisted_and_sorted(self, calculate):
        db, _, person = setup_db()
        calculate.return_value = {"score": 39, "explanation": "low", "status": "POTENTIAL_MATCH"}
        self.assertEqual(generate_matches_for_case(db, 1), [])
        calculate.return_value = {"score": 75, "explanation": "good", "status": "POTENTIAL_MATCH"}
        matches = generate_matches_for_case(db, 1)
        self.assertEqual(len(matches), 1)
        self.assertEqual(matches[0].person_id, person.id)
        self.assertEqual(matches[0].status, "POTENTIAL_MATCH")

    @patch("app.services.match_service.calculate_match")
    def test_existing_match_is_updated_without_duplication_or_status_change(self, calculate):
        existing = entity(id=3, case_id=1, person_id=8, score=10, explanation="old", status="UNDER_VERIFICATION")
        db, _, _ = setup_db([existing])
        calculate.return_value = {"score": 82, "explanation": "updated", "status": "POTENTIAL_MATCH"}
        matches = generate_matches_for_case(db, 1)
        self.assertEqual(len(matches), 1)
        self.assertEqual(existing.score, 82)
        self.assertEqual(existing.status, "UNDER_VERIFICATION")
        self.assertEqual(len([item for item in db.added if isinstance(item, Match)]), 0)

    @patch("app.services.match_service.calculate_match")
    def test_source_records_and_evidence_are_passed_to_calculation(self, calculate):
        source = entity(person_id=8, raw_name="Alias", raw_age=None, raw_description="Blue shirt", location="Station", organization="Org", source_type="report")
        evidence = entity(person_id=8, evidence_type="clothing", value="blue shirt", source="Org", reliability=0.8, freshness=1.0)
        db, _, person = setup_db()
        db.rows[SourceRecord] = [source]
        db.rows[Evidence] = [evidence]
        calculate.return_value = {"score": 70, "explanation": "good", "status": "POTENTIAL_MATCH"}
        generate_matches_for_case(db, 1)
        calculate.assert_called_once_with(db.rows[Case][0], person, [source], [evidence])


if __name__ == "__main__":
    unittest.main()
