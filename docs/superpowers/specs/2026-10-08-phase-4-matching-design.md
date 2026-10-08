# Phase 4 Deterministic Matching Design

## Goal

Add an explainable person-resolution and family-match flow to REUNITE using the existing FastAPI, SQLAlchemy, and PostgreSQL stack. The system suggests candidates; a human remains responsible for identity verification.

## Constraints

- Keep the existing models and database schema; add no tables or migrations.
- Use deterministic Python standard-library matching, including `difflib.SequenceMatcher` for names.
- Treat each `SourceRecord` as an organization observation about one `Person`.
- Never set `VERIFIED` during candidate generation.
- Missing values remain missing evidence; do not fabricate fields or facts.
- Keep demo records clearly identified as demo data.

## Existing Model Fit

The current `Case` model has `name`, `description`, and `last_seen_location`, but no `age` or `gender` columns. Therefore, age and gender are unavailable as structured case fields and score as missing unless explicitly present in the case description. The demo will place its supplied age in the description and the matching service may read an explicit age cue from that text. Location uses `last_seen_location`. `Person` and its `SourceRecord` observations are loaded together; the best-supported observations contribute to comparison without changing the unified person's identity. Existing `Evidence` rows provide additional consistency signals.

The `Match` model stores only score, status, and explanation. Evidence arrays and next-best evidence will be derived at response time; no schema change is needed.

## Components

### Matching calculation

`app/services/matching.py` exposes `calculate_match(case, person, source_records, evidence)`. It returns a 0–100 match score, supporting, conflicting, and missing evidence arrays, a plain-language explanation, and `POTENTIAL_MATCH`. Signal maxima are name 30, age 15, gender 10, physical description 20, location 15, and source/evidence consistency 10. Missing signals do not incur negative points. Small age differences are described as conflicts without disqualifying candidates; incompatible known genders are a strong conflict. Text comparison is normalized and deterministic. Scores are evidence strength, not probability.

### Candidate generation

`app/services/match_service.py` exposes `generate_matches_for_case(db, case_id)`. It returns 404-compatible absence to the API layer when a case does not exist, loads people and their source/evidence rows, computes scores, and persists candidates scoring at least 40. Existing `(case_id, person_id)` rows are updated rather than duplicated. Existing statuses are preserved on update; new rows use `POTENTIAL_MATCH`. Generation never verifies a person or match.

### Next evidence

`app/services/verification.py` exposes `recommend_next_evidence(case, person, supporting_evidence, conflicting_evidence)` and returns one question/reason pair selected deterministically from the evidence gaps and conflicts.

### API and demo

The Matches router adds `POST /api/cases/{case_id}/generate-matches` and `GET /api/matches/{match_id}`. The detail response includes persisted match fields and dynamically calculated evidence arrays and next-best evidence. Existing verify, reject, request-info, and list routes remain available. A Demo-tagged `POST /api/demo/seed` creates one clearly marked unresolved demo person, three source observations, a case, and a chronological sequence of timeline events. It does not create a verified match. The endpoint is a development helper and is registered with the API as requested.

## Failure behavior

- Missing case or match IDs return HTTP 404.
- Invalid inputs use Pydantic/FastAPI validation.
- The seed operation commits its related demo objects together and returns their IDs for the follow-on API calls.
- A low score below 40 is omitted from generated candidates.
- No available signal is represented as missing evidence; it does not reject the person.

## Verification

Check compilation and imports, start the app, inspect generated OpenAPI paths, call the demo seed endpoint, generate matches for the returned case, and inspect a match detail response for score, all evidence categories, explanation, next-best evidence, and a non-verified status.
