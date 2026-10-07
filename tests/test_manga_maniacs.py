"""Regression coverage for the Manga Maniacs listing; no live database needed."""

from copy import deepcopy
import unittest
from unittest.mock import patch

import mongomock
from fastapi.testclient import TestClient

# Replace only the external MongoDB connection, then exercise the real app.
with patch("pymongo.MongoClient", mongomock.MongoClient):
    from src.app import app
    from src.backend import database


class MangaManiacsTests(unittest.TestCase):
    def setUp(self):
        database.activities_collection.delete_many({})
        database.teachers_collection.delete_many({})
        self.client = TestClient(app)

    def tearDown(self):
        self.client.close()

    def test_fresh_database_includes_manga_with_requested_details(self):
        database.init_database()
        club = database.activities_collection.find_one({"_id": "Manga Maniacs"})
        self.assertIsNotNone(club)
        self.assertEqual(club["schedule"], "Tuesdays at 7:00 PM")
        self.assertEqual(club["schedule_details"], {
            "days": ["Tuesday"], "start_time": "19:00"
        })
        self.assertEqual(club["max_participants"], 15)
        self.assertEqual(club["participants"], [])
        self.assertIn("Japanese manga", club["description"])
        self.assertIn("first volume", club["description"])

    def test_existing_database_gets_club_without_changing_other_activities(self):
        existing = {"_id": "Chess Club", "description": "Teacher's custom club",
                    "participants": ["existing@example.test"], "max_participants": 9}
        database.activities_collection.insert_one(deepcopy(existing))
        database.init_database()
        self.assertIsNotNone(database.activities_collection.find_one({"_id": "Manga Maniacs"}))
        self.assertEqual(database.activities_collection.find_one({"_id": "Chess Club"}), existing)
        self.assertEqual(database.activities_collection.count_documents({}), 2)

    def test_repeated_initialization_preserves_manga_enrollments_and_edits(self):
        existing = {"_id": "Manga Maniacs", "description": "Teacher's edited description",
                    "participants": ["reader@example.test"], "max_participants": 12}
        database.activities_collection.insert_one(deepcopy(existing))
        database.init_database()
        database.init_database()
        self.assertEqual(database.activities_collection.find_one({"_id": "Manga Maniacs"}), existing)
        self.assertEqual(database.activities_collection.count_documents({"_id": "Manga Maniacs"}), 1)

    def test_api_lists_club_and_filters_by_day_and_start_time(self):
        database.init_database()
        response = self.client.get("/activities")
        self.assertEqual(response.status_code, 200)
        self.assertIn("Manga Maniacs", response.json())
        self.assertIn("Manga Maniacs", self.client.get("/activities?day=Tuesday&start_time=18:00").json())
        self.assertNotIn("Manga Maniacs", self.client.get("/activities?day=Wednesday").json())
        self.assertNotIn("Manga Maniacs", self.client.get("/activities?start_time=20:00").json())


if __name__ == "__main__":
    unittest.main()
