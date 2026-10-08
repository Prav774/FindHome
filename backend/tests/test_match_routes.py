import unittest
from datetime import datetime
from types import SimpleNamespace

from fastapi import HTTPException
from app.main import app
from app.models.models import Case, Evidence, Match, Person, SourceRecord
from app.routes.matches import generate_case_matches, get_match_detail
from app.schemas.match import MatchDetailResponse


class Query:
    def __init__(self, rows): self.rows, self.conditions = rows, []
    def filter(self, condition):
        self.conditions.append((condition.left.key, condition.right.value)); return self
    def all(self): return [row for row in self.rows if all(getattr(row, key) == value for key, value in self.conditions)]
    def first(self):
        found = self.all()
        return found[0] if found else None


class DB:
    def __init__(self, mapping): self.mapping, self.added = mapping, []
    def query(self, model): return Query(self.mapping.get(model, []))
    def add(self, row): self.added.append(row); self.mapping.setdefault(type(row), []).append(row)
    def commit(self):
        for row in self.added:
            if getattr(row, "id", None) is None: row.id = 99


class MatchRouteTests(unittest.TestCase):
    def setUp(self):
        self.case = SimpleNamespace(id=1, name="Arun Kumar", description="Age: 42. Wearing blue shirt", last_seen_location="Railway Station")
        self.person = SimpleNamespace(id=7, name="Arun K", age=43, gender="male", physical_description="Blue shirt, scar on right hand")
        self.source = SimpleNamespace(id=2, person_id=7, organization="Rescue Team", source_type="rescue", raw_name="Arun K", raw_age=43, raw_description="Blue shirt", location="Railway Station")
        self.match = SimpleNamespace(id=9, case_id=1, person_id=7, score=70.0, status="POTENTIAL_MATCH", explanation="Candidate", created_at=datetime(2026, 1, 1))
        self.db = DB({Case: [self.case], Person: [self.person], SourceRecord: [self.source], Evidence: [], Match: [self.match]})

    def test_generation_creates_candidate_and_never_verifies(self):
        result = generate_case_matches(1, self.db)
        self.assertTrue(result)
        self.assertEqual(result[0].status, "POTENTIAL_MATCH")

    def test_missing_case_and_match_return_404(self):
        with self.assertRaises(HTTPException) as case_error:
            generate_case_matches(404, DB({Case: [], Person: [], SourceRecord: [], Evidence: [], Match: []}))
        self.assertEqual(case_error.exception.status_code, 404)
        with self.assertRaises(HTTPException) as match_error:
            get_match_detail(404, DB({Case: [], Person: [], SourceRecord: [], Evidence: [], Match: []}))
        self.assertEqual(match_error.exception.status_code, 404)

    def test_detail_contains_evidence_and_next_best_evidence(self):
        result = get_match_detail(9, self.db)
        response = MatchDetailResponse.model_validate(result)
        self.assertEqual(response.id, 9)
        self.assertIsInstance(response.score, float)
        self.assertIsInstance(response.supporting_evidence, list)
        self.assertIsInstance(response.conflicting_evidence, list)
        self.assertIsInstance(response.missing_evidence, list)
        self.assertTrue(response.explanation)
        self.assertNotEqual(response.explanation, "Candidate")
        self.assertNotEqual(response.score, 70.0)
        self.assertIn("question", response.next_best_evidence)
        self.assertNotEqual(response.status, "VERIFIED")

    def test_existing_match_endpoints_remain_registered(self):
        paths = app.openapi()["paths"]
        for path in ("/api/cases/{case_id}/matches", "/api/matches/{match_id}/verify", "/api/matches/{match_id}/reject", "/api/matches/{match_id}/request-info"):
            self.assertIn(path, paths)
        self.assertIn("/api/cases/{case_id}/generate-matches", paths)
        self.assertIn("/api/matches/{match_id}", paths)


if __name__ == "__main__":
    unittest.main()
