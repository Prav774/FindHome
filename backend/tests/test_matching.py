import unittest
from types import SimpleNamespace

from app.services.matching import calculate_match


def case(**overrides):
    values = {"name": "Arun Kumar", "description": "Age: 42. Wearing blue shirt", "last_seen_location": "Railway Station"}
    values.update(overrides)
    return SimpleNamespace(**values)


def person(**overrides):
    values = {"name": "Arun K", "age": 43, "gender": "male", "physical_description": "Blue shirt, scar on right hand"}
    values.update(overrides)
    return SimpleNamespace(**values)


class MatchingTests(unittest.TestCase):
    def test_similar_name_age_location_and_description_support_candidate(self):
        result = calculate_match(case(), person(), [], [])
        self.assertGreaterEqual(result["score"], 40)
        self.assertTrue(result["supporting_evidence"])
        self.assertIn("POTENTIAL_MATCH", result["status"])

    def test_one_year_age_difference_is_reported_without_rejecting(self):
        result = calculate_match(case(), person(), [], [])
        self.assertTrue(any("year" in item.lower() for item in result["conflicting_evidence"]))
        self.assertEqual(result["status"], "POTENTIAL_MATCH")

    def test_known_gender_conflict_is_strong_conflict(self):
        result = calculate_match(case(description="Age: 42. Female wearing blue shirt"), person(gender="male"), [], [])
        self.assertTrue(any("gender" in item.lower() for item in result["conflicting_evidence"]))

    def test_source_alias_and_location_contribute(self):
        records = [SimpleNamespace(raw_name="Arun K", raw_age=43, raw_description="Blue shirt", location="Railway Station", organization="Rescue Team", source_type="rescue")]
        result = calculate_match(case(), person(name=None, age=None, gender=None, physical_description=None), records, [])
        self.assertTrue(any("Arun" in item or "name" in item.lower() for item in result["supporting_evidence"]))
        self.assertGreater(result["score"], 0)

    def test_missing_fields_are_listed_not_conflicts(self):
        result = calculate_match(case(description=None, last_seen_location=None), person(name=None, age=None, gender=None, physical_description=None), [], [])
        self.assertTrue(result["missing_evidence"])
        self.assertFalse(result["conflicting_evidence"])
        self.assertEqual(result["status"], "POTENTIAL_MATCH")

    def test_explicit_age_cue_is_used_but_unparseable_age_is_missing(self):
        matching = calculate_match(case(description="Age: 42"), person(age=42, physical_description=None, gender=None), [], [])
        missing = calculate_match(case(description="Age uncertain"), person(age=None, physical_description=None, gender=None), [], [])
        self.assertTrue(any("age" in item.lower() for item in matching["supporting_evidence"]))
        self.assertTrue(any("age" in item.lower() for item in missing["missing_evidence"]))

    def test_age_range_is_not_misread_as_a_single_age(self):
        record = SimpleNamespace(raw_name="Unknown male", raw_age=None, raw_description="DEMO DATA. Estimated age 40–45", location=None, organization="Rescue Team", source_type="rescue")
        result = calculate_match(case(), person(age=None, physical_description=None, gender=None), [record], [])
        self.assertTrue(any("consistent" in item.lower() for item in result["supporting_evidence"]))
        self.assertFalse(any("differs by 5" in item.lower() for item in result["conflicting_evidence"]))

    def test_unlabelled_number_range_in_case_description_is_not_age_evidence(self):
        result = calculate_match(
            case(description="Seen between 40–45. Wearing blue shirt"),
            person(age=43),
            [],
            [],
        )
        self.assertTrue(any("age evidence is unavailable" in item.lower() for item in result["missing_evidence"]))
        self.assertFalse(any("age" in item.lower() for item in result["conflicting_evidence"]))

    def test_multiple_organizations_without_shared_details_do_not_support_identity(self):
        records = [
            SimpleNamespace(raw_name="Jon", raw_age=None, raw_description="Person observed", location="Beach", organization="Alpha", source_type="report"),
            SimpleNamespace(raw_name="Unidentified", raw_age=None, raw_description="Arrival recorded", location="Hospital", organization="Bravo", source_type="report"),
        ]
        result = calculate_match(
            case(name="Zora Smith", description="Age: 41", last_seen_location="North Plaza"),
            person(name=None, age=None, gender=None, physical_description=None),
            records,
            [],
        )
        self.assertFalse(any("more than one organization" in item.lower() for item in result["supporting_evidence"]))
    def test_score_is_bounded_and_explanation_is_human_readable(self):
        result = calculate_match(case(), person(), [], [])
        self.assertGreaterEqual(result["score"], 0)
        self.assertLessEqual(result["score"], 100)
        self.assertIn("match score", result["explanation"].lower())
        self.assertNotIn("probability", result["explanation"].lower())


if __name__ == "__main__":
    unittest.main()


