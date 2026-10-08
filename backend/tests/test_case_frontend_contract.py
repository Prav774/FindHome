import unittest
from datetime import datetime
from types import SimpleNamespace
from unittest.mock import patch

from fastapi import HTTPException
from app.main import app
from app.models.models import Case
from app.routes.cases import create_case, search_case
from app.schemas.case import CaseCreate, CasePublicCreateResponse, CasePublicSearchResponse


class Query:
    def __init__(self, rows):
        self.rows = rows
        self.conditions = []

    def filter(self, condition):
        self.conditions.append((condition.left.key, condition.right.value))
        return self

    def first(self):
        for row in self.rows:
            if all(getattr(row, key, None) == value for key, value in self.conditions):
                return row
        return None


class FakeDB:
    def __init__(self, cases=None):
        self.cases = cases or []
        self.added = []
        self.last_query_conditions = []

    def query(self, model):
        query = Query(self.cases if model is Case else [])
        original_filter = query.filter

        def record_filter(condition):
            self.last_query_conditions.append((condition.left.key, condition.right.value))
            return original_filter(condition)

        query.filter = record_filter
        return query

    def add(self, row):
        row.id = len(self.cases) + len(self.added) + 1
        self.added.append(row)

    def commit(self):
        self.cases.extend(self.added)

    def refresh(self, row):
        if row.status is None:
            row.status = "SEARCHING"


class CaseFrontendContractTests(unittest.TestCase):
    def test_create_case_returns_only_public_id_and_status(self):
        db = FakeDB()
        payload = CaseCreate.model_validate({
            "name": "Arun Kumar",
            "age": 42,
            "gender": "Male",
            "last_seen_location": "Chennai Central",
            "clothing": "Blue shirt, black pants",
            "identifying_marks": "Scar on left arm",
        })
        with patch("app.routes.cases.secrets.randbelow", return_value=23):
            response = create_case(payload, db)
        self.assertEqual(response, {"case_id": "FH-0024", "status": "SEARCHING"})
        self.assertEqual(set(response), {"case_id", "status"})
        saved = db.cases[0]
        self.assertEqual((saved.name, saved.age, saved.gender), ("Arun Kumar", 42, "Male"))
        self.assertEqual((saved.clothing, saved.identifying_marks), ("Blue shirt, black pants", "Scar on left arm"))
        self.assertEqual(CasePublicCreateResponse.model_validate(response).case_id, "FH-0024")

    def test_search_returns_required_public_case_fields(self):
        row = SimpleNamespace(
            public_case_id="FH-1024", name="Arun Kumar", age=42, gender="Male",
            last_seen_location="Chennai Central", clothing="Blue shirt, black pants",
            identifying_marks="Scar on left arm", status="SEARCHING",
        )
        response = search_case("FH-1024", FakeDB([row]))
        validated = CasePublicSearchResponse.model_validate(response)
        self.assertEqual(validated.model_dump(), {
            "case_id": "FH-1024", "name": "Arun Kumar", "age": 42,
            "gender": "Male", "last_seen_location": "Chennai Central",
            "clothing": "Blue shirt, black pants", "identifying_marks": "Scar on left arm",
            "status": "SEARCHING",
        })

    def test_search_unknown_public_id_returns_404(self):
        with self.assertRaises(HTTPException) as error:
            search_case("FH-9999", FakeDB())
        self.assertEqual(error.exception.status_code, 404)

    def test_public_routes_precede_legacy_integer_route_and_old_routes_remain(self):
        paths = app.openapi()["paths"]
        self.assertIn("/api/cases", paths)
        self.assertIn("/api/cases/search", paths)
        self.assertIn("/api/cases/{case_id}", paths)
        self.assertIn("/api/cases/{case_id}/matches", paths)


    def test_get_case_looks_up_public_id_and_preserves_numeric_id_lookup(self):
        from app.routes.cases import get_case

        public_case = SimpleNamespace(id=17, public_case_id="FH-5492")
        public_db = FakeDB([public_case])
        self.assertIs(get_case("FH-5492", public_db), public_case)
        self.assertEqual(public_db.last_query_conditions, [("public_case_id", "FH-5492")])

        numeric_case = SimpleNamespace(id=17, public_case_id="FH-5492")
        numeric_db = FakeDB([numeric_case])
        self.assertIs(get_case("17", numeric_db), numeric_case)
        self.assertEqual(numeric_db.last_query_conditions, [("id", 17)])



if __name__ == "__main__":
    unittest.main()
