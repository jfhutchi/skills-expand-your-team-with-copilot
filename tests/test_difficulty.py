"""Difficulty filtering uses an in-memory database and preserves legacy records."""

from copy import deepcopy
import unittest
from unittest.mock import patch

import mongomock
from fastapi.testclient import TestClient

with patch("pymongo.MongoClient", mongomock.MongoClient):
    from src.app import app
    from src.backend import database


class DifficultyTests(unittest.TestCase):
    def setUp(self):
        database.activities_collection.delete_many({})
        database.teachers_collection.delete_many({})
        self.client = TestClient(app)
        base = {
            "description": "A club for students",
            "schedule": "Tuesday, 3:00 PM - 4:00 PM",
            "schedule_details": {
                "days": ["Tuesday"], "start_time": "15:00", "end_time": "16:00"
            },
            "max_participants": 15,
            "participants": ["enrolled@example.test"],
        }
        self.activities = {
            "Open Club": deepcopy(base),
            "Null Club": {**deepcopy(base), "difficulty": None},
            "Empty Club": {**deepcopy(base), "difficulty": ""},
        }
        for level in ("Beginner", "Intermediate", "Advanced"):
            self.activities[f"{level} Club"] = {**deepcopy(base), "difficulty": level}
        for name, details in self.activities.items():
            database.activities_collection.insert_one({"_id": name, **deepcopy(details)})

    def tearDown(self):
        self.client.close()

    def test_omitted_filter_returns_every_activity_and_preserves_optional_field(self):
        response = self.client.get("/activities")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), self.activities)
        self.assertNotIn("difficulty", response.json()["Open Club"])

    def test_each_level_only_returns_that_difficulty(self):
        for level in ("Beginner", "Intermediate", "Advanced"):
            with self.subTest(level=level):
                response = self.client.get("/activities", params={"difficulty": level})
                self.assertEqual(response.status_code, 200)
                self.assertEqual(response.json(), {f"{level} Club": self.activities[f"{level} Club"]})

    def test_all_only_returns_activities_without_a_specified_difficulty(self):
        response = self.client.get("/activities", params={"difficulty": "All"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(set(response.json()), {"Open Club", "Null Club", "Empty Club"})

    def test_difficulty_combines_with_day_and_time_filters(self):
        params = {"difficulty": "Beginner", "day": "Tuesday", "start_time": "14:00", "end_time": "17:00"}
        self.assertEqual(set(self.client.get("/activities", params=params).json()), {"Beginner Club"})
        for extra in ({"day": "Monday"}, {"start_time": "16:00"}, {"end_time": "15:00"}):
            with self.subTest(extra=extra):
                self.assertEqual(self.client.get("/activities", params={**params, **extra}).json(), {})

    def test_unknown_difficulty_is_rejected(self):
        response = self.client.get("/activities", params={"difficulty": "Expert"})
        self.assertEqual(response.status_code, 422)

    def test_filtering_and_restart_preserve_enrollments_and_teacher_edits(self):
        before = list(database.activities_collection.find())
        self.client.get("/activities", params={"difficulty": "Beginner"})
        database.init_database()
        for activity in before:
            self.assertEqual(database.activities_collection.find_one({"_id": activity["_id"]}), activity)


if __name__ == "__main__":
    unittest.main()
