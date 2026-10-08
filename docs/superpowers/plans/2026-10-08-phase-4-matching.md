# Phase 4 Deterministic Matching Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add deterministic, explainable person matching, match generation/detail APIs, next-evidence recommendations, and a clearly marked demo seed flow.

**Architecture:** Keep matching calculation pure and separate from persistence. The match service loads existing models, stores only score/status/explanation in `Match`, and dynamically derives evidence details for API responses. The demo creates one unresolved person with three source observations and timeline events; humans remain responsible for verification.

**Tech Stack:** Python 3.10, FastAPI, Pydantic 2, SQLAlchemy, PostgreSQL/PostGIS, Python standard library (`difflib`, `re`, `unicodedata`).

**Spec:** `docs/superpowers/specs/2026-10-08-phase-4-matching-design.md`

## Global Constraints

- Do not add database tables, migrations, or schema changes.
- Keep PostgreSQL and PostGIS; do not add another database or infrastructure technology.
- Matching is deterministic and explainable; report evidence strength, never probability.
- Never automatically set a match or person to `VERIFIED`.
- Missing information is missing evidence, not an invented value or negative signal.
- Use one unresolved demo `Person`, three organization `SourceRecord` observations, and clearly marked demo `TimelineEvent` entries.
- Preserve existing verify, reject, request-info, and list-match API behavior.
- Do not commit or push.

## Review Focus

- Missing Case age/gender columns: preserve them as missing unless explicitly available in text; cover missing-score behavior in matching tests.
- Explicit age in free-form Case description: parse only a clear age cue; cover absent and unparseable age text.
- Conflicting observations across SourceRecords: report conflict without eliminating the candidate; cover minor age and incompatible gender examples.
- Repeated generation: update the existing case/person row without duplicating it or changing its status; cover `POTENTIAL_MATCH` and reviewed statuses.
- Demo timeline ordering and unknown identity: ensure the events progress from Railway Station (Rescue Team observation) to Shelter A to Hospital B, and no data or status claims a verified identity.

---

### Task 1: Deterministic Match Calculation

**Files:**
- Create: `backend/app/services/matching.py`
- Create: `backend/tests/test_matching.py`

**Interfaces:**
- Consumes: existing ORM `Case`, `Person`, `SourceRecord`, and `Evidence` objects.
- Produces: `calculate_match(case, person, source_records, evidence) -> dict` with keys `score`, `supporting_evidence`, `conflicting_evidence`, `missing_evidence`, `explanation`, and `status`.
- Score type: numeric 0–100; status always `POTENTIAL_MATCH`.
- Each evidence list contains frontend-friendly strings, not internal implementation details.

- [ ] **Step 1: Write focused tests** for same-name/location support, minor age difference as a conflict without rejection, incompatible known gender as a strong conflict, source aliases/descriptions contributing, explicit case age parsing, and missing data not reducing score.
- [ ] **Step 2: Run the tests and confirm they fail** because `calculate_match` is not implemented.
- [ ] **Step 3: Implement the deterministic score** with maxima name 30, age 15, gender 10, physical description 20, location 15, source/evidence consistency 10. Normalize text consistently; use `SequenceMatcher` for names; cap score at 100. Do not penalize unavailable inputs. Extract age only from explicit text cues in the existing Case description; use `Case.last_seen_location` for location.
- [ ] **Step 4: Run the focused tests** and confirm evidence categories, score bounds, explanation, and `POTENTIAL_MATCH` output.

### Task 2: Next-Best Evidence Recommendation

**Files:**
- Create: `backend/app/services/verification.py`
- Create: `backend/tests/test_verification.py`

**Interfaces:**
- Consumes: `case`, `person`, `supporting_evidence`, `conflicting_evidence`.
- Produces: `recommend_next_evidence(case, person, supporting_evidence, conflicting_evidence) -> {"question": str, "reason": str}`.

- [ ] **Step 1: Write tests** for missing physical description, age conflict, uncertain location, weak name, and deterministic fallback when those signals are all adequate or unavailable.
- [ ] **Step 2: Run the tests and confirm they fail** because the recommendation function is absent.
- [ ] **Step 3: Implement a fixed-priority, explainable recommendation** using the approved prompts: collect a distinctive physical mark, verify approximate age/date of birth, confirm last known location, or collect alternate name/spelling/alias. Select based on the evidence gaps/conflicts; do not make identity claims.
- [ ] **Step 4: Run the focused tests** and confirm each condition returns the expected question and reason.

### Task 3: Match Persistence and Candidate Generation

**Files:**
- Create: `backend/app/services/match_service.py`
- Create: `backend/tests/test_match_service.py`

**Interfaces:**
- Consumes: SQLAlchemy `Session`, `case_id: int`; Task 1 calculation function.
- Produces: `generate_matches_for_case(db, case_id) -> list[Match]` sorted by score descending. If the case is absent, raise `ValueError` (the API translates it to HTTP 404).

- [ ] **Step 1: Write tests** for case not found, candidates below/above 40 threshold, loading each candidate's records/evidence, upserting same case/person, preserving existing statuses, and new status `POTENTIAL_MATCH`.
- [ ] **Step 2: Run the tests and confirm they fail** because the service is absent.
- [ ] **Step 3: Implement generation** by querying the Case, Persons, each person's SourceRecords and Evidence, and calculating matches. Persist only candidates scoring at least 40. For an existing pair update score and explanation but preserve its status; create a new pair with `POTENTIAL_MATCH`. Commit changes once and return candidates ordered by score.
- [ ] **Step 4: Run the focused tests** and confirm the threshold, update behavior, and no-duplicate behavior.

### Task 4: Match Response Schemas and API Endpoints

**Files:**
- Modify: `backend/app/schemas/match.py`
- Modify: `backend/app/routes/matches.py`
- Create: `backend/tests/test_match_routes.py`

**Interfaces:**
- `POST /api/cases/{case_id}/generate-matches` returns a list of match summaries, including score, status, and explanation.
- `GET /api/matches/{match_id}` returns `id`, `case_id`, `person_id`, `score`, `status`, `explanation`, `supporting_evidence`, `conflicting_evidence`, `missing_evidence`, and `next_best_evidence`.
- Detail fields are derived using the calculation and recommendation services; no model changes.

- [ ] **Step 1: Write API tests** for successful generation, 404 missing case, 404 missing match, correct detail response fields, existing list/action endpoints remaining present, and no generated `VERIFIED` status.
- [ ] **Step 2: Run the tests and confirm they fail** for the missing endpoints/response fields.
- [ ] **Step 3: Implement schemas and routes** using `APIRouter`, `Depends(get_db)`, existing models, and HTTP 404 errors. Recompute detail evidence from current Case, Person, SourceRecord, and Evidence data. Keep existing match status action routes intact.
- [ ] **Step 4: Run the route tests** and inspect OpenAPI to confirm endpoint paths and response schema.

### Task 5: Demo Seed Endpoint and Timeline

**Files:**
- Create: `backend/app/routes/demo.py`
- Create: `backend/tests/test_demo_routes.py`
- Modify: `backend/app/main.py`

**Interfaces:**
- `POST /api/demo/seed` is registered with tag `Demo` and returns the created case ID and person ID for subsequent API calls.
- Demo router is registered from `main.py`; the match router uses tag `Matching` and the demo router uses tag `Demo`.

- [ ] **Step 1: Write tests** that seed the case Arun Kumar with age 42 stated in its description, last-seen location Railway Station, and description "Wearing blue shirt"; one `UNKNOWN` male Person; three DEMO-marked SourceRecords for Rescue Team (unknown male, estimated age 40–45, Railway Station, blue shirt, scar on right hand), Shelter A (Arun K, age 43, Shelter A, blue shirt), and Hospital B (A Kumar, age 43, Hospital B, male); and chronological TimelineEvents from Railway Station (Rescue Team report) to Shelter A to Hospital B. Assert no match/person is verified.
- [ ] **Step 2: Run the tests and confirm they fail** because the route is absent.
- [ ] **Step 3: Implement seed transaction** with those demo facts. Store the supplied Case age in an explicit description cue because there is no Case age column; use `last_seen_location`. Leave the Person's structured age missing; store the 40–45 estimate as source-description text because `raw_age` is a single integer. Keep the unified Person unresolved and clearly label demo data in each SourceRecord observation. Commit related inserts together and return IDs. Do not seed a verified match.
- [ ] **Step 4: Run demo route tests** and confirm the records and chronological timeline are created as designed.

### Task 6: Full Verification and Demo Flow

**Files:**
- No application files; verification only.

- [ ] **Step 1: Run Python compilation** from `backend`: `..\.venv\Scripts\python.exe -m compileall -q app`.
- [ ] **Step 2: Run focused and project tests** from `backend` using the repository's available test command; record any existing or introduced failures.
- [ ] **Step 3: Import the app and inspect OpenAPI**: load `app.main:app`, confirm Swagger schema includes seed, generation, and detail endpoints.
- [ ] **Step 4: Start the server** with `..\.venv\Scripts\python.exe -m uvicorn app.main:app --reload`; confirm `/docs` loads.
- [ ] **Step 5: Exercise the live database flow** by POSTing `/api/demo/seed`, POSTing generation for the returned case ID, and GETting a returned match ID. Confirm at least one `POTENTIAL_MATCH` and all requested evidence/detail fields, and confirm no automatic verification.
- [ ] **Step 6: Report** changed files, absence of schema/database changes, exact commands used, demo-flow result, and any errors. Do not commit or push.
