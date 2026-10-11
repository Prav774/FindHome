const FAMILY_SESSION_KEY = "findhome_family_authenticated";
const FAMILY_USER_KEY = "findhome_family_user";

export interface FamilyUser {
  id: number;
  name: string;
  email: string;
}

export function isFamilyAuthenticated(): boolean {
  return window.sessionStorage.getItem(FAMILY_SESSION_KEY) === "true";
}

export function startFamilySession(user?: FamilyUser): void {
  window.sessionStorage.setItem(FAMILY_SESSION_KEY, "true");
  if (user) {
    try {
      window.sessionStorage.setItem(FAMILY_USER_KEY, JSON.stringify(user));
    } catch {
      // Ignore storage errors
    }
  }
}

export function getFamilyUser(): FamilyUser | null {
  const raw = window.sessionStorage.getItem(FAMILY_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as FamilyUser;
  } catch {
    return null;
  }
}

export function clearFamilySession(): void {
  window.sessionStorage.removeItem(FAMILY_SESSION_KEY);
  window.sessionStorage.removeItem(FAMILY_USER_KEY);
}

