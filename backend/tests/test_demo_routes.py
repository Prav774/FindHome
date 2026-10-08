import unittest
from datetime import datetime

from app.models.models import Case, Person, SourceRecord, TimelineEvent
from app.routes.demo import seed_demo_data


class DemoDB:
    def __init__(self): self.added, self.commits, self.rollbacks = [], 0, 0
    def add(self, item): self.added.append(item)
    def flush(self):
        for index, item in enumerate(self.added, 1):
            if getattr(item, "id", None) is None: item.id = index
    def commit(self):
        self.commits += 1
        for index, item in enumerate(self.added, 1):
            if getattr(item, "id", None) is None: item.id = index
    def refresh(self, item): pass
    def rollback(self): self.rollbacks += 1


class DemoRouteTests(unittest.TestCase):
    def test_seed_creates_demo_case_person_reports_and_chronological_timeline(self):
        db = DemoDB()
        response = seed_demo_data(db)
        case = next(item for item in db.added if isinstance(item, Case))
        person = next(item for item in db.added if isinstance(item, Person))
        records = [item for item in db.added if isinstance(item, SourceRecord)]
        events = sorted((item for item in db.added if isinstance(item, TimelineEvent)), key=lambda event: event.event_time)
        self.assertIn("DEMO", case.description.upper())
        self.assertIn("Age: 42", case.description)
        self.assertEqual(case.last_seen_location, "Railway Station")
        self.assertEqual(person.status, "UNKNOWN")
        self.assertIsNone(person.age)
        self.assertEqual(len(records), 3)
        self.assertEqual({record.organization for record in records}, {"Rescue Team", "Shelter A", "Hospital B"})
        self.assertTrue(all("DEMO" in record.raw_description.upper() for record in records))
        self.assertEqual([event.location for event in events], ["Railway Station", "Shelter A", "Hospital B"])
        self.assertEqual(response["case_id"], case.id)
        self.assertEqual(response["person_id"], person.id)
        self.assertEqual(db.commits, 1)

    def test_seed_does_not_create_a_verified_match(self):
        db = DemoDB()
        seed_demo_data(db)
        self.assertFalse(any(getattr(item, "status", None) == "VERIFIED" for item in db.added))


if __name__ == "__main__":
    unittest.main()


