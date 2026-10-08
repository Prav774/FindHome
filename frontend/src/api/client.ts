const API_BASE_URL = "http://10.56.142.50:8000";

export interface CreateCaseRequest {
  name: string;
  age?: number | null;
  gender?: string | null;
  last_seen_location?: string | null;
  clothing?: string | null;
  identifying_marks?: string | null;
}

export interface CreateCaseResponse {
  case_id: string;
  status: string;
}

export async function createMissingPersonCase(
  data: CreateCaseRequest
): Promise<CreateCaseResponse> {
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

export async function searchCase(query: string) {
  const response = await fetch(
    `${API_BASE_URL}/api/cases/search?q=${encodeURIComponent(query)}`
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Case not found");
  }

  return response.json();
}