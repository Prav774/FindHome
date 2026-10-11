const AUTHORITY_SESSION_KEY = "findhome_authority_authenticated";
const AUTHORITY_USER_KEY = "findhome_authority_user";

export interface AuthorityUser {
  id: number;
  name: string;
  email: string;
}

export function isAuthorityAuthenticated(): boolean {
  return window.sessionStorage.getItem(AUTHORITY_SESSION_KEY) === "true";
}

export function startAuthoritySession(user?: AuthorityUser): void {
  window.sessionStorage.setItem(AUTHORITY_SESSION_KEY, "true");
  if (user) {
    try {
      window.sessionStorage.setItem(AUTHORITY_USER_KEY, JSON.stringify(user));
    } catch {
      // Ignore storage errors
    }
  }
}

export function getAuthorityUser(): AuthorityUser | null {
  const raw = window.sessionStorage.getItem(AUTHORITY_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthorityUser;
  } catch {
    return null;
  }
}

export function clearAuthoritySession(): void {
  window.sessionStorage.removeItem(AUTHORITY_SESSION_KEY);
  window.sessionStorage.removeItem(AUTHORITY_USER_KEY);
}

