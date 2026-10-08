const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://10.56.142.50:8000"
).replace(/\/+$/, "");

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(API_BASE_URL + path, init);
  if (!response.ok) {
    const body = await response.text();
    let message = body;
    try {
      const parsed: unknown = JSON.parse(body);
      if (typeof parsed === "object" && parsed !== null && "detail" in parsed) {
        const detail = (parsed as { detail?: unknown }).detail;
        message = typeof detail === "string" ? detail : JSON.stringify(detail);
      }
    } catch {
      // Keep plain-text error bodies readable.
    }
    throw new Error(message || "Request failed (" + response.status + ")");
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

const jsonHeaders = { "Content-Type": "application/json" };

// --------------------
// CASES
// --------------------

export interface CaseCreate {
  name: string;
  age?: number | null;
  gender?: string | null;
  description?: string | null;
  last_seen_location?: string | null;
  clothing?: string | null;
  identifying_marks?: string | null;
}

export interface CasePublicCreateResponse {
  case_id: string;
  status: string;
}

export interface CasePublicSearchResponse {
  case_id: string;
  name: string;
  age: number | null;
  gender: string | null;
  last_seen_location: string | null;
  clothing: string | null;
  identifying_marks: string | null;
  status: string;
}

export interface CaseResponse {
  id: number;
  name: string;
  description: string | null;
  last_seen_location: string | null;
  status: string;
  created_at: string;
  updated_at: string | null;
}

// --------------------
// PERSONS
// --------------------

export interface PersonCreate {
  name: string | null;
  age: number | null;
  gender: string | null;
  physical_description: string | null;
  status: string;
}

export interface PersonResponse {
  id: number;
  name: string | null;
  age: number | null;
  gender: string | null;
  physical_description: string | null;
  status: string;
  created_at: string;
}

// --------------------
// PERSON RECORDS
// --------------------

export interface PersonRecordCreate {
  person_id: number;
  organization: string;
  source_type: string;
  raw_name: string | null;
  raw_age: number | null;
  raw_description: string | null;
  location: string | null;
  recorded_at: string | null;
}

export interface PersonRecordResponse {
  id: number;
  person_id: number | null;
  organization: string;
  source_type: string;
  raw_name: string | null;
  raw_age: number | null;
  raw_description: string | null;
  location: string | null;
  recorded_at: string | null;
  created_at: string;
}

// --------------------
// MATCHING
// --------------------

export interface MatchResponse {
  id: number;
  case_id: number;
  person_id: number;
  score: number;
  status: string;
  explanation: string | null;
  created_at: string;
}

export interface MatchDetailResponse extends MatchResponse {
  supporting_evidence: string[];
  conflicting_evidence: string[];
  missing_evidence: string[];
  next_best_evidence: Record<string, string>;
}

// --------------------
// TIMELINE
// --------------------

export interface TimelineEventResponse {
  id: number;
  person_id: number;
  event_type: string;
  location: string | null;
  description: string | null;
  event_time: string | null;
  source: string | null;
  created_at: string;
}

// --------------------
// API FUNCTIONS
// --------------------

export function createMissingPersonCase(
  data: CaseCreate
): Promise<CasePublicCreateResponse> {
  return request<CasePublicCreateResponse>("/api/cases", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(data),
  });
}

export function searchCase(query: string): Promise<CasePublicSearchResponse> {
  return request<CasePublicSearchResponse>(
    "/api/cases/search?q=" + encodeURIComponent(query)
  );
}

export function getCase(caseId: string): Promise<CaseResponse> {
  return request<CaseResponse>("/api/cases/" + encodeURIComponent(caseId));
}

export function getCases(): Promise<CaseResponse[]> {
  return request<CaseResponse[]>("/api/cases");
}

export function getPerson(personId: number): Promise<PersonResponse> {
  return request<PersonResponse>("/api/persons/" + personId);
}

export function getPersonTimeline(
  personId: number
): Promise<TimelineEventResponse[]> {
  return request<TimelineEventResponse[]>("/api/persons/" + personId + "/timeline");
}

export function generateMatches(caseId: number): Promise<MatchResponse[]> {
  return request<MatchResponse[]>("/api/cases/" + caseId + "/generate-matches", {
    method: "POST",
    headers: jsonHeaders,
  });
}

export function getCaseMatches(caseId: number): Promise<MatchResponse[]> {
  return request<MatchResponse[]>("/api/cases/" + caseId + "/matches");
}

export function getMatch(matchId: number): Promise<MatchDetailResponse> {
  return request<MatchDetailResponse>("/api/matches/" + matchId);
}

export function verifyMatch(matchId: number): Promise<MatchResponse> {
  return request<MatchResponse>("/api/matches/" + matchId + "/verify", {
    method: "POST",
    headers: jsonHeaders,
  });
}

export function rejectMatch(matchId: number): Promise<MatchResponse> {
  return request<MatchResponse>("/api/matches/" + matchId + "/reject", {
    method: "POST",
    headers: jsonHeaders,
  });
}

export function requestMatchInfo(matchId: number): Promise<MatchResponse> {
  return request<MatchResponse>("/api/matches/" + matchId + "/request-info", {
    method: "POST",
    headers: jsonHeaders,
  });
}
