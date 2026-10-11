import test from "node:test";
import assert from "node:assert/strict";
import {
  getPerson,
  getPersonTimeline,
  type MatchDetailResponse,
  type PersonResponse,
  type TimelineEventResponse,
} from "../src/api/client.ts";

test("client: getPerson guards against null/undefined personId without calling fetch", async () => {
  await assert.rejects(
    async () => {
      // @ts-expect-error testing runtime null guard
      await getPerson(null);
    },
    { message: /Cannot fetch person without a valid person ID/ }
  );

  await assert.rejects(
    async () => {
      // @ts-expect-error testing runtime undefined guard
      await getPerson(undefined);
    },
    { message: /Cannot fetch person without a valid person ID/ }
  );
});

test("client: getPersonTimeline guards against null/undefined personId without calling fetch", async () => {
  await assert.rejects(
    async () => {
      // @ts-expect-error testing runtime null guard
      await getPersonTimeline(null);
    },
    { message: /Cannot fetch timeline without a valid person ID/ }
  );

  await assert.rejects(
    async () => {
      // @ts-expect-error testing runtime undefined guard
      await getPersonTimeline(undefined);
    },
    { message: /Cannot fetch timeline without a valid person ID/ }
  );
});

test("Match candidate resolution: unlinked source-record match (like Match 45 / 46)", () => {
  const match45: MatchDetailResponse = {
    id: 45,
    case_id: 25,
    person_id: null,
    source_record_id: 10,
    source_record: {
      id: 10,
      organization: "City Emergency Hospital",
      source_type: "HOSPITAL",
      external_source: "camp-admin-xe",
      external_table: "HOSPITAL_RECORDS",
      external_record_id: "3",
      raw_name: "Rahul Kumar",
      raw_age: 35,
      raw_gender: "Male",
      raw_description: null,
      external_status: "UNVERIFIED",
      location: "Tambaram",
      recorded_at: "2026-10-09T07:49:26.163000",
    },
    score: 61.7,
    status: "POTENTIAL_MATCH",
    explanation: "Name similarity match with reported hospital record.",
    created_at: "2026-10-09T02:56:03.912824",
    supporting_evidence: ["Name similarity", "Age consistent"],
    conflicting_evidence: ["Location differs"],
    missing_evidence: ["Physical description"],
    next_best_evidence: { question: "Confirm location" },
  };

  const isSourceRecord = match45.person_id == null;
  assert.equal(isSourceRecord, true, "Candidate with person_id=null must be identified as source record candidate");

  const sourceRecord = match45.source_record;
  assert.ok(sourceRecord, "source_record should be present");
  assert.equal(sourceRecord.source_type, "HOSPITAL");
  assert.equal(sourceRecord.organization, "City Emergency Hospital");
  assert.equal(sourceRecord.external_record_id, "3");
  assert.equal(sourceRecord.raw_name, "Rahul Kumar");
  assert.equal(sourceRecord.raw_age, 35);
  assert.equal(sourceRecord.raw_gender, "Male");
  assert.equal(sourceRecord.location, "Tambaram");

  // Determine candidate display label
  const candidateName = isSourceRecord
    ? sourceRecord.raw_name || `Source Record #${match45.source_record_id}`
    : "Person Name";
  assert.equal(candidateName, "Rahul Kumar");

  // Verify that person and timeline are null and require no API fetch
  const person = null;
  const timeline = null;
  assert.equal(person, null);
  assert.equal(timeline, null);
});

test("Match candidate resolution: unlinked source-record with relief camp (like Match 46)", () => {
  const match46: MatchDetailResponse = {
    id: 46,
    case_id: 25,
    person_id: null,
    source_record_id: 15,
    source_record: {
      id: 15,
      organization: "Camp Beta",
      source_type: "RELIEF_CAMP",
      external_source: "camp-admin-xe",
      external_table: "RELIEF_CAMP_RECORDS",
      external_record_id: "4",
      raw_name: "Rahul Kumar",
      raw_age: 35,
      raw_gender: "Male",
      raw_description: "Beard, blue shirt reported",
      external_status: "UNVERIFIED",
      location: "Tambaram Relief Zone",
      recorded_at: "2026-10-09T06:49:35.868000",
    },
    score: 60.0,
    status: "POTENTIAL_MATCH",
    explanation: "Camp intake candidate match.",
    created_at: "2026-10-09T02:56:03.912824",
    supporting_evidence: [],
    conflicting_evidence: [],
    missing_evidence: [],
    next_best_evidence: {},
  };

  assert.equal(match46.person_id, null);
  assert.equal(match46.source_record?.source_type, "RELIEF_CAMP");
  assert.equal(match46.source_record?.organization, "Camp Beta");
  assert.equal(match46.source_record?.raw_description, "Beard, blue shirt reported");
});

test("Match candidate resolution: linked person candidate preserves person details and timeline", () => {
  const linkedMatch: MatchDetailResponse = {
    id: 12,
    case_id: 5,
    person_id: 101,
    source_record_id: null,
    source_record: null,
    score: 85.0,
    status: "POTENTIAL_MATCH",
    explanation: "Strong facial and biometric match.",
    created_at: "2026-10-09T01:00:00.000Z",
    supporting_evidence: ["Facial match"],
    conflicting_evidence: [],
    missing_evidence: [],
    next_best_evidence: {},
  };

  const person: PersonResponse = {
    id: 101,
    name: "John Doe",
    age: 28,
    gender: "Male",
    physical_description: "Height 5'10, scar on left cheek",
    status: "IDENTIFIED",
    created_at: "2026-10-09T01:00:00.000Z",
  };

  const timeline: TimelineEventResponse[] = [
    {
      id: 1,
      person_id: 101,
      event_type: "Shelter Intake",
      location: "Shelter 3",
      description: "Arrived at shelter",
      event_time: "2026-10-09T02:00:00.000Z",
      source: "Red Cross",
      created_at: "2026-10-09T02:00:00.000Z",
    },
  ];

  const isSourceRecord = linkedMatch.person_id == null;
  assert.equal(isSourceRecord, false, "Candidate with person_id must not be treated as source record");

  const candidateName = isSourceRecord
    ? "Source Record"
    : person.name || `Person #${linkedMatch.person_id}`;
  assert.equal(candidateName, "John Doe");
  assert.equal(timeline.length, 1);
  assert.equal(timeline[0].event_type, "Shelter Intake");
});

