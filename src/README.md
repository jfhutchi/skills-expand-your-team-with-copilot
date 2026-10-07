# Mergington High School Activities

A super simple website application that allows students to view and sign up for extracurricular activities.

## Features

- View all available extracurricular activities
- Sign up for activities

## Manga Maniacs

Explore Japanese manga with fellow readers every Tuesday at 7:00 PM, with
space for 15 participants. Find **Manga Maniacs** in the activity list, search
by its name, or select the Tuesday filter. A teacher can register students
using the existing sign-up flow.

Restart the application after updating to add the club to an existing
database. Existing activities, enrollments, and teacher edits are preserved.
Only a start time has been announced, so the listing does not invent an end time.

## Tests

From the repository root, install the development requirements and run:

```bash
pip install -r src/requirements-dev.txt
python -m unittest discover -s tests -p 'test_*.py' -v
node --test tests/test_schedule.js
```

The Python tests use an in-memory MongoDB substitute and do not connect to or
modify a live database. The JavaScript tests require Node.js 18 or newer.

## Development Guide

For detailed setup and development instructions, please refer to our [Development Guide](../docs/how-to-develop.md).
