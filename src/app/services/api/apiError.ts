export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status = 500, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export function toErrorMessage(error: unknown, fallback = 'Erreur inconnue.'): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

/** Code métier renvoyé par le backend Nyra (ex. ALREADY_PROFESSIONAL). */
export function getApiErrorCode(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null;
  const details = error.details;
  if (!details || typeof details !== 'object') return null;
  const root = details as Record<string, unknown>;
  if (typeof root.code === 'string') return root.code;
  const nested = root.error;
  if (nested && typeof nested === 'object' && typeof (nested as Record<string, unknown>).code === 'string') {
    return (nested as Record<string, unknown>).code as string;
  }
  return null;
}
