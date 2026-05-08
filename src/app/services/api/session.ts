export function getStoredAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem('nyra-auth');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: { token?: string | null } };
    return parsed.state?.token ?? null;
  } catch {
    return null;
  }
}
