const API_BASE_URL = "http://10.56.142.50:8000";

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

export async function createMissingPersonCase(
  data: CaseCreate
): Promise<CasePublicCreateResponse> {
  const response = await fetch(`${API_BASE_URL}/api/cases`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to create case");
  }

  return response.json();
}

export async function searchCase(
  query: string
): Promise<CasePublicSearchResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/cases/search?q=${encodeURIComponent(query)}`
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Case not found");
  }

  return response.json();
}

export async function getCase(
  caseId: string
): Promise<CaseResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/cases/${encodeURIComponent(caseId)}`
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to get case");
  }

  return response.json();
}

// --------------------
// MATCHING
// --------------------

export async function generateMatches(
  caseId: number
): Promise<MatchResponse[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/cases/${caseId}/generate-matches`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to generate matches");
  }

  return response.json();
}

export async function getCaseMatches(
  caseId: number
): Promise<MatchResponse[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/cases/${caseId}/matches`
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to get case matches");
  }

  return response.json();
}

export async function getMatch(
  matchId: number
): Promise<MatchDetailResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/matches/${matchId}`
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to get match details");
  }

  return response.json();
}

export async function verifyMatch(
  matchId: number
): Promise<MatchResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/matches/${matchId}/verify`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to verify match");
  }

  return response.json();
}

export async function rejectMatch(
  matchId: number
): Promise<MatchResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/matches/${matchId}/reject`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to reject match");
  }

  return response.json();
}

export async function requestMatchInfo(
  matchId: number
): Promise<MatchResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/matches/${matchId}/request-info`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to request match information");
  }

  return response.json();
}