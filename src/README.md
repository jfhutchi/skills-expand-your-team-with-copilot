# Mergington High School Activities

A super simple website application that allows students to view and sign up for extracurricular activities.

## Features

- View all available extracurricular activities
- Sign up for activities
- Filter activities by difficulty and see the level on each labelled card

## Difficulty tracks

Use **Filter by difficulty** in the sidebar:

- **Any difficulty** is the initial, unfiltered view and shows every activity
- **Beginner**, **Intermediate**, and **Advanced** show only activities explicitly
  marked with that level
- **All** shows only activities with no specified difficulty, meaning they welcome
  every level. It does not show activities marked Beginner, Intermediate, or Advanced

Difficulty works together with search, category, day, and time filters. Select
**Any difficulty** to clear just the difficulty filter. Activities without a
difficulty have no difficulty label on their cards.

The activity data supports an optional `difficulty` field containing exactly
`Beginner`, `Intermediate`, or `Advanced`. Omit the field for an activity open to
all levels; older records, `null`, and empty values remain supported. Existing
activities are left unchanged, so their levels are not guessed and student
enrollments and teacher edits are preserved. This feature does not add a new
activity-editing screen.

The API accepts the same filter, for example `/activities?difficulty=Beginner`
or `/activities?difficulty=All`. Omit the query parameter for every difficulty.
Invalid filter values return a validation error (HTTP 422).

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
node --test tests/test_*.js
```

The Python tests use an in-memory MongoDB substitute and do not connect to or
modify a live database. The JavaScript tests require Node.js 18 or newer and
exercise the real difficulty filtering, card rendering, and button handlers with
lightweight browser-element substitutes. They do not replace a visual browser check.

## Development Guide

For detailed setup and development instructions, please refer to our [Development Guide](../docs/how-to-develop.md).
