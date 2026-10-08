import unittest
from types import SimpleNamespace

from app.services.verification import recommend_next_evidence


class VerificationTests(unittest.TestCase):
    def test_missing_physical_description_is_top_priority(self):
        result = recommend_next_evidence(SimpleNamespace(description="Age: 42"), SimpleNamespace(physical_description=None), [], [])
        self.assertIn("physical mark", result["question"].lower())

    def test_age_conflict_recommends_age_verification(self):
        result = recommend_next_evidence(SimpleNamespace(description="Age: 42"), SimpleNamespace(physical_description="Scar"), [], ["Age differs by 1 year"])
        self.assertIn("age", result["question"].lower())

    def test_location_gap_recommends_location_confirmation(self):
        result = recommend_next_evidence(SimpleNamespace(description="Blue shirt", last_seen_location=None), SimpleNamespace(physical_description="Blue shirt"), [], [])
        self.assertIn("location", result["question"].lower())

    def test_weak_name_recommends_alias_or_spelling(self):
        result = recommend_next_evidence(SimpleNamespace(name="Arun Kumar", description="Blue shirt", last_seen_location="Station"), SimpleNamespace(name="Unknown", physical_description="Blue shirt"), ["appearance matches"], ["Name similarity is limited"])
        self.assertIn("alternate name", result["question"].lower())

    def test_fallback_is_deterministic(self):
        args = (SimpleNamespace(description="Blue shirt", last_seen_location="Station"), SimpleNamespace(physical_description="Blue shirt"), ["appearance matches"], [])
        self.assertEqual(recommend_next_evidence(*args), recommend_next_evidence(*args))
        self.assertIn("question", recommend_next_evidence(*args))
        self.assertIn("reason", recommend_next_evidence(*args))


if __name__ == "__main__":
    unittest.main()

